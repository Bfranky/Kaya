"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db, seedDemoData } from '@/lib/db';
import { Product, Customer, Invoice } from '@/types';
import {
  formatCurrency,
  recordStockEvent,
  registerCustomer,
  addProduct,
  recordSale,
  recordCustomerPayment,
} from '@/lib/stockService';
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  Wifi,
  WifiOff,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageSquare,
  Image as ImageIcon,
  Star,
  Search,
  UserPlus,
  Plus,
  DollarSign,
  Calendar,
  X,
  Upload,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function WarehouseDashboard() {
  const [role, setRole] = useState<'owner' | 'attendant' | 'accountant'>('owner');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'pos' | 'customers' | 'financials'>('inventory');

  // Database state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [repayCustomer, setRepayCustomer] = useState<Customer | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustWhatsapp, setNewCustWhatsapp] = useState<string>('');
  const [newCustLimit, setNewCustLimit] = useState<number>(50000);
  const [newCustIsRegular, setNewCustIsRegular] = useState<boolean>(false);
  const [newCustNotes, setNewCustNotes] = useState<string>('');

  // New Product Form State
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdUnits, setNewProdUnits] = useState<number>(24);
  const [newProdCost, setNewProdCost] = useState<number>(5000);
  const [newProdSelling, setNewProdSelling] = useState<number>(6000);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdImage, setNewProdImage] = useState<string>('');

  // Stock-In Form State
  const [stockInProduct, setStockInProduct] = useState<string>('');
  const [stockInCartons, setStockInCartons] = useState<number>(20);
  const [stockInSupplier, setStockInSupplier] = useState<string>('Golden Biscuits Factory');

  // POS State
  const [posProduct, setPosProduct] = useState<string>('');
  const [posQuantity, setPosQuantity] = useState<number>(1);
  const [posCustomer, setPosCustomer] = useState<string>('');
  const [posPaymentType, setPosPaymentType] = useState<'cash' | 'transfer' | 'credit'>('cash');

  // Repayment State
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<'cash' | 'transfer'>('cash');
  const [repayNote, setRepayNote] = useState<string>('Debt clearance');

  // Customer filter & search
  const [customerFilter, setCustomerFilter] = useState<'all' | 'owing' | 'regular'>('all');
  const [customerSearch, setCustomerSearch] = useState<string>('');

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
    const invs = await db.invoices.reverse().toArray();
    setProducts(prods);
    setCustomers(custs);
    setInvoices(invs);

    if (prods.length > 0 && !stockInProduct) setStockInProduct(prods[0].id);
    if (prods.length > 0 && !posProduct) setPosProduct(prods[0].id);
  }

  function showNotification(msg: string) {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 4500);
  }

  // Adjust active tab when role changes
  useEffect(() => {
    if (role === 'accountant' && (activeTab === 'inventory' || activeTab === 'pos')) {
      setActiveTab('financials');
    } else if (role === 'attendant' && (activeTab === 'financials')) {
      setActiveTab('pos');
    }
  }, [role, activeTab]);

  // Handle adding new customer
  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Please provide customer name and phone number');
      return;
    }

    try {
      const added = await registerCustomer({
        name: newCustName,
        phone: newCustPhone,
        whatsappPhone: newCustWhatsapp || newCustPhone,
        creditLimit: newCustLimit,
        isRegular: newCustIsRegular,
        notes: newCustNotes,
      });

      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustWhatsapp('');
      setNewCustNotes('');
      setNewCustIsRegular(false);

      showNotification(`Customer "${added.name}" registered successfully!`);
      await refreshData();
    } catch (err: any) {
      alert('Error registering customer: ' + err.message);
    }
  }

  // Handle adding new good/product
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newProdName.trim()) {
      alert('Please provide biscuit/good name');
      return;
    }

    try {
      const added = await addProduct({
        name: newProdName,
        imageUrl: newProdImage || 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80',
        unitsPerCarton: newProdUnits,
        costPrice: newProdCost,
        sellingPrice: newProdSelling,
        initialStock: newProdStock,
      });

      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdImage('');
      setNewProdStock(50);

      showNotification(`Product "${added.name}" added to inventory with image!`);
      await refreshData();
    } catch (err: any) {
      alert('Error adding product: ' + err.message);
    }
  }

  // Handle image upload from file system
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle stock-in reception
  async function handleStockIn(e: React.FormEvent) {
    e.preventDefault();
    if (!stockInProduct || stockInCartons <= 0) return;

    await recordStockEvent(
      'biz_default',
      stockInProduct,
      Number(stockInCartons),
      'purchase',
      role,
      undefined,
      `Received from ${stockInSupplier}`
    );

    showNotification(`Added +${stockInCartons} cartons to stock!`);
    await refreshData();
  }

  // Handle POS Sale
  async function handlePOSSale(e: React.FormEvent) {
    e.preventDefault();
    const prod = products.find((p) => p.id === posProduct);
    if (!prod || posQuantity <= 0) return;

    if (prod.stockCount < posQuantity) {
      alert(`Warning: Only ${prod.stockCount} cartons available!`);
      return;
    }

    const selectedCust = customers.find((c) => c.id === posCustomer);

    try {
      await recordSale({
        productId: prod.id,
        cartons: posQuantity,
        customerId: selectedCust?.id,
        customerName: selectedCust?.name || 'Walk-in Customer',
        paymentMethod: posPaymentType,
        role,
      });

      showNotification(
        `Sale recorded: ${posQuantity} cartons of ${prod.name} (${posPaymentType})`
      );
      setPosQuantity(1);
      await refreshData();
    } catch (err: any) {
      alert('Error recording sale: ' + err.message);
    }
  }

  // Handle customer debt repayment
  async function handleRepayment(e: React.FormEvent) {
    e.preventDefault();
    if (!repayCustomer || repayAmount <= 0) return;

    try {
      await recordCustomerPayment(
        'biz_default',
        repayCustomer.id,
        repayAmount,
        repayMethod,
        repayNote
      );

      setShowPaymentModal(false);
      setRepayCustomer(null);
      setRepayAmount(0);
      showNotification(`Payment of ${formatCurrency(repayAmount)} recorded! Debt updated.`);
      await refreshData();
    } catch (err: any) {
      alert('Error recording payment: ' + err.message);
    }
  }

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch) ||
        (c.whatsappPhone && c.whatsappPhone.includes(customerSearch));

      if (!matchesSearch) return false;
      if (customerFilter === 'owing') return c.currentBalance > 0;
      if (customerFilter === 'regular') return Boolean(c.isRegular);
      return true;
    });
  }, [customers, customerFilter, customerSearch]);

  // Financial & Stock Valuation Calculations
  const stockValuation = useMemo(() => {
    let totalCartons = 0;
    let costValuation = 0;
    let sellingValuation = 0;

    products.forEach((p) => {
      totalCartons += p.stockCount || 0;
      costValuation += (p.stockCount || 0) * (p.costPrice || 0);
      sellingValuation += (p.stockCount || 0) * (p.sellingPrice || 0);
    });

    const potentialProfit = sellingValuation - costValuation;
    return { totalCartons, costValuation, sellingValuation, potentialProfit };
  }, [products]);

  const totalDebtOwed = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  }, [customers]);

  const [salesStats, setSalesStats] = useState({
    totalSalesRevenue: 0,
    totalCartonsSold: 0,
    weeklyRevenue: 0,
    weeklyCartons: 0,
    cashSales: 0,
    transferSales: 0,
    creditSales: 0,
  });

  const [weeklyDayBreakdown, setWeeklyDayBreakdown] = useState<
    Array<{ day: string; dateStr: string; total: number; cartons: number }>
  >([]);

  useEffect(() => {
    let totalSalesRevenue = 0;
    let totalCartonsSold = 0;
    let cashSales = 0;
    let transferSales = 0;
    let creditSales = 0;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    let weeklyRevenue = 0;
    let weeklyCartons = 0;

    invoices.forEach((inv) => {
      totalSalesRevenue += inv.total;
      const invDate = new Date(inv.createdAt).getTime();

      if (invDate >= sevenDaysAgo) {
        weeklyRevenue += inv.total;
      }

      if (inv.paymentMethod === 'cash') cashSales += inv.total;
      else if (inv.paymentMethod === 'transfer') transferSales += inv.total;
      else if (inv.paymentMethod === 'credit') creditSales += inv.total;

      inv.lines.forEach((l) => {
        totalCartonsSold += l.cartons;
        if (invDate >= sevenDaysAgo) {
          weeklyCartons += l.cartons;
        }
      });
    });

    setSalesStats({
      totalSalesRevenue,
      totalCartonsSold,
      weeklyRevenue,
      weeklyCartons,
      cashSales,
      transferSales,
      creditSales,
    });

    // Weekly breakdown by day for the last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { [key: string]: { day: string; dateStr: string; total: number; cartons: number } } = {};

    const nowDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowDate);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result[key] = {
        day: days[d.getDay()],
        dateStr: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        total: 0,
        cartons: 0,
      };
    }

    invoices.forEach((inv) => {
      const invKey = inv.createdAt.split('T')[0];
      if (result[invKey]) {
        result[invKey].total += inv.total;
        inv.lines.forEach((l) => {
          result[invKey].cartons += l.cartons;
        });
      }
    });

    setWeeklyDayBreakdown(Object.values(result));
  }, [invoices]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      {/* Top Navbar */}
      <header className="bg-amber-600 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-700/80 p-2 rounded-xl">
              <Package className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                WarehouseBook <span className="text-xs bg-amber-800/80 px-2 py-0.5 rounded-full font-medium text-amber-200">Biscuit Depot</span>
              </h1>
              <p className="text-xs text-amber-100">Stock, POS, Customer Debts & Financial Audit</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-inner ${
                isOnline ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 mr-1" /> : <WifiOff className="w-3.5 h-3.5 mr-1" />}
              {isOnline ? 'Online (Synced)' : 'Offline (Local Dexie)'}
            </div>

            {/* Quick Register Customer Button available in header for both Boss and Attendant */}
            {role !== 'accountant' && (
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center bg-amber-700 hover:bg-amber-800 text-amber-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                + Register Customer
              </button>
            )}

            {/* Role Switcher */}
            <div className="flex items-center bg-amber-800/80 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs">
              <span className="mr-1.5 text-amber-200 font-medium">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="owner" className="text-slate-900">Owner (Boss)</option>
                <option value="attendant" className="text-slate-900">Attendant</option>
                <option value="accountant" className="text-slate-900">Accountant</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {alertMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center shadow-md animate-fade-in">
            <CheckCircle2 className="w-5 h-5 mr-2.5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{alertMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
          {/* Inventory Tab (Boss & Attendant) */}
          {role !== 'accountant' && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'inventory'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              Goods & Stock
            </button>
          )}

          {/* POS Counter Sale (Boss & Attendant) */}
          {role !== 'accountant' && (
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'pos'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Counter POS Sale
            </button>
          )}

          {/* Customers & Debts (Boss & Accountant) */}
          {role !== 'attendant' && (
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'customers'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Customers & Debts
              {customers.filter((c) => c.currentBalance > 0).length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                  {customers.filter((c) => c.currentBalance > 0).length} owing
                </span>
              )}
            </button>
          )}

          {/* Financials & Weekly Sales (Boss & Accountant) */}
          {role !== 'attendant' && (
            <button
              onClick={() => setActiveTab('financials')}
              className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'financials'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Weekly Sales & Stock Valuation
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: GOODS & INVENTORY (Boss & Attendant)             */}
        {/* ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/70">
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">Biscuit Varieties & Stock Levels</h2>
                    <p className="text-xs text-slate-500">Carton tracking, pricing, and visual product catalog</p>
                  </div>
                  {role === 'owner' && (
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="flex items-center bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      + Add New Good / Biscuit
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Photo & Item</th>
                        <th className="px-4 py-3">Units/Ctn</th>
                        <th className="px-4 py-3">Available Cartons</th>
                        <th className="px-4 py-3">Selling Price</th>
                        {role === 'owner' && <th className="px-4 py-3">Cost Price</th>}
                        {role === 'owner' && <th className="px-4 py-3">Stock Value</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <img
                                src={p.imageUrl || p.photoUrl || 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80'}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm flex-shrink-0"
                              />
                              <div>
                                <div className="font-semibold text-slate-800">{p.name}</div>
                                <div className="text-xs text-slate-400">ID: {p.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium">{p.unitsPerCarton} pkts</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.stockCount <= 20
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : p.stockCount <= 50
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {p.stockCount} cartons
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {formatCurrency(p.sellingPrice)}
                          </td>
                          {role === 'owner' && (
                            <td className="px-4 py-3 text-slate-500 font-medium">
                              {formatCurrency(p.costPrice)}
                            </td>
                          )}
                          {role === 'owner' && (
                            <td className="px-4 py-3 font-semibold text-amber-900">
                              {formatCurrency(p.stockCount * p.costPrice)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side: Stock-In Reception Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center space-x-2 text-amber-700 font-bold mb-3">
                <PlusCircle className="w-5 h-5" />
                <h2>Receive New Stock (Stock-In)</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Record factory deliveries arriving into the warehouse.
              </p>

              <form onSubmit={handleStockIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Biscuit</label>
                  <select
                    value={stockInProduct}
                    onChange={(e) => setStockInProduct(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 bg-slate-50"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {p.stockCount} ctns)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cartons Received</label>
                  <input
                    type="number"
                    min="1"
                    value={stockInCartons}
                    onChange={(e) => setStockInCartons(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier / Factory Reference</label>
                  <input
                    type="text"
                    value={stockInSupplier}
                    onChange={(e) => setStockInSupplier(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. Golden Biscuits Ltd Truck #3"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Confirm Stock Reception
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Saved in local Dexie database and queued for sync.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COUNTER POS SALE (Boss & Attendant)               */}
        {/* ======================================================== */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Goods Grid (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">Select Biscuit to Sell</h2>
                    <p className="text-xs text-slate-500">Tap any product card to select for the counter ticket</p>
                  </div>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    {products.length} Varieties
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {products.map((p) => {
                    const isSelected = posProduct === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPosProduct(p.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative aspect-video w-full mb-2 rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={p.imageUrl || p.photoUrl || 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=400&q=80'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {p.stockCount} in stock
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.unitsPerCarton} pkts / ctn</div>
                          <div className="text-sm font-extrabold text-amber-700 mt-1">
                            {formatCurrency(p.sellingPrice)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Checkout Ticket */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 h-fit">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Counter Sale Ticket</h2>
                  <p className="text-xs text-slate-500">Record cash, transfer, or credit</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-200"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Register Customer
                </button>
              </div>

              <form onSubmit={handlePOSSale} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Customer / Distributor
                  </label>
                  <select
                    value={posCustomer}
                    onChange={(e) => setPosCustomer(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Walk-in Customer (Instant Pay)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.isRegular ? '⭐ Regular' : ''} {c.currentBalance > 0 ? `(Owes ${formatCurrency(c.currentBalance)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Selected Good
                  </label>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
                    {products.find((p) => p.id === posProduct)?.name || 'Please select a biscuit'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cartons to Sell
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={products.find((p) => p.id === posProduct)?.stockCount || 1000}
                    value={posQuantity}
                    onChange={(e) => setPosQuantity(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'transfer', 'credit'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPosPaymentType(method)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                          posPaymentType === method
                            ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {posPaymentType === 'credit' && !posCustomer && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Please select a registered customer to issue credit.</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Total Payable:</span>
                    <div className="text-xl font-black text-slate-900">
                      {formatCurrency(
                        (products.find((p) => p.id === posProduct)?.sellingPrice || 0) * posQuantity
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={posPaymentType === 'credit' && !posCustomer}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-md"
                  >
                    Complete Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CUSTOMERS & DEBTS LEDGER (Boss & Accountant)      */}
        {/* ======================================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Distributors & Registered Customer Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Know who is owing, who buys regularly, and reach them on Phone or WhatsApp
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="flex items-center bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    + Register New Customer
                  </button>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCustomerFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      customerFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({customers.length})
                  </button>
                  <button
                    onClick={() => setCustomerFilter('owing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      customerFilter === 'owing'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Owing Debt ({customers.filter((c) => c.currentBalance > 0).length})
                  </button>
                  <button
                    onClick={() => setCustomerFilter('regular')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      customerFilter === 'regular'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Regular Buyers ({customers.filter((c) => c.isRegular).length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search name or phone..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Customer / Store</th>
                      <th className="px-4 py-3">Phone Numbers (Call / WhatsApp)</th>
                      <th className="px-4 py-3">Regular Buyer?</th>
                      <th className="px-4 py-3">Credit Limit</th>
                      <th className="px-4 py-3">Current Debt</th>
                      <th className="px-4 py-3">Debt Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                          No registered customers found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isOwing = c.currentBalance > 0;
                        const formattedWaNumber = (c.whatsappPhone || c.phone).replace(/^0/, '234');
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800">{c.name}</div>
                              {c.notes && <div className="text-xs text-slate-400">{c.notes}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <a
                                  href={`tel:${c.phone}`}
                                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <Phone className="w-3 h-3 mr-1 text-slate-400" />
                                  Call: {c.phone}
                                </a>
                                {c.whatsappPhone && (
                                  <a
                                    href={`https://wa.me/${formattedWaNumber}?text=${encodeURIComponent(
                                      `Hello ${c.name}, greetings from Biscuit Warehouse! ${
                                        isOwing
                                          ? `Kindly be reminded of your pending account balance of ${formatCurrency(
                                              c.currentBalance
                                            )}.`
                                          : 'We have fresh stock of Cabin, Cream Crackers and Wafers ready for you.'
                                      }`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-emerald-600 hover:text-emerald-800 font-semibold"
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1 text-emerald-500" />
                                    WhatsApp: {c.whatsappPhone}
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {c.isRegular ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                                  Regular ({c.purchaseCount || 1} purchases)
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Occasional</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-600">
                              {c.creditLimit ? formatCurrency(c.creditLimit) : 'No Limit'}
                            </td>
                            <td className="px-4 py-3 font-extrabold text-sm">
                              <span className={isOwing ? 'text-rose-600' : 'text-slate-700'}>
                                {formatCurrency(c.currentBalance)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isOwing ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Owing Money
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Account Clear
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isOwing && (
                                  <button
                                    onClick={() => {
                                      setRepayCustomer(c);
                                      setRepayAmount(c.currentBalance);
                                      setShowPaymentModal(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm"
                                  >
                                    Pay Debt
                                  </button>
                                )}
                                <a
                                  href={`https://wa.me/${formattedWaNumber}?text=${encodeURIComponent(
                                    `Hello ${c.name}, this is Biscuit Warehouse. Statement update: Current balance is ${formatCurrency(
                                      c.currentBalance
                                    )}.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-600 hover:text-emerald-600 p-1 border border-slate-200 rounded-lg hover:border-emerald-300"
                                  title="Send WhatsApp statement"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: FINANCIALS, WEEKLY SALES & STOCK VALUATION        */}
        {/* (Accountant & Boss)                                      */}
        {/* ======================================================== */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Top Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Money Still In Stock (Valuation at Cost) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Money Still in Stock (Cost)
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(stockValuation.costValuation)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Expected sales value: <span className="font-bold text-slate-700">{formatCurrency(stockValuation.sellingValuation)}</span>
                </p>
                <div className="mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                  +{formatCurrency(stockValuation.potentialProfit)} projected profit
                </div>
              </div>

              {/* Card 2: Weekly Sales Made */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Weekly Sales (Last 7 Days)
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(salesStats.weeklyRevenue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Volume sold: <span className="font-bold text-slate-700">{salesStats.weeklyCartons} cartons</span>
                </p>
                <div className="mt-2 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                  Weekly performance tracked
                </div>
              </div>

              {/* Card 3: Total Sales Made (All Time) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Sales Made
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(salesStats.totalSalesRevenue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Total cartons sold: <span className="font-bold text-slate-700">{salesStats.totalCartonsSold} ctns</span>
                </p>
                <div className="mt-2 text-[11px] font-semibold text-slate-600">
                  Cash: {formatCurrency(salesStats.cashSales)} | Transfer: {formatCurrency(salesStats.transferSales)}
                </div>
              </div>

              {/* Card 4: Total Debt in Market (Credit Owed) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Outstanding Customer Debts
                  </span>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-600">
                  {formatCurrency(totalDebtOwed)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Owed by <span className="font-bold text-slate-700">{customers.filter((c) => c.currentBalance > 0).length} debtors</span>
                </p>
                <div className="mt-2 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded w-fit">
                  Receivable recovery in progress
                </div>
              </div>
            </div>

            {/* Weekly Daily Breakdown Chart / Bars */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Weekly Daily Sales Audit</h3>
                  <p className="text-xs text-slate-500">Sales revenue generated per day over the past 7 days</p>
                </div>
                <span className="text-xs bg-slate-100 font-bold px-2 py-1 rounded text-slate-600">
                  Accountant & Boss Audit View
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-4">
                {weeklyDayBreakdown.map((item, idx) => {
                  const maxSale = Math.max(...weeklyDayBreakdown.map((b) => b.total), 1);
                  const barHeight = Math.max(10, Math.round((item.total / maxSale) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="text-[11px] font-bold text-slate-800 mb-1">
                        {item.total > 0 ? formatCurrency(item.total).replace('.00', '') : '₦0'}
                      </div>
                      <div className="w-full bg-slate-100 h-28 rounded-lg flex items-end p-1">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className={`w-full rounded transition-all duration-500 ${
                            item.total > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-2">{item.day}</div>
                      <div className="text-[10px] text-slate-400">{item.dateStr}</div>
                      <div className="text-[10px] font-semibold text-amber-800 mt-0.5">
                        {item.cartons} ctns
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Invoices Ledger */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Sales Invoices & Transaction History</h3>
                  <p className="text-xs text-slate-500">Append-only sales audit trail with payment methods</p>
                </div>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  {invoices.length} Transactions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Invoice ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Item Details</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Debt Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{inv.id}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(inv.createdAt).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{inv.customerName}</td>
                        <td className="px-4 py-3 text-xs">
                          {inv.lines.map((l, idx) => (
                            <span key={idx} className="block text-slate-700">
                              {l.cartons} ctn x {l.productName}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                              inv.paymentMethod === 'cash'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.paymentMethod === 'transfer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(inv.total)}</td>
                        <td className="px-4 py-3 font-semibold text-xs">
                          {inv.balanceDue > 0 ? (
                            <span className="text-rose-600 font-bold">{formatCurrency(inv.balanceDue)} unpaid</span>
                          ) : (
                            <span className="text-emerald-600">Paid in full</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: REGISTER NEW CUSTOMER (Boss & Attendant)        */}
      {/* ======================================================== */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base text-slate-900">Register New Customer / Store</h3>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Customer / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama Chidi Supermarket"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phone Number (Call) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08031234567"
                  value={newCustPhone}
                  onChange={(e) => {
                    setNewCustPhone(e.target.value);
                    if (!newCustWhatsapp) setNewCustWhatsapp(e.target.value);
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  WhatsApp Number (To message/remind)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 08031234567"
                  value={newCustWhatsapp}
                  onChange={(e) => setNewCustWhatsapp(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Credit Limit (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="regularBuyerCheckbox"
                  checked={newCustIsRegular}
                  onChange={(e) => setNewCustIsRegular(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="regularBuyerCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Regular Buyer (Frequent Store Customer)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notes / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop 12 Main Market, pays on delivery"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-1/3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD NEW PRODUCT / GOOD WITH IMAGE (Boss Only)   */}
      {/* ======================================================== */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <Package className="w-5 h-5" />
                <h3 className="text-base text-slate-900">Add New Good / Biscuit Variety</h3>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Product / Biscuit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milk Cookie Crunch"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Product Image Upload or URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Biscuit Image (Upload photo or paste URL)
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <label className="cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-300">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Upload Image from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">or enter image URL below</span>
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                />

                {newProdImage && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <img
                      src={newProdImage}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-emerald-600">Image loaded ready!</span>
                      <p className="text-[11px] text-slate-400">Will be stored locally in offline database.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Units per Carton
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProdUnits}
                    onChange={(e) => setNewProdUnits(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Initial Stock (Cartons)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cost Price per Carton (₦) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Selling Price per Carton (₦) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={newProdSelling}
                    onChange={(e) => setNewProdSelling(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {newProdSelling > newProdCost && (
                <div className="text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg font-semibold border border-emerald-200">
                  Estimated Profit Margin: {formatCurrency(newProdSelling - newProdCost)} per carton (
                  {Math.round(((newProdSelling - newProdCost) / newProdCost) * 100)}%)
                </div>
              )}

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="w-1/3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECORD CUSTOMER DEBT REPAYMENT                  */}
      {/* ======================================================== */}
      {showPaymentModal && repayCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base text-slate-900">Record Debt Repayment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRepayment} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-800 text-sm">{repayCustomer.name}</div>
                <div className="text-slate-500">Phone: {repayCustomer.phone}</div>
                <div className="text-rose-600 font-extrabold text-sm">
                  Total Outstanding Debt: {formatCurrency(repayCustomer.currentBalance)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Amount Paying Now (₦) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={repayCustomer.currentBalance}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayMethod('cash')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                      repayMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cash Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod('transfer')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                      repayMethod === 'transfer'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Reference Note
                </label>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Paid cash at counter"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/3 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
