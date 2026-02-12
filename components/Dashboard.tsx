
import React, { useState, useEffect, useMemo } from 'react';
import { Summary, JournalHeader, JournalLine, Account, TransactionType } from '../types.ts';
import { ArrowUpIcon, ArrowDownIcon, SparklesIcon, CalendarDaysIcon, ChartBarIcon, BanknotesIcon, PlusIcon, MinusIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getFinancialAdvice } from '../services/geminiService.ts';

interface DashboardProps {
  summary: Summary;
  headers: JournalHeader[];
  lines: JournalLine[];
  accounts: Account[];
  onQuickAction: (type: TransactionType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, headers, lines, accounts, onQuickAction }) => {
  const [advice, setAdvice] = useState<string>('جاري تحليل أدائك المالي...');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const res = await getFinancialAdvice(summary);
        setAdvice(res);
      } catch (error) {
        setAdvice("راقب تدفقاتك النقدية بدقة.");
      }
    };
    if (headers.length > 0) {
      fetchAdvice();
    }
  }, [summary, headers.length]);

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { income: number; expense: number }>();
    const accountMap = new Map<string, Account>(accounts.map(a => [a.id, a]));

    const sortedHeaders = [...headers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedHeaders.forEach(h => {
      const date = new Date(h.date);
      const key = viewMode === 'daily' 
        ? date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
        : date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

      const entryLines = lines.filter(l => l.headerId === h.id);
      let income = 0;
      let expense = 0;

      entryLines.forEach(l => {
        const acc = accountMap.get(l.accountId);
        if (acc?.type === 'INCOME') income += (l.credit - l.debit);
        if (acc?.type === 'EXPENSE') expense += (l.debit - l.credit);
      });

      const current = dataMap.get(key) || { income: 0, expense: 0 };
      dataMap.set(key, { 
        income: current.income + income, 
        expense: current.expense + expense 
      });
    });

    return Array.from(dataMap.entries()).map(([name, vals]) => ({
      name,
      ...vals,
      profit: vals.income - vals.expense
    })).slice(-10);
  }, [headers, lines, accounts, viewMode]);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profit Card */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">إجمالي صافي الربح</p>
              <h2 className="text-4xl font-black tabular-nums tracking-tighter">
                {summary.netProfit.toLocaleString()} <span className="text-sm font-normal text-slate-500 mr-1">ج.م</span>
              </h2>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
              <BanknotesIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {summary.assets.map((asset, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-[9px] text-slate-400 font-bold mb-1">{asset.name}</p>
                <p className="text-sm font-black tabular-nums">{asset.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onQuickAction(TransactionType.INCOME)}
          className="flex-1 relative group overflow-hidden active:scale-95 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] opacity-10"></div>
          <div className="relative border-2 border-emerald-100 p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 bg-white/50 backdrop-blur-sm">
            <PlusCircleIcon className="w-8 h-8 text-emerald-600" />
            <span className="text-xs font-black text-emerald-800">إضافة إيراد</span>
          </div>
        </button>
        <button 
          onClick={() => onQuickAction(TransactionType.EXPENSE)}
          className="flex-1 relative group overflow-hidden active:scale-95 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-rose-500 rounded-[2.5rem] opacity-10"></div>
          <div className="relative border-2 border-rose-100 p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 bg-white/50 backdrop-blur-sm">
            <MinusCircleIcon className="w-8 h-8 text-rose-500" />
            <span className="text-xs font-black text-rose-800">إضافة مصروف</span>
          </div>
        </button>
      </div>

      {/* AI Advice */}
      <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 relative overflow-hidden">
        <div className="w-1.5 h-full bg-blue-500 absolute right-0 top-0"></div>
        <div className="bg-blue-50 p-3 rounded-2xl">
          <SparklesIcon className="w-5 h-5 text-blue-600 animate-pulse" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">تحليل المحاسب الذكي</h4>
          <p className="text-xs text-slate-700 font-bold leading-relaxed">{advice}</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-blue-500" />
            تقارير الأداء
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${viewMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >يومي</button>
            <button 
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >شهري</button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
              <Bar dataKey="income" name="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="expense" name="مصروفات" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
