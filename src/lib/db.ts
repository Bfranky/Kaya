import Dexie, { Table } from 'dexie';
import {
  Product,
  Customer,
  CustomerSpecialPrice,
  ProductPriceHistory,
  StockEvent,
  Purchase,
  Order,
  Invoice,
  Payment,
  DayClose,
  OutboxItem,
} from '@/types';

export class WarehouseDatabase extends Dexie {
  products!: Table<Product, string>;
  productPrices!: Table<ProductPriceHistory, string>;
  customers!: Table<Customer, string>;
  customerPrices!: Table<CustomerSpecialPrice, string>;
  stockEvents!: Table<StockEvent, string>;
  purchases!: Table<Purchase, string>;
  orders!: Table<Order, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  dayCloses!: Table<DayClose, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('WarehouseBookDB');
    this.version(1).stores({
      products: 'id, businessId, name, active',
      productPrices: 'id, productId, effectiveFrom',
      customers: 'id, businessId, name, phone',
      customerPrices: 'id, customerId, productId',
      stockEvents: 'id, businessId, productId, reason, createdAt',
      purchases: 'id, businessId, date, status',
      orders: 'id, businessId, customerId, status, createdAt',
      invoices: 'id, businessId, customerId, status, paymentMethod, createdAt',
      payments: 'id, businessId, customerId, invoiceId, createdAt',
      dayCloses: 'id, businessId, date',
      outbox: 'id, businessId, status, createdAt',
    });
  }
}

export const db = new WarehouseDatabase();

// Seed initial biscuit products for the warehouse demo
export async function seedDemoData(businessId: string = 'biz_default') {
  const count = await db.products.count();
  if (count > 0) return;

  const demoProducts: Product[] = [
    {
      id: 'prod_1',
      businessId,
      name: 'Cabin Biscuit (Standard Carton)',
      imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80',
      unitsPerCarton: 24,
      costPrice: 4800,
      sellingPrice: 5500,
      active: true,
      stockCount: 120,
    },
    {
      id: 'prod_2',
      businessId,
      name: 'Cream Cracker Deluxe',
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
      unitsPerCarton: 12,
      costPrice: 6200,
      sellingPrice: 7000,
      active: true,
      stockCount: 85,
    },
    {
      id: 'prod_3',
      businessId,
      name: 'Shortcake Butter Bites',
      imageUrl: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?auto=format&fit=crop&w=400&q=80',
      unitsPerCarton: 30,
      costPrice: 5100,
      sellingPrice: 6000,
      active: true,
      stockCount: 40,
    },
    {
      id: 'prod_4',
      businessId,
      name: 'Chocolate Wafer Barrels',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
      unitsPerCarton: 20,
      costPrice: 7500,
      sellingPrice: 8600,
      active: true,
      stockCount: 65,
    },
  ];

  await db.products.bulkPut(demoProducts);

  const demoCustomers: Customer[] = [
    {
      id: 'cust_1',
      businessId,
      name: 'Mama Nkechi Provision Store',
      phone: '08031234567',
      whatsappPhone: '08031234567',
      creditLimit: 50000,
      currentBalance: 12000, // owes 12,000
      isRegular: true,
      purchaseCount: 28,
      notes: 'Frequent buyer, reliable payer every Friday',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'cust_2',
      businessId,
      name: 'Alhaji Musa Depot',
      phone: '08149876543',
      whatsappPhone: '08149876543',
      creditLimit: 150000,
      currentBalance: 0,
      isRegular: true,
      purchaseCount: 42,
      notes: 'Buys wholesale 20+ cartons weekly',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'cust_3',
      businessId,
      name: 'Blessing Supermarket',
      phone: '09022334455',
      whatsappPhone: '09022334455',
      creditLimit: 80000,
      currentBalance: 35000, // overdue
      isRegular: false,
      purchaseCount: 6,
      notes: 'Call before delivery, often asks for 7 days grace',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'cust_4',
      businessId,
      name: 'Brother Jude Retail Mart',
      phone: '07055667788',
      whatsappPhone: '07055667788',
      creditLimit: 40000,
      currentBalance: 0,
      isRegular: true,
      purchaseCount: 19,
      notes: 'Buys Cabin and Wafers regularly with instant transfer',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  await db.customers.bulkPut(demoCustomers);

  // Seed sample initial sales for weekly reporting
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const demoInvoices: Invoice[] = [
    {
      id: 'inv_101',
      businessId,
      customerId: 'cust_1',
      customerName: 'Mama Nkechi Provision Store',
      total: 55000,
      paidAmount: 43000,
      balanceDue: 12000,
      paymentMethod: 'part_payment',
      lines: [
        { productId: 'prod_1', productName: 'Cabin Biscuit (Standard Carton)', cartons: 10, pricePerCarton: 5500, subtotal: 55000 }
      ],
      status: 'partial',
      createdAt: new Date(now - 2 * dayMs).toISOString(),
    },
    {
      id: 'inv_102',
      businessId,
      customerId: 'cust_2',
      customerName: 'Alhaji Musa Depot',
      total: 140000,
      paidAmount: 140000,
      balanceDue: 0,
      paymentMethod: 'transfer',
      lines: [
        { productId: 'prod_2', productName: 'Cream Cracker Deluxe', cartons: 20, pricePerCarton: 7000, subtotal: 140000 }
      ],
      status: 'paid',
      createdAt: new Date(now - 4 * dayMs).toISOString(),
    },
    {
      id: 'inv_103',
      businessId,
      customerId: 'cust_3',
      customerName: 'Blessing Supermarket',
      total: 35000,
      paidAmount: 0,
      balanceDue: 35000,
      paymentMethod: 'credit',
      lines: [
        { productId: 'prod_4', productName: 'Chocolate Wafer Barrels', cartons: 4, pricePerCarton: 8600, subtotal: 34400 }
      ],
      status: 'unpaid',
      createdAt: new Date(now - 6 * dayMs).toISOString(),
    },
    {
      id: 'inv_104',
      businessId,
      customerId: 'cust_4',
      customerName: 'Brother Jude Retail Mart',
      total: 60000,
      paidAmount: 60000,
      balanceDue: 0,
      paymentMethod: 'cash',
      lines: [
        { productId: 'prod_3', productName: 'Shortcake Butter Bites', cartons: 10, pricePerCarton: 6000, subtotal: 60000 }
      ],
      status: 'paid',
      createdAt: new Date(now - 1 * dayMs).toISOString(),
    },
  ];

  await db.invoices.bulkPut(demoInvoices);
}
