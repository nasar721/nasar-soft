import React, { useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CompanySettings, Employee, InventoryItem, Invoice, JournalHeader, JournalLine, Party } from '../types.ts';

type BackupPayload = {
  app: 'Nasser Soft';
  schemaVersion: 1;
  exportedAt: string;
  data: {
    headers: JournalHeader[];
    lines: JournalLine[];
    inventory: InventoryItem[];
    employees: Employee[];
    parties: Party[];
    invoices: Invoice[];
    companySettings: CompanySettings;
  };
};

interface BackupRestoreProps extends BackupPayload['data'] {
  onRestore: (data: BackupPayload['data']) => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const BackupRestore: React.FC<BackupRestoreProps> = ({
  headers, lines, inventory, employees, parties, invoices, companySettings, onRestore
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const downloadBackup = () => {
    const payload: BackupPayload = {
      app: 'Nasser Soft',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: { headers, lines, inventory, employees, parties, invoices, companySettings }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nasser-soft-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('تم إنشاء النسخة الاحتياطية. احتفظ بها في مكان آمن خارج الجهاز.');
  };

  const restoreBackup = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('حجم الملف أكبر من الحد المسموح (25 ميجابايت).');
      const parsed: unknown = JSON.parse(await file.text());
      if (!isRecord(parsed) || parsed.app !== 'Nasser Soft' || parsed.schemaVersion !== 1 || !isRecord(parsed.data)) {
        throw new Error('صيغة النسخة غير مدعومة أو لا تخص ناصر سوفت.');
      }
      const data = parsed.data;
      const required = ['headers', 'lines', 'inventory', 'employees', 'parties', 'invoices'];
      if (required.some(key => !isArray(data[key])) || !isRecord(data.companySettings)) {
        throw new Error('النسخة غير مكتملة أو تالفة؛ لم يتم تغيير أي بيانات.');
      }
      const rows = (key: string) => data[key] as unknown[];
      const hasFields = (row: unknown, fields: string[]): row is Record<string, unknown> =>
        isRecord(row) && fields.every(field => field in row);
      const nonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
      const finiteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
      const uniqueIds = (key: string) => {
        const ids = rows(key).map(row => isRecord(row) ? row.id : undefined);
        return ids.every(nonEmptyString) && new Set(ids).size === ids.length;
      };
      const headersValid = rows('headers').every(row =>
        hasFields(row, ['id', 'date', 'description', 'txType']) &&
        nonEmptyString(row.id) && nonEmptyString(row.date) &&
        nonEmptyString(row.description) && nonEmptyString(row.txType)
      );
      const headerIds = new Set(rows('headers').map(row => isRecord(row) ? row.id : undefined));
      const linesValid = rows('lines').every(row =>
        hasFields(row, ['id', 'headerId', 'accountId', 'debit', 'credit']) &&
        nonEmptyString(row.id) && nonEmptyString(row.headerId) &&
        nonEmptyString(row.accountId) && headerIds.has(row.headerId) &&
        finiteNumber(row.debit) && finiteNumber(row.credit) &&
        row.debit >= 0 && row.credit >= 0 && !(row.debit > 0 && row.credit > 0)
      );
      const inventoryValid = rows('inventory').every(row =>
        hasFields(row, ['id', 'name', 'quantity', 'cost', 'price']) &&
        nonEmptyString(row.id) && nonEmptyString(row.name) &&
        finiteNumber(row.quantity) && finiteNumber(row.cost) && finiteNumber(row.price) &&
        row.quantity >= 0 && row.cost >= 0 && row.price >= 0
      );
      const employeesValid = rows('employees').every(row =>
        hasFields(row, ['id', 'name', 'position', 'salary', 'status']) &&
        nonEmptyString(row.id) && nonEmptyString(row.name) &&
        nonEmptyString(row.position) && finiteNumber(row.salary) && row.salary >= 0 &&
        (row.status === 'active' || row.status === 'on_leave')
      );
      const partiesValid = rows('parties').every(row =>
        hasFields(row, ['id', 'name', 'type', 'initialBalance']) &&
        nonEmptyString(row.id) && nonEmptyString(row.name) &&
        (row.type === 'CUSTOMER' || row.type === 'SUPPLIER') &&
        finiteNumber(row.initialBalance)
      );
      const invoicesValid = rows('invoices').every(row =>
        hasFields(row, ['id', 'number', 'type', 'date', 'items', 'total']) &&
        nonEmptyString(row.id) && nonEmptyString(row.number) && nonEmptyString(row.date) &&
        (row.type === 'SALE' || row.type === 'SUPPLY') &&
        Array.isArray(row.items) && row.items.every(item =>
          hasFields(item, ['productId', 'name', 'quantity', 'price', 'taxRate', 'taxAmount', 'discount', 'total']) &&
          nonEmptyString(item.name) && finiteNumber(item.quantity) && item.quantity > 0 &&
          finiteNumber(item.price) && item.price >= 0 && finiteNumber(item.taxRate) &&
          finiteNumber(item.taxAmount) && finiteNumber(item.discount) &&
          finiteNumber(item.total) && item.discount >= 0
        ) &&
        finiteNumber(row.total) && row.total >= 0
      );
      const settings = data.companySettings;
      const settingsValid = ['name', 'address', 'phone', 'taxNumber', 'primaryColor'].every(key =>
        nonEmptyString(settings[key])
      ) && finiteNumber(settings.defaultTaxRate) &&
        typeof settings.showLogo === 'boolean' &&
        typeof settings.showTaxNumber === 'boolean' &&
        typeof settings.showAddress === 'boolean';
      if (
        !headersValid || !linesValid || !inventoryValid || !employeesValid ||
        !partiesValid || !invoicesValid || !settingsValid ||
        ['headers', 'lines', 'inventory', 'employees', 'parties', 'invoices'].some(key => !uniqueIds(key))
      ) throw new Error('النسخة تحتوي على حقول ناقصة أو قيم غير صالحة أو مراجع غير متطابقة؛ لم يتم تغيير أي بيانات.');
      if (!window.confirm('سيتم استبدال البيانات الحالية ببيانات النسخة المختارة. يُفضّل تنزيل نسخة من بياناتك الحالية أولاً. هل تريد المتابعة؟')) return;
      onRestore({
        headers: data.headers as JournalHeader[],
        lines: data.lines as JournalLine[],
        inventory: data.inventory as InventoryItem[],
        employees: data.employees as Employee[],
        parties: data.parties as Party[],
        invoices: data.invoices as Invoice[],
        companySettings: data.companySettings as CompanySettings
      });
      setMessage('تم استيراد النسخة. أعد تحميل الصفحة إذا لم تظهر البيانات فوراً.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر قراءة النسخة الاحتياطية.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const exportInvoicesCsv = () => {
    const columns = ['رقم الفاتورة', 'النوع', 'التاريخ', 'الطرف', 'الإجمالي', 'المدفوع', 'المتبقي', 'طريقة الدفع'];
    const rows = invoices.map(invoice => [
      invoice.number, invoice.type === 'SALE' ? 'مبيعات' : 'مشتريات',
      invoice.date, invoice.partyName, invoice.total, invoice.paidAmount,
      invoice.balanceAmount, invoice.paymentMethod
    ]);
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [columns, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nasser-soft-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('تم تصدير سجل الفواتير بصيغة CSV.');
  };

  return (
    <section className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300" dir="rtl">
      <div className="px-2">
        <h2 className="text-2xl font-black text-slate-800">النسخ الاحتياطي والبيانات</h2>
        <p className="mt-2 text-sm font-bold text-slate-400">احفظ بيانات المنشأة واستعدها أو صدّر سجل الفواتير.</p>
      </div>

      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 flex gap-3">
        <ShieldCheckIcon className="w-7 h-7 text-emerald-600 shrink-0" />
        <div>
          <p className="font-black text-emerald-900">حماية بياناتك مسؤوليتك</p>
          <p className="mt-1 text-xs leading-6 text-emerald-800">النسخة تُحفظ على جهازك فقط. لا ترفعها إلى جهاز أو خدمة مشتركة إلا إذا كانت موثوقة؛ فهي قد تحتوي على بيانات مالية وبيانات عملاء.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <button onClick={downloadBackup} className="w-full rounded-[2rem] bg-slate-900 p-6 text-white text-right shadow-lg flex items-center gap-4">
          <span className="rounded-2xl bg-white/10 p-3"><ArrowDownTrayIcon className="w-7 h-7" /></span>
          <span><strong className="block text-base">تنزيل نسخة احتياطية كاملة</strong><small className="mt-1 block text-slate-300">القيود والمخزون والموظفون والأطراف والفواتير والإعدادات</small></span>
        </button>

        <button onClick={() => inputRef.current?.click()} disabled={busy} className="w-full rounded-[2rem] bg-blue-600 p-6 text-white text-right shadow-lg flex items-center gap-4 disabled:opacity-60">
          <span className="rounded-2xl bg-white/10 p-3"><ArrowUpTrayIcon className="w-7 h-7" /></span>
          <span><strong className="block text-base">{busy ? 'جارٍ فحص النسخة...' : 'استعادة نسخة احتياطية'}</strong><small className="mt-1 block text-blue-100">يفحص الملف قبل استبدال البيانات الحالية</small></span>
        </button>
        <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={e => restoreBackup(e.target.files?.[0])} />

        <button onClick={exportInvoicesCsv} className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 text-right shadow-sm flex items-center gap-4">
          <span className="rounded-2xl bg-slate-100 p-3 text-slate-700"><DocumentTextIcon className="w-7 h-7" /></span>
          <span><strong className="block text-base text-slate-800">تصدير سجل الفواتير Excel / CSV</strong><small className="mt-1 block text-slate-400">يمكن فتح الملف في Excel أو جداول البيانات</small></span>
        </button>
      </div>

      {message && <div role="status" className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">{message}</div>}
      <p className="text-center text-[11px] leading-6 text-slate-400">لا تُعد الاستعادة مزامنة بين الأجهزة؛ إنها تستبدل بيانات هذا المتصفح بالنسخة التي اخترتها.</p>
    </section>
  );
};

export default BackupRestore;
