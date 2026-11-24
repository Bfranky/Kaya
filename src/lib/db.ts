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
      creditLimit: 50000,
      currentBalance: 12000, // owes 12,000
      notes: 'Frequent buyer, reliable payer every Friday',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cust_2',
      businessId,
      name: 'Alhaji Musa Depot',
      phone: '08149876543',
      creditLimit: 150000,
      currentBalance: 0,
      notes: 'Buys wholesale 20+ cartons',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cust_3',
      businessId,
      name: 'Blessing Supermarket',
      phone: '09022334455',
      creditLimit: 80000,
      currentBalance: 35000, // overdue
      notes: 'Call before delivery',
      createdAt: new Date().toISOString(),
    },
  ];

  await db.customers.bulkPut(demoCustomers);
}
