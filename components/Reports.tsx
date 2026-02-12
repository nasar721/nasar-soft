
import React, { useMemo } from 'react';
import { JournalLine, Account, Summary, CompanySettings } from '../types.ts';
import { ChartPieIcon, TableCellsIcon, ArrowPathIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface ReportsProps {
  lines: JournalLine[];
  accounts: Account[];
  summary: Summary;
  companySettings: CompanySettings;
}

const Reports: React.FC<ReportsProps> = ({ lines, accounts, summary, companySettings }) => {
  const accountBalances = useMemo(() => {
    const balances = new Map<string, number>();
    lines.forEach(l => {
      const current = balances.get(l.accountId) || 0;
      balances.set(l.accountId, current + (l.debit - l.credit));
    });
    return balances;
  }, [lines]);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:p-0 print:space-y-4">
      <div className="flex items-center justify-between px-2 print:hidden">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">التقارير المالية</h2>
        <button 
          onClick={handleExportPDF}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <PrinterIcon className="w-4 h-4" /> تصدير PDF
        </button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-black text-slate-900">{companySettings.name}</h1>
        <p className="text-xs text-slate-500 font-bold mt-1">تقرير المركز المالي وقائمة الدخل</p>
        <p className="text-[10px] text-slate-400 mt-1">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      {/* Income Statement (P&L) */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm print:shadow-none print:border print:rounded-3xl print:p-6">
        <div className="flex items-center gap-3 mb-8 print:mb-4">
          <div className="p-3 bg-emerald-50 rounded-2xl print:bg-slate-50">
            <ChartPieIcon className="w-5 h-5 text-emerald-600 print:text-slate-800" />
          </div>
          <h3 className="font-black text-slate-800">قائمة الدخل (الأرباح والخسائر)</h3>
        </div>

        <div className="space-y-4">
          <div className="pb-4 border-b border-slate-50 print:pb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 print:mb-1">الإيرادات</p>
            {accounts.filter(a => a.type === 'INCOME').map(acc => {
              const balance = -(accountBalances.get(acc.id) || 0); // Credit normal
              if (balance === 0) return null;
              return (
                <div key={acc.id} className="flex justify-between items-center py-2 print:py-1">
                  <span className="text-sm font-bold text-slate-600">{acc.name}</span>
                  <span className="text-sm font-black tabular-nums">{balance.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <div className="pb-4 border-b border-slate-50 print:pb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 print:mb-1">المصروفات</p>
            {accounts.filter(a => a.type === 'EXPENSE').map(acc => {
              const balance = (accountBalances.get(acc.id) || 0); // Debit normal
              if (balance === 0) return null;
              return (
                <div key={acc.id} className="flex justify-between items-center py-2 print:py-1">
                  <span className="text-sm font-bold text-slate-600">{acc.name}</span>
                  <span className="text-sm font-black tabular-nums text-rose-500 print:text-slate-900">{balance.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center print:pt-2">
            <span className="text-base font-black text-slate-800">صافي الربح التشغيلي</span>
            <span className={`text-xl font-black tabular-nums ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} print:text-slate-900`}>
              {summary.netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden print:bg-white print:text-slate-900 print:shadow-none print:border print:rounded-3xl print:p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl print:hidden"></div>
        <div className="flex items-center gap-3 mb-8 relative z-10 print:mb-4">
          <div className="p-3 bg-white/10 rounded-2xl print:bg-slate-50">
            <TableCellsIcon className="w-5 h-5 text-blue-400 print:text-slate-800" />
          </div>
          <h3 className="font-black">الميزانية العمومية (المركز المالي)</h3>
        </div>

        <div className="space-y-6 relative z-10 print:space-y-3">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 print:mb-1">الأصول (الموجودات)</p>
            {summary.assets.map((asset, i) => (
              <div key={i} className="flex justify-between py-1.5 print:py-1">
                <span className="text-xs text-slate-300 print:text-slate-600">{asset.name}</span>
                <span className="text-xs font-black tabular-nums">{asset.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 print:border-slate-100 print:pt-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 print:mb-1">الخصوم وحقوق الملكية</p>
            <div className="flex justify-between py-1.5 print:py-1">
              <span className="text-xs text-slate-300 print:text-slate-600">حقوق الملكية / رأس المال</span>
              <span className="text-xs font-black tabular-nums">{(summary.netProfit).toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-blue-500/30 print:border-slate-900 print:pt-2">
            <span className="text-xs font-black text-blue-400 print:text-slate-900">إجمالي المركز المالي</span>
            <span className="text-lg font-black tabular-nums text-white print:text-slate-900">
              {summary.assets.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-[2rem] print:hidden">
        <ArrowPathIcon className="w-6 h-6 mx-auto mb-2 text-slate-300" />
        <p className="text-[10px] text-slate-400 font-bold">يتم تحديث التقارير لحظياً مع كل قيد محاسبي جديد</p>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block pt-20 text-center">
        <div className="grid grid-cols-2 gap-20">
          <div className="border-t border-slate-300 pt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase">توقيع المحاسب</p>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase">ختم المؤسسة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
