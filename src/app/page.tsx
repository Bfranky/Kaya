"use client";

import React, { useState, useEffect } from 'react';
import { db, seedDemoData } from '@/lib/db';
import { Product, Customer } from '@/types';
import { formatCurrency, recordStockEvent } from '@/lib/stockService';
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  FileText,
  Clock,
  Wifi,
  WifiOff,
  PlusCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function WarehouseDashboard() {
  const [role, setRole] = useState<'owner' | 'attendant' | 'accountant'>('owner');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'pos' | 'credit' | 'close'>('inventory');
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [cartonsToAdd, setCartonsToAdd] = useState<number>(10);
  const [supplierName, setSupplierName] = useState<string>('Golden Biscuits Ltd');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Quick POS sale state
  const [posProduct, setPosProduct] = useState<string>('');
  const [posQuantity, setPosQuantity] = useState<number>(1);
  const [posCustomer, setPosCustomer] = useState<string>('');
  const [posPaymentType, setPosPaymentType] = useState<'cash' | 'transfer' | 'credit'>('cash');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    async function init() {
      await seedDemoData();
      await refreshData();
    }
    init();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function refreshData() {
    const prods = await db.products.toArray();
    const custs = await db.customers.toArray();
    setProducts(prods);
    setCustomers(custs);
    if (prods.length > 0 && !selectedProduct) setSelectedProduct(prods[0].id);
    if (prods.length > 0 && !posProduct) setPosProduct(prods[0].id);
    if (custs.length > 0 && !posCustomer) setPosCustomer(custs[0].id);
  }

  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || cartonsToAdd <= 0) return;

    await recordStockEvent(
      'biz_default',
      selectedProduct,
      Number(cartonsToAdd),
      'purchase',
      role,
      undefined,
      `Received from ${supplierName}`
    );

    setAlertMsg(`Successfully recorded +${cartonsToAdd} cartons! Local ledger updated.`);
    setTimeout(() => setAlertMsg(null), 4000);
    await refreshData();
  }

  async function handleQuickSale(e: React.FormEvent) {
    e.preventDefault();
    const prod = products.find(p => p.id === posProduct);
    if (!prod || posQuantity <= 0) return;

    if (prod.stockCount < posQuantity) {
      alert(`Warning: Only ${prod.stockCount} cartons currently available!`);
      return;
    }

    await recordStockEvent(
      'biz_default',
      prod.id,
      -Number(posQuantity),
      'sale',
      role,
      undefined,
      `Sale to ${posCustomer || 'Walk-in'} (${posPaymentType})`
    );

    if (posPaymentType === 'credit' && posCustomer) {
      const cust = customers.find(c => c.id === posCustomer);
      if (cust) {
        const debtAmount = prod.sellingPrice * posQuantity;
        await db.customers.update(cust.id, {
          currentBalance: cust.currentBalance + debtAmount,
        });
      }
    }

    setAlertMsg(`Sale recorded! Deducted ${posQuantity} cartons of ${prod.name}.`);
    setTimeout(() => setAlertMsg(null), 4000);
    await refreshData();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-amber-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-amber-200" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">WarehouseBook</h1>
              <p className="text-xs text-amber-100">Biscuit Depot Stock & Credit Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 mr-1" /> : <WifiOff className="w-3.5 h-3.5 mr-1" />}
              {isOnline ? 'Online (Synced)' : 'Offline Mode (Local Active)'}
            </div>

            <div className="flex items-center bg-amber-700/60 rounded-lg px-2 py-1 text-xs">
              <span className="mr-1 text-amber-200">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="owner" className="text-black">Owner (Boss)</option>
                <option value="attendant" className="text-black">Attendant</option>
                <option value="accountant" className="text-black">Accountant</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {alertMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center shadow-sm">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
            <span className="text-sm font-medium">{alertMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'inventory' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            Inventory & Stock In
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'pos' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Quick Counter Sale
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'credit' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Debts & Credit Ledger
          </button>
        </div>

        {/* TAB 1: INVENTORY & STOCK-IN */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-800">Current Biscuit Stock Levels</h2>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {products.length} Products
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-medium text-xs border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Biscuit Variety</th>
                      <th className="px-4 py-3">Units/Ctn</th>
                      <th className="px-4 py-3">Available Cartons</th>
                      <th className="px-4 py-3">Price / Carton</th>
                      {role === 'owner' && <th className="px-4 py-3">Cost Price</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-3">{p.unitsPerCarton} pkts</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.stockCount < 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stockCount} cartons
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCurrency(p.sellingPrice)}
                        </td>
                        {role === 'owner' && (
                          <td className="px-4 py-3 text-slate-500">
                            {formatCurrency(p.costPrice)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center space-x-2 text-amber-700 font-semibold mb-4">
                <PlusCircle className="w-5 h-5" />
                <h2>Receive New Stock (Stock-In)</h2>
              </div>
              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Select Biscuit</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {p.stockCount} ctns)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cartons Received</label>
                  <input
                    type="number"
                    min="1"
                    value={cartonsToAdd}
                    onChange={(e) => setCartonsToAdd(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Supplier / Factory</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Confirm Stock Reception
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Writes locally first. Synced to Supabase when connected.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: COUNTER SALE */}
        {activeTab === 'pos' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Counter Cash / Credit Sale</h2>
            <p className="text-xs text-slate-500 mb-6">Designed for fast recording at the warehouse counter.</p>

            <form onSubmit={handleQuickSale} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer / Distributor</label>
                <select
                  value={posCustomer}
                  onChange={(e) => setPosCustomer(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentBalance > 0 ? `(Owes ${formatCurrency(c.currentBalance)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Product</label>
                <select
                  value={posProduct}
                  onChange={(e) => setPosProduct(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.sellingPrice)} ({p.stockCount} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cartons Sold</label>
                <input
                  type="number"
                  min="1"
                  value={posQuantity}
                  onChange={(e) => setPosQuantity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['cash', 'transfer', 'credit'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPosPaymentType(method)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        posPaymentType === method
                          ? 'border-amber-600 bg-amber-50 text-amber-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500">Total Calculation:</span>
                  <div className="text-xl font-bold text-slate-900">
                    {formatCurrency(
                      (products.find((p) => p.id === posProduct)?.sellingPrice || 0) * posQuantity
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Record Sale & Print
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: CREDIT / DEBT TRACKING */}
        {activeTab === 'credit' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-slate-800">Distributor & Customer Credit Ledger</h2>
                <p className="text-xs text-slate-500">Track outstanding payments and overdue debts</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-medium text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Customer Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Credit Limit</th>
                    <th className="px-4 py-3">Current Debt</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                      <td className="px-4 py-3">{c.creditLimit ? formatCurrency(c.creditLimit) : 'No Limit'}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {formatCurrency(c.currentBalance)}
                      </td>
                      <td className="px-4 py-3">
                        {c.currentBalance > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            Owing Debt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Clear
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.currentBalance > 0 && (
                          <a
                            href={`https://wa.me/${c.phone.replace(/^0/, '234')}?text=${encodeURIComponent(
                              `Hello ${c.name}, this is a reminder from Biscuit Warehouse regarding your pending balance of ${formatCurrency(c.currentBalance)}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Send WhatsApp Reminder
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
