import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Download,
  Filter,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { cn, formatCurrency, formatDate } from './lib/utils';
import { Transaction, Summary, CATEGORIES, MOCK_TRANSACTIONS } from './lib/types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Sidebar Component ---
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }: any) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'معاملات (Transactions)', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">Q</div>
            <span className="text-xl font-bold text-slate-900">QuickBook</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-600 font-medium" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 mb-4">
            <img 
              src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/70ce845d-e81d-41b2-848a-2b63e7f3b4de/admin-avatar-025360aa-1774610387429.webp" 
              className="w-10 h-10 rounded-full border border-slate-200"
              alt="Avatar"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">admin@quickbook.com</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

// --- Dashboard Stats Component ---
const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(value)}</h3>
      {trend && (
        <p className={cn("text-xs mt-2 font-medium flex items-center gap-1", trend > 0 ? "text-emerald-600" : "text-rose-600")}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}% from last month
        </p>
      )}
    </div>
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Main Application ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: 'Sales',
    amount: 0,
    description: ''
  });

  const summary: Summary = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    netProfit: 0
  };
  summary.netProfit = summary.totalIncome - summary.totalExpenses;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    toast.success('Welcome back, Admin!');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? { ...formData, id: t.id } as Transaction : t));
      toast.success('Transaction updated');
    } else {
      const newTransaction = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as Transaction;
      setTransactions([newTransaction, ...transactions]);
      toast.success('Transaction added successfully');
    }
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
    ];
    transactions.forEach(t => worksheet.addRow(t));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Accounting_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel Report Generated');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold">QuickBook</h1>
            <p className="text-blue-100 text-sm mt-2">Manage your accounts on the cloud</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" defaultValue="admin@quickbook.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" defaultValue="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={() => setIsAuthenticated(false)} />

      <div className="flex-1 lg:ml-64 p-4 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Financial Overview'}
              {activeTab === 'transactions' && 'Transactions'}
              {activeTab === 'reports' && 'Reports'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            <p className="text-slate-500 text-sm">Overview of your business performance</p>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white rounded-lg border border-slate-200">
            <Menu size={24} />
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Income" value={summary.totalIncome} icon={TrendingUp} color="bg-emerald-500" trend={8.2} />
              <StatCard title="Total Expenses" value={summary.totalExpenses} icon={TrendingDown} color="bg-rose-500" trend={-3.1} />
              <StatCard title="Net Profit" value={summary.netProfit} icon={DollarSign} color="bg-blue-600" trend={12.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold mb-4">Revenue Trend</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactions.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold mb-4">Expense Breakdown</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Rent', value: 1200 }, { name: 'Staff', value: 2000 }, { name: 'Misc', value: 500 }]}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold">Recent Transactions</h4>
                <button onClick={() => setActiveTab('transactions')} className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-sm">{formatDate(t.date)}</td>
                        <td className="px-6 py-4 text-sm font-medium">{t.description}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium">{t.category}</span></td>
                        <td className={cn("px-6 py-4 text-sm font-bold", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button 
                onClick={() => { setEditingTransaction(null); setFormData({ date: new Date().toISOString().split('T')[0], type: 'income', category: 'Sales', amount: 0, description: '' }); setIsModalOpen(true); }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                <Plus size={18} /> Add Transaction
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(t.date)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.description}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{t.category}</span></td>
                        <td className="px-6 py-4"><span className={cn("px-3 py-1 rounded-full text-xs font-medium uppercase", t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{t.type}</span></td>
                        <td className={cn("px-6 py-4 text-sm font-bold", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(t.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setEditingTransaction(t); setFormData(t); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => setTransactions(transactions.filter(tr => tr.id !== t.id))} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><FileText size={32} /></div>
              <h3 className="text-xl font-bold mb-2">Excel Reports</h3>
              <p className="text-slate-500 mb-6 text-sm">Download a full transaction history and summary in Excel format.</p>
              <button onClick={exportToExcel} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"><Download size={18} /> Download Excel</button>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Receipt size={32} /></div>
              <h3 className="text-xl font-bold mb-2">WhatsApp Automation</h3>
              <p className="text-slate-500 mb-6 text-sm">Automated daily reports are sent to your phone at 6 PM.</p>
              <div className="w-full p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg mb-4 uppercase tracking-wider">Enabled: Next Report Today 18:00</div>
              <button onClick={() => toast.success('Manual report sent to WhatsApp')} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all">Send Now</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="text-xl font-bold mb-6">Profile Settings</h3>
             <div className="space-y-4">
               <div><label className="text-sm font-medium text-slate-700">Name</label><input type="text" defaultValue="Admin User" className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
               <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" defaultValue="admin@quickbook.com" className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
               <div><label className="text-sm font-medium text-slate-700">WhatsApp Number</label><input type="text" defaultValue="+1 555 123 4567" className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
               <button onClick={() => toast.success('Settings saved')} className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all">Save Changes</button>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold mb-6">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
              <form onSubmit={handleSaveTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1"><label className="text-xs font-bold text-slate-500 uppercase">Date</label><input type="date" required className="w-full mt-1 px-4 py-2 border rounded-lg" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div className="col-span-1"><label className="text-xs font-bold text-slate-500 uppercase">Type</label><select className="w-full mt-1 px-4 py-2 border rounded-lg bg-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any, category: CATEGORIES[e.target.value as keyof typeof CATEGORIES][0] })}><option value="income">Income</option><option value="expense">Expense</option></select></div>
                  <div className="col-span-1"><label className="text-xs font-bold text-slate-500 uppercase">Category</label><select className="w-full mt-1 px-4 py-2 border rounded-lg bg-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{(formData.type === 'income' ? CATEGORIES.income : CATEGORIES.expense).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="col-span-1"><label className="text-xs font-bold text-slate-500 uppercase">Amount</label><input type="number" required className="w-full mt-1 px-4 py-2 border rounded-lg" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} /></div>
                  <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Description</label><textarea required className="w-full mt-1 px-4 py-2 border rounded-lg resize-none" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-slate-500">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">Save Transaction</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}