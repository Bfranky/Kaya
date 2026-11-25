// Data types matching the specification for WarehouseBook

export type Role = 'owner' | 'attendant' | 'accountant';

export interface Business {
  id: string;
  name: string;
  plan: string;
  settings?: Record<string, any>;
  createdAt: string;
}

export interface UserMembership {
  userId: string;
  businessId: string;
  role: Role;
  pin?: string; // Quick unlock 4-digit PIN for warehouse terminal
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  imageUrl?: string;
  photoUrl?: string;
  unitsPerCarton: number;
  costPrice: number;
  sellingPrice: number;
  active: boolean;
  stockCount: number; // calculated or cached cartons count
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  price: number;
  effectiveFrom: string;
  setBy: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string; // normal call number
  whatsappPhone?: string; // whatsapp number
  creditLimit?: number;
  currentBalance: number; // positive means owes money (debtor)
  isRegular?: boolean; // regular buyer from store
  purchaseCount?: number; // total purchases made
  notes?: string;
  createdAt: string;
}

export interface CustomerSpecialPrice {
  id: string;
  customerId: string;
  productId: string;
  price: number;
}

export type StockEventReason = 'purchase' | 'sale' | 'adjustment' | 'damage' | 'return';

export interface StockEvent {
  id: string;
  businessId: string;
  productId: string;
  deltaCartons: number; // e.g. +5 or -2
  reason: StockEventReason;
  sourceId?: string; // invoiceId or purchaseId
  notes?: string;
  createdBy: string;
  createdAt: string;
  synced?: boolean;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplier: string;
  date: string;
  receiptImageUrl?: string;
  status: 'entered' | 'confirmed';
  items: Array<{
    productId: string;
    cartons: number;
    costPerCarton: number;
  }>;
  totalCost: number;
  createdAt: string;
}

export interface OrderLine {
  productId: string;
  cartons: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  businessId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'confirmed' | 'rejected';
  lines: OrderLine[];
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'credit' | 'part_payment';

export interface InvoiceLine {
  productId: string;
  productName: string;
  cartons: number;
  pricePerCarton: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  dueDate?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'void';
  lines: InvoiceLine[];
  createdAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  method: 'cash' | 'transfer';
  note?: string;
  createdAt: string;
}

export interface DayClose {
  id: string;
  businessId: string;
  date: string;
  expectedCash: number;
  countedCash: number;
  difference: number;
  note?: string;
  closedBy: string;
  createdAt: string;
}

export interface OutboxItem {
  id: string;
  businessId: string;
  action: string;
  table: string;
  payload: any;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
}
