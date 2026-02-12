
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, Invoice, InvoiceItem, Party, CompanySettings } from '../types.ts';
import { 
  DocumentPlusIcon, ListBulletIcon, 
  TrashIcon, CheckCircleIcon, PlusIcon,
  PrinterIcon, DocumentDuplicateIcon,
  ReceiptPercentIcon, BanknotesIcon,
  XMarkIcon, ArrowRightIcon, BuildingOfficeIcon,
  DevicePhoneMobileIcon, IdentificationIcon,
  MapPinIcon, CreditCardIcon, PaintBrushIcon,
  PhotoIcon, ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

interface InvoiceModuleProps {
  inventory: InventoryItem[];
  parties: Party[];
  invoices: Invoice[];
  onSaveInvoice: (invoice: Invoice) => void;
  companySettings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
}

const THEME_COLORS = [
  { name: 'أزرق', hex: '#2563eb' },
  { name: 'أخضر', hex: '#059669' },
  { name: 'أحمر', hex: '#dc2626' },
  { name: 'رمادي', hex: '#4b5563' },
  { name: 'بنفسجي', hex: '#7c3aed' },
];

export default function InvoiceModule({ inventory, parties, invoices, onSaveInvoice, companySettings, onUpdateSettings }: InvoiceModuleProps) {
  type ViewMode = 'list' | 'create' | 'detail' | 'template';
  const [view, setView] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [type, setType] = useState<'SALE' | 'SUPPLY'>('SALE');
  const [partyId, setPartyId] = useState('');
  const [manualParty, setManualParty] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [currentTaxRate, setCurrentTaxRate] = useState<string>(companySettings.defaultTaxRate.toString());

  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('0');
  const [discount, setDiscount] = useState('0');

  // For Template View
  const [tempSettings, setTempSettings] = useState<CompanySettings>(companySettings);

  const filteredParties = parties.filter(p => type === 'SALE' ? p.type === 'CUSTOMER' : p.type === 'SUPPLIER');

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
    const totalTax = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const total = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, total };
  }, [items]);

  useEffect(() => {
    setPaidAmount(totals.total.toString());
  }, [totals.total]);

  const handleAddItem = () => {
    const product = inventory.find(p => p.id === selectedProductId);
    if (!product) return;

    const basePrice = parseFloat(price) || (type === 'SALE' ? product.price : product.cost);
    const itemQty = parseFloat(qty) || 1;
    const itemDiscount = parseFloat(discount) || 0;
    const taxableAmount = (basePrice * itemQty) - itemDiscount;
    const rate = parseFloat(currentTaxRate) / 100 || 0;
    const tax = taxableAmount * rate;

    const newItem: InvoiceItem = {
      productId: product.id,
      name: product.name,
      quantity: itemQty,
      price: basePrice,
      taxRate: rate,
      taxAmount: tax,
      discount: itemDiscount,
      total: taxableAmount + tax
    };

    setItems([...items, newItem]);
    setQty('1');
    setSelectedProductId('');
    setDiscount('0');
    setPrice('0');
  };

  const saveInvoice = () => {
    if (items.length === 0) return;
    const partyName = partyId ? (parties.find(p => p.id === partyId)?.name || '') : manualParty;
    const paid = parseFloat(paidAmount) || 0;
    
    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      number: `${type === 'SALE' ? 'SL' : 'PR'}-${Date.now().toString().slice(-4)}`,
      type,
      date: new Date().toISOString(),
      partyId: partyId || undefined,
      partyName: partyName || (type === 'SALE' ? 'عميل نقدي' : 'مورد نقدي'),
      items,
      subtotal: totals.subtotal,
      tax: totals.totalTax,
      totalTax: totals.totalTax,
      totalDiscount: totals.totalDiscount,
      total: totals.total,
      paidAmount: paid,
      balanceAmount: totals.total - paid,
      paymentMethod: 'نقدًا (الخزينة)',
      notes
    };

    onSaveInvoice(invoice);
    setItems([]);
    setNotes('');
    setPaidAmount('');
    setView('list');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings(tempSettings);
    setView('list');
  };

  const CustomToggle = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <button 
      type="button"
      onClick={onClick}
      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${enabled ? '-translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  if (view === 'template') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-800">تخصيص القالب</h2>
          <button onClick={() => setView('list')} className="text-slate-400 p-2"><XMarkIcon className="w-6 h-6" /></button>
        </div>

        {/* Live Mini Preview */}
        <div className="bg-slate-900 p-4 rounded-[2.5rem] shadow-xl overflow-hidden scale-90 -mt-4 origin-top">
          <div className="bg-white p-4 rounded-[2rem] space-y-3 min-h-[200px]">
            <div className="flex justify-between items-start border-b pb-3">
              <div className="flex items-center gap-2">
                {tempSettings.showLogo && tempSettings.logo ? (
                  <img src={tempSettings.logo} className="w-8 h-8 rounded-lg object-contain" />
                ) : tempSettings.showLogo && (
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-4 h-4 text-slate-200" />
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] font-black text-slate-800">{tempSettings.name}</h4>
                  {tempSettings.showTaxNumber && <p className="text-[7px] text-slate-400 font-bold">{tempSettings.taxNumber}</p>}
                </div>
              </div>
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: tempSettings.primaryColor }}></div>
            </div>
            <div className="space-y-1 opacity-20">
              <div className="h-1 w-full bg-slate-200 rounded"></div>
              <div className="h-1 w-3/4 bg-slate-200 rounded"></div>
            </div>
            <div className="pt-2 border-t text-[6px] text-slate-300 text-center italic">
              {tempSettings.footerNote}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mr-2">هوية المؤسسة</label>
            <input 
              type="text" 
              placeholder="اسم المحل" 
              value={tempSettings.name}
              onChange={e => setTempSettings({...tempSettings, name: e.target.value})}
              className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none border-2 border-transparent focus:border-blue-400 transition-all"
            />
            
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                 {tempSettings.logo ? (
                   <img src={tempSettings.logo} className="w-full h-full object-contain" />
                 ) : <PhotoIcon className="w-6 h-6 text-slate-200" />}
               </div>
               <label className="bg-slate-100 px-5 py-3 rounded-xl text-[10px] font-black text-slate-600 cursor-pointer active:scale-95 transition-all">
                 تغيير الشعار
                 <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
               </label>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-black text-slate-700">إظهار الشعار</span>
                <CustomToggle enabled={tempSettings.showLogo} onClick={() => setTempSettings({...tempSettings, showLogo: !tempSettings.showLogo})} />
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-black text-slate-700">إظهار الرقم الضريبي</span>
                <CustomToggle enabled={tempSettings.showTaxNumber} onClick={() => setTempSettings({...tempSettings, showTaxNumber: !tempSettings.showTaxNumber})} />
             </div>
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اللون الأساسي</p>
             <div className="flex gap-2">
               {THEME_COLORS.map(c => (
                 <button 
                  key={c.hex}
                  onClick={() => setTempSettings({...tempSettings, primaryColor: c.hex})}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${tempSettings.primaryColor === c.hex ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: c.hex }}
                 />
               ))}
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mr-2">ملاحظات و شروط</label>
             <textarea 
              placeholder="الشروط و الأحكام..."
              value={tempSettings.termsAndConditions}
              onChange={e => setTempSettings({...tempSettings, termsAndConditions: e.target.value})}
              rows={2}
              className="w-full bg-slate-50 rounded-2xl p-4 text-[10px] font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all resize-none"
             />
          </div>

          <button 
            onClick={handleSaveSettings}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >حفظ التغييرات</button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedInvoice) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 font-bold mb-4">
          <ArrowRightIcon className="w-5 h-5" /> رجوع للقائمة
        </button>
        <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl border border-slate-100 print:shadow-none overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: companySettings.primaryColor }}></div>

          {/* Company Identity */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-8 border-b border-slate-100 mt-4 gap-6">
            <div className="flex gap-4 items-center">
              {companySettings.showLogo && companySettings.logo && (
                <img src={companySettings.logo} alt="Logo" className="w-20 h-20 object-contain rounded-2xl bg-slate-50 p-2" />
              )}
              <div>
                <h3 className="text-2xl font-black text-slate-900">{companySettings.name}</h3>
                <div className="text-[10px] text-slate-400 font-bold space-y-0.5 mt-1">
                  <p className="flex items-center gap-1"><DevicePhoneMobileIcon className="w-3 h-3"/> {companySettings.phone}</p>
                  {companySettings.showTaxNumber && <p className="flex items-center gap-1"><IdentificationIcon className="w-3 h-3"/> الرقم الضريبي: {companySettings.taxNumber}</p>}
                </div>
              </div>
            </div>
            <div className="text-left bg-slate-50 px-8 py-5 rounded-[2rem] border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-1" style={{ color: companySettings.primaryColor }}>
                فاتورة {selectedInvoice.type === 'SALE' ? 'مبيعات' : 'مشتريات'}
              </h2>
              <p className="text-slate-400 font-black text-xs tracking-widest">NO: {selectedInvoice.number}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">تاريخ: {new Date(selectedInvoice.date).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          {/* Party Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">جهة التعامل</p>
              <p className="font-black text-slate-800 text-lg">{selectedInvoice.partyName}</p>
              {selectedInvoice.notes && <p className="text-[10px] text-slate-400 font-bold mt-2">ملاحظات: {selectedInvoice.notes}</p>}
            </div>
            {companySettings.showAddress && (
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-50 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">العنوان</p>
                <p className="font-bold text-slate-700 text-sm">{companySettings.address}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-4 mb-10">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest" style={{ backgroundColor: companySettings.primaryColor }}>
              <div className="col-span-6 text-right">البيان</div>
              <div className="col-span-2 text-center">الكمية</div>
              <div className="col-span-2 text-center">السعر</div>
              <div className="col-span-2 text-left">الإجمالي</div>
            </div>
            {selectedInvoice.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 text-xs">
                <div className="col-span-6 font-black text-slate-800">{item.name}</div>
                <div className="col-span-2 text-center font-bold tabular-nums">{item.quantity}</div>
                <div className="col-span-2 text-center font-bold tabular-nums">{item.price.toLocaleString()}</div>
                <div className="col-span-2 text-left font-black tabular-nums">{item.total.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Totals and Footer */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end pt-8 border-t border-slate-100 gap-8">
             <div className="max-w-xs space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الشروط والأحكام</p>
                    <p className="text-[9px] text-slate-500 font-bold leading-relaxed">{companySettings.termsAndConditions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ملاحظة</p>
                    <p className="text-[9px] text-slate-500 font-bold leading-relaxed">{companySettings.footerNote}</p>
                  </div>
                </div>
                <div className="pt-8 grid grid-cols-2 gap-10">
                   <div className="text-center">
                      <div className="h-0.5 w-full bg-slate-100 mb-2"></div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">توقيع المستلم</p>
                   </div>
                   <div className="text-center">
                      <div className="h-0.5 w-full bg-slate-100 mb-2"></div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">ختم المؤسسة</p>
                   </div>
                </div>
             </div>
            <div className="w-full md:w-80 space-y-3 bg-slate-50 p-8 rounded-[2.5rem]">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>إجمالي الفاتورة:</span>
                <span className="tabular-nums">{selectedInvoice.total.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-xs font-black text-emerald-600">
                <span>المبلغ المدفوع:</span>
                <span className="tabular-nums">{selectedInvoice.paidAmount.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-xs font-black text-rose-500">
                <span>المتبقي (آجل):</span>
                <span className="tabular-nums">{selectedInvoice.balanceAmount.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between pt-4 text-3xl font-black border-t border-slate-200" style={{ color: companySettings.primaryColor }}>
                <span>الصافي:</span>
                <span className="tabular-nums">{selectedInvoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-12 print:hidden">
            <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
              <PrinterIcon className="w-6 h-6" /> طباعة
            </button>
            <button onClick={() => setView('template')} className="flex-1 bg-white border border-slate-200 text-slate-600 py-6 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
              <PaintBrushIcon className="w-6 h-6" /> تعديل القالب
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex bg-slate-100 p-1.5 rounded-3xl mb-8">
        <button 
          onClick={() => setView('list')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          <ListBulletIcon className="w-4 h-4" /> <span>الفواتير</span>
        </button>
        <button 
          onClick={() => setView('create')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 ${view === 'create' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
        >
          <DocumentPlusIcon className="w-4 h-4" /> <span>جديدة</span>
        </button>
        <button 
          onClick={() => setView('template')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 ${view === 'template' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
        >
          <PaintBrushIcon className="w-4 h-4" /> <span>تخصيص القالب</span>
        </button>
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <DocumentDuplicateIcon className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold">لم تقم بإصدار أي فواتير بعد</p>
              <button onClick={() => setView('create')} className="mt-4 text-blue-600 font-black text-xs">أصدر أول فاتورة الآن</button>
            </div>
          ) : (
            invoices.map(inv => (
              <div 
                key={inv.id} 
                onClick={() => { setSelectedInvoice(inv); setView('detail'); }}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center justify-between shadow-sm active:scale-95 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${inv.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <ReceiptPercentIcon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{inv.partyName}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-100">#{inv.number}</span>
                      {inv.balanceAmount > 0 && <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded-lg">متبقي: {inv.balanceAmount.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-lg font-black tabular-nums ${inv.type === 'SALE' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {inv.total.toLocaleString()} <span className="text-[9px] font-normal mr-1 opacity-50">ج.م</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setType('SALE')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${type === 'SALE' ? 'bg-white text-emerald-600' : 'text-slate-400'}`}
              >فاتورة مبيعات</button>
              <button 
                onClick={() => setType('SUPPLY')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${type === 'SUPPLY' ? 'bg-white text-blue-600' : 'text-slate-400'}`}
              >فاتورة مشتريات</button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 block mr-4 uppercase">الطرف الثاني</label>
              <div className="flex gap-2">
                <select 
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="flex-1 bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none border-2 border-transparent focus:border-blue-400 transition-all"
                >
                  <option value="">اختر من المسجلين</option>
                  {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {!partyId && (
                  <input 
                    placeholder="اسم جهة جديدة.." 
                    value={manualParty}
                    onChange={(e) => setManualParty(e.target.value)}
                    className="flex-1 bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-xl space-y-6">
            <h4 className="text-sm font-black flex items-center gap-2">
              <PlusIcon className="w-5 h-5 stroke-[3] text-blue-400" /> إضافة عناصر
            </h4>
            
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12">
                <select 
                  value={selectedProductId}
                  onChange={(e) => {
                    const p = inventory.find(inv => inv.id === e.target.value);
                    setSelectedProductId(e.target.value);
                    setPrice(p ? (type === 'SALE' ? p.price.toString() : p.cost.toString()) : '0');
                  }}
                  className="w-full bg-white/10 rounded-2xl p-4 text-xs font-black text-white outline-none border border-white/10"
                >
                  <option value="" className="text-slate-900">اختر المنتج</option>
                  {inventory.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name} ({p.quantity})</option>)}
                </select>
              </div>
              <div className="col-span-3 space-y-1">
                <span className="text-[8px] font-black opacity-60 mr-2">الكمية</span>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-full bg-white/10 rounded-xl p-3 text-xs font-black text-center" />
              </div>
              <div className="col-span-3 space-y-1">
                <span className="text-[8px] font-black opacity-60 mr-2">السعر</span>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white/10 rounded-xl p-3 text-xs font-black text-center" />
              </div>
              <div className="col-span-3 space-y-1">
                <span className="text-[8px] font-black opacity-60 mr-2">الضريبة %</span>
                <input type="number" value={currentTaxRate} onChange={e => setCurrentTaxRate(e.target.value)} className="w-full bg-white/10 rounded-xl p-3 text-xs font-black text-center" />
              </div>
              <div className="col-span-3">
                <button onClick={handleAddItem} className="w-full bg-white text-slate-900 rounded-xl py-3 font-black flex items-center justify-center active:scale-90 transition-all">
                  إضافة +
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-black">{item.name}</p>
                    <p className="text-[9px] opacity-40 font-bold">QTY: {item.quantity} | {item.price} | الضريبة: {item.taxRate * 100}%</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black tabular-nums">{item.total.toLocaleString()}</span>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-400 p-2"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 relative">
                  <label className="text-[8px] font-black text-blue-300 uppercase mb-1 block">المبلغ المدفوع</label>
                  <input 
                    type="number" 
                    value={paidAmount} 
                    onChange={e => setPaidAmount(e.target.value)} 
                    className="w-full bg-transparent text-xl font-black outline-none text-white tabular-nums"
                  />
                  <CreditCardIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <label className="text-[8px] font-black text-rose-300 uppercase mb-1 block">المتبقي (آجل)</label>
                  <p className="text-xl font-black text-white tabular-nums">
                    {(totals.total - (parseFloat(paidAmount) || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div>
                  <p className="text-[10px] font-black opacity-60 mb-1 uppercase">إجمالي القيمة</p>
                  <p className="text-3xl font-black tabular-nums">{totals.total.toLocaleString()} <span className="text-sm font-normal">ج.م</span></p>
                </div>
                <button 
                  onClick={saveInvoice}
                  disabled={items.length === 0}
                  className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm shadow-2xl active:scale-95 disabled:opacity-50 transition-all"
                >
                  حفظ الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
