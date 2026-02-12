
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, PaymentMethod } from '../types.ts';
import { suggestCategory } from '../services/geminiService.ts';
import { SparklesIcon, CheckCircleIcon, CpuChipIcon, CubeTransparentIcon } from '@heroicons/react/24/solid';

interface TransactionFormProps {
  onAdd: (t: Omit<Transaction, 'id' | 'date'>) => void;
  initialType?: TransactionType;
}

const CATEGORIES: Category[] = ['مبيعات', 'خدمات', 'إيجار', 'رواتب', 'مشتريات', 'تسويق', 'صيانة', 'أخرى'];

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, initialType = TransactionType.EXPENSE }) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<Category>('أخرى');
  const [method, setMethod] = useState<PaymentMethod>('نقدًا (الخزينة)');
  const [aiInfo, setAiInfo] = useState<{ source: 'local' | 'gemini'; active: boolean }>({ source: 'local', active: false });

  // Update type if initialType changes (when coming from quick action buttons)
  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    const observer = async () => {
      const numAmount = parseFloat(amount) || 0;
      if (description.length >= 2 || numAmount > 0) {
        setAiInfo(prev => ({ ...prev, active: true }));
        const result = await suggestCategory(description, numAmount);
        setCategory(result.category);
        setAiInfo({ source: result.source, active: false });
      }
    };

    const debounce = setTimeout(observer, 350);
    return () => clearTimeout(debounce);
  }, [description, amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || !description) return;
    onAdd({ type, amount: numAmount, description, category, method });
    setAmount('');
    setDescription('');
    setCategory('أخرى');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
          {/* Subtle AI Glow */}
          <div className={`absolute top-0 right-0 w-full h-1 transition-all duration-1000 ${aiInfo.source === 'gemini' ? 'bg-blue-500' : 'bg-amber-400'} ${aiInfo.active ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Transaction Type Field */}
          <div className="mb-8">
            <label className="text-[10px] font-black text-slate-400 mb-3 block mr-4 uppercase tracking-[0.2em]">نوع العملية المالية</label>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-4 rounded-xl text-xs font-black transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                إيراد جديد
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-4 rounded-xl text-xs font-black transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
              >
                مصروف جديد
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 mb-2 block mr-4 uppercase tracking-[0.2em]">المبلغ (ج.م)</label>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border-2 border-transparent rounded-3xl py-7 px-8 text-4xl font-black text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-50 outline-none transition-all duration-300 placeholder:text-slate-200"
                required
              />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 mb-2 block mr-4 uppercase tracking-[0.2em]">البيان / الوصف</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثلاً: صيانة المحل.."
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 px-6 text-base font-bold text-slate-700 focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-50 outline-none transition-all duration-300 placeholder:text-slate-300"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-400 mb-2 block mr-4 uppercase tracking-[0.2em] flex items-center gap-1">
                  التصنيف (AI)
                  {aiInfo.active && <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>}
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-black text-slate-700 appearance-none focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-50 outline-none transition-all duration-300"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {aiInfo.source === 'gemini' ? <SparklesIcon className="w-4 h-4 text-blue-500" /> : <CpuChipIcon className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 mb-2 block mr-4 uppercase tracking-[0.2em]">طريقة الدفع</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-black text-slate-700 appearance-none focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-50 outline-none transition-all duration-300"
                >
                  <option value="نقدًا (الخزينة)">كاش (نقدًا)</option>
                  <option value="بنك / تحويل">تحويل بنكي</option>
                  <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[2rem] mt-10 shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-4 text-lg"
          >
            <span>حفظ العملية</span>
            <CheckCircleIcon className="w-6 h-6 text-blue-400" />
          </button>
        </div>

        <div className="bg-white/50 border border-slate-100 p-5 rounded-[2rem] flex items-center gap-4 backdrop-blur-sm">
          <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
            <CubeTransparentIcon className="w-5 h-5" />
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            سيتم توجيه العملية آلياً لحساب <span className="text-blue-600 font-black">{method}</span>.
          </p>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
