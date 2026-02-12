
import React, { useMemo, useState } from 'react';
import { JournalHeader, JournalLine, Account, TransactionType } from '../types.ts';
import { TrashIcon, ArrowUpIcon, ArrowDownIcon, DocumentTextIcon, BanknotesIcon, CalendarIcon, ExclamationTriangleIcon, PlusIcon, MinusIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';

interface TransactionListProps {
  headers: JournalHeader[];
  lines: JournalLine[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onQuickAdd: (type: TransactionType) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ headers, lines, accounts, onDelete, onQuickAdd }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const accountMap = new Map<string, Account>(accounts.map(a => [a.id, a]));

  const groupedHeaders = useMemo(() => {
    const groups = new Map<string, JournalHeader[]>();
    headers.forEach(h => {
      const date = new Date(h.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const current = groups.get(date) || [];
      groups.set(date, [...current, h]);
    });
    return Array.from(groups.entries());
  }, [headers]);

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative">
      {/* High-Visibility Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => onQuickAdd(TransactionType.INCOME)}
          className="relative overflow-hidden group active:scale-95 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] shadow-lg shadow-emerald-200"></div>
          <div className="relative p-6 flex flex-col items-center justify-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <PlusCircleIcon className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-0.5">تسجيل جديد</span>
              <span className="text-sm font-black text-white">إضافة إيراد</span>
            </div>
          </div>
        </button>

        <button 
          onClick={() => onQuickAdd(TransactionType.EXPENSE)}
          className="relative overflow-hidden group active:scale-95 transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-600 rounded-[2.5rem] shadow-lg shadow-rose-200"></div>
          <div className="relative p-6 flex flex-col items-center justify-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <MinusCircleIcon className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-black text-rose-100 uppercase tracking-widest mb-0.5">تسجيل جديد</span>
              <span className="text-sm font-black text-white">إضافة مصروف</span>
            </div>
          </div>
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="bg-rose-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ExclamationTriangleIcon className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">تأكيد الحذف؟</h3>
            <p className="text-slate-500 text-sm text-center mb-8 font-bold leading-relaxed">
              هل أنت متأكد من حذف هذه العملية؟ لن تتمكن من استعادة البيانات المحذوفة.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm active:scale-95 transition-all"
              >
                تراجع
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 px-6 rounded-2xl bg-rose-500 text-white font-black text-sm active:scale-95 transition-all shadow-lg shadow-rose-200"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">سجل العمليات</h2>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2">
          <BanknotesIcon className="w-4 h-4" />
          {headers.length} عملية
        </div>
      </div>

      {headers.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-dashed border-2 border-slate-100 text-center">
          <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-slate-200" />
          <p className="font-bold text-slate-400">لا توجد عمليات مسجلة حتى الآن</p>
        </div>
      ) : (
        <div className="space-y-10 pb-10">
          {groupedHeaders.map(([date, group]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <CalendarIcon className="w-4 h-4 text-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
                <div className="flex-1 h-[1px] bg-slate-100"></div>
              </div>
              <div className="grid gap-4">
                {group.map((h) => {
                  const entryLines = lines.filter(l => l.headerId === h.id);
                  const incomeLine = entryLines.find(l => accountMap.get(l.accountId)?.type === 'INCOME');
                  const expenseLine = entryLines.find(l => accountMap.get(l.accountId)?.type === 'EXPENSE');
                  
                  const isIncome = !!incomeLine;
                  const amount = isIncome ? (incomeLine?.credit || 0) : (expenseLine?.debit || 0);
                  const categoryName = isIncome 
                    ? accountMap.get(incomeLine?.accountId || '')?.name 
                    : accountMap.get(expenseLine?.accountId || '')?.name;

                  return (
                    <div key={h.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                          {isIncome ? <ArrowUpIcon className="w-5 h-5 stroke-[3]" /> : <ArrowDownIcon className="w-5 h-5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-800">{h.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg font-bold border border-slate-100">
                              {categoryName}
                            </span>
                            <span className="text-[9px] text-slate-300 font-bold">
                              {new Date(h.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm font-black tabular-nums ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isIncome ? '+' : '-'}{amount.toLocaleString()}
                        </span>
                        <button 
                          onClick={() => setDeleteId(h.id)} 
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
