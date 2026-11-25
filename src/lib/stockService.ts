import { db } from '@/lib/db';
import {
  StockEvent,
  StockEventReason,
  Customer,
  Product,
  Invoice,
  PaymentMethod,
  Payment,
} from '@/types';

// Outbox pattern for queueing offline transactions
export async function queueOutboxAction(businessId: string, action: string, table: string, payload: any) {
  const id = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await db.outbox.put({
    id,
    businessId,
    action,
    table,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
  return id;
}

// Record stock movement (append-only ledger principle)
export async function recordStockEvent(
  businessId: string,
  productId: string,
  deltaCartons: number,
  reason: StockEventReason,
  createdBy: string,
  sourceId?: string,
  notes?: string
) {
  const eventId = `stock_evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const event: StockEvent = {
    id: eventId,
    businessId,
    productId,
    deltaCartons,
    reason,
    sourceId,
    notes,
    createdBy,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  // Update local DB atomically
  await db.transaction('rw', db.stockEvents, db.products, db.outbox, async () => {
    await db.stockEvents.put(event);
    
    // Update product cached stock count
    const product = await db.products.get(productId);
    if (product) {
      const newStock = (product.stockCount || 0) + deltaCartons;
      await db.products.update(productId, { stockCount: Math.max(0, newStock) });
    }

    // Add to outbox for later sync
    await queueOutboxAction(businessId, 'INSERT', 'stock_events', event);
  });

  return event;
}

// Register a new customer (callable by Boss & Attendant)
export async function registerCustomer(customerData: {
  businessId?: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  creditLimit?: number;
  notes?: string;
  isRegular?: boolean;
}) {
  const businessId = customerData.businessId || 'biz_default';
  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newCustomer: Customer = {
    id: customerId,
    businessId,
    name: customerData.name.trim(),
    phone: customerData.phone.trim(),
    whatsappPhone: (customerData.whatsappPhone || customerData.phone).trim(),
    creditLimit: Number(customerData.creditLimit || 0),
    currentBalance: 0,
    isRegular: Boolean(customerData.isRegular),
    purchaseCount: 0,
    notes: customerData.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  await db.customers.put(newCustomer);
  await queueOutboxAction(businessId, 'INSERT', 'customers', newCustomer);
  return newCustomer;
}

// Add a new product / good with image support (callable by Boss)
export async function addProduct(productData: {
  businessId?: string;
  name: string;
  imageUrl?: string;
  unitsPerCarton: number;
  costPrice: number;
  sellingPrice: number;
  initialStock: number;
}) {
  const businessId = productData.businessId || 'biz_default';
  const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newProduct: Product = {
    id: productId,
    businessId,
    name: productData.name.trim(),
    imageUrl: productData.imageUrl || '',
    photoUrl: productData.imageUrl || '',
    unitsPerCarton: Number(productData.unitsPerCarton || 1),
    costPrice: Number(productData.costPrice || 0),
    sellingPrice: Number(productData.sellingPrice || 0),
    active: true,
    stockCount: Number(productData.initialStock || 0),
  };

  await db.products.put(newProduct);
  await queueOutboxAction(businessId, 'INSERT', 'products', newProduct);

  if (productData.initialStock > 0) {
    await recordStockEvent(
      businessId,
      productId,
      Number(productData.initialStock),
      'purchase',
      'owner',
      undefined,
      'Initial stock setup for new product'
    );
  }

  return newProduct;
}

// Record full sales order with invoice, stock deduction, and debtor ledger update
export async function recordSale(saleData: {
  businessId?: string;
  productId: string;
  cartons: number;
  customerId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  role: string;
}) {
  const businessId = saleData.businessId || 'biz_default';
  const product = await db.products.get(saleData.productId);
  if (!product) throw new Error('Product not found');
  if (product.stockCount < saleData.cartons) {
    throw new Error(`Insufficient stock. Only ${product.stockCount} cartons available.`);
  }

  const total = product.sellingPrice * saleData.cartons;
  let paidAmount = total;
  let balanceDue = 0;

  if (saleData.paymentMethod === 'credit') {
    paidAmount = 0;
    balanceDue = total;
  } else if (saleData.paymentMethod === 'part_payment') {
    paidAmount = saleData.paidAmount ?? 0;
    balanceDue = Math.max(0, total - paidAmount);
  }

  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const invoice: Invoice = {
    id: invoiceId,
    businessId,
    customerId: saleData.customerId || '',
    customerName: saleData.customerName || 'Walk-in Customer',
    total,
    paidAmount,
    balanceDue,
    paymentMethod: saleData.paymentMethod,
    status: balanceDue === 0 ? 'paid' : paidAmount === 0 ? 'unpaid' : 'partial',
    lines: [
      {
        productId: product.id,
        productName: product.name,
        cartons: saleData.cartons,
        pricePerCarton: product.sellingPrice,
        subtotal: total,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  await db.transaction('rw', db.invoices, db.customers, db.stockEvents, db.products, db.outbox, async () => {
    // 1. Save invoice
    await db.invoices.put(invoice);
    await queueOutboxAction(businessId, 'INSERT', 'invoices', invoice);

    // 2. If customer exists, update balance & purchase frequency
    if (saleData.customerId) {
      const customer = await db.customers.get(saleData.customerId);
      if (customer) {
        const newBalance = customer.currentBalance + balanceDue;
        const newPurchases = (customer.purchaseCount || 0) + 1;
        const isNowRegular = customer.isRegular || newPurchases >= 3;
        await db.customers.update(saleData.customerId, {
          currentBalance: newBalance,
          purchaseCount: newPurchases,
          isRegular: isNowRegular,
        });
      }
    }

    // 3. Deduct stock through event
    await recordStockEvent(
      businessId,
      product.id,
      -saleData.cartons,
      'sale',
      saleData.role,
      invoiceId,
      `Sale to ${saleData.customerName || 'Walk-in'} (${saleData.paymentMethod})`
    );
  });

  return invoice;
}

// Record customer debt repayment
export async function recordCustomerPayment(
  businessId: string = 'biz_default',
  customerId: string,
  amount: number,
  method: 'cash' | 'transfer',
  note?: string
) {
  const customer = await db.customers.get(customerId);
  if (!customer) throw new Error('Customer not found');

  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payment: Payment = {
    id: paymentId,
    businessId,
    customerId,
    amount,
    method,
    note,
    createdAt: new Date().toISOString(),
  };

  await db.transaction('rw', db.payments, db.customers, db.outbox, async () => {
    await db.payments.put(payment);
    const updatedBalance = Math.max(0, customer.currentBalance - amount);
    await db.customers.update(customerId, { currentBalance: updatedBalance });
    await queueOutboxAction(businessId, 'INSERT', 'payments', payment);
  });

  return payment;
}

// Format Currency in Nigerian Naira (NGN)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}
