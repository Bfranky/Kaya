# WarehouseBook: Biscuit Warehouse Stock, Sales & Credit System

**WarehouseBook** is an offline-first inventory, sales, and distributor credit management system engineered for biscuit warehouses.

Built to solve the challenges of unreliable power and internet, paper record leakage, debt tracking, and manual reconciliation.

---

## 🌟 Key Features

1. **Offline-First Architecture**:
   - Local storage powered by **Dexie (IndexedDB)**.
   - Outbox pattern for asynchronous queuing and cloud sync when connected.
   - Append-only stock event ledger (purchase, sale, damage, adjustment).

2. **Role-Based Access**:
   - **Owner (Boss)**: Full view of revenue, margins, price editing, cost price visibility, and user management.
   - **Sales Attendant**: Fast counter checkout, stock reception, receipt generation. Protected from modifying base prices or deleting history.
   - **Accountant**: Read-only ledger, daily reconciliation, Excel/PDF exports.

3. **Stock & Inventory**:
   - Carton-level tracking with unit-pack details.
   - Stock-in logging with supplier references and photo receipt tracking.

4. **Counter Sales & POS**:
   - Fast counter cash, transfer, and credit sales.
   - Automatic customer balance adjustment and receipt calculation.

5. **Credit & Debt Tracking**:
   - Per-distributor ledger with credit limits.
   - Overdue badges and one-tap **WhatsApp Payment Reminder** links.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Local DB**: Dexie.js (IndexedDB)
- **Icons**: Lucide React
- **Cloud Backend**: Supabase (Postgres, Auth, Storage)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd warehousebook
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```
