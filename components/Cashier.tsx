
import React, { useState, useMemo } from 'react';
import { InventoryItem, Invoice, Party, InvoiceItem } from '../types.ts';
import { 
  PlusIcon, TrashIcon, 
  CheckCircleIcon, DocumentTextIcon, 
  ArrowsRightLeftIcon 
} from '@heroicons/react/24/outline';

interface CashierProps {
  inventory: InventoryItem[];
  parties: Party[];
  onSale: (invoice: Invoice) => void;
}

const VAT_RATE = 0.14;

const Cashier: React.FC<CashierProps> = ({ inventory, parties, onSale }) => {
  const [invoiceType, setInvoiceType] = useState<'SALE' | 'SUPPLY'>('SALE');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [manualPartyName, setManualPartyName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-4)}`);
  
  const [items, setItems] = useState<{ productId: string; name: string; quantity: number; price: number }[]>([]);
  const [newItem, setNewItem] = useState({ productId: '', quantity: '1', price: '0' });

  const filteredParties = parties.filter(p => 
    invoiceType === 'SALE' ? p.type === 'CUSTOMER' : p.type === 'SUPPLIER'
  );

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);
  const tax = subtotal * VAT_RATE;
  const total = subtotal + tax;

  const handleAddItem = () => {
    const product = inventory.find(p => p.id === newItem.productId);
    if (!product) return;
    
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + parseFloat(newItem.quantity) } : i);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: parseFloat(newItem.quantity), 
        price: parseFloat(newItem.price) || (invoiceType === 'SALE' ? product.price : product.cost) 
      }];
    });
    setNewItem({ productId: '', quantity: '1', price: '0' });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.productId !== id));

  const handleSaveInvoice = () => {
    if (items.length === 0) return;
    
    const partyName = selectedPartyId 
      ? (parties.find(p => p.id === selectedPartyId)?.name || 'غير معروف')
      : (manualPartyName || (invoiceType === 'SALE' ? 'عميل نقدي' : 'مورد نقدي'));

    const mappedItems: InvoiceItem[] = items.map(i => {
      const itemTotal = i.price * i.quantity;
      const itemTax = itemTotal * VAT_RATE;
      return {
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        taxRate: VAT_RATE,
        taxAmount: itemTax,
        discount: 0,
        total: itemTotal + itemTax
      };
    });

    // Fix: Added missing properties 'paidAmount' and 'balanceAmount' to satisfy Invoice interface
    const invoice: Invoice = {
      id: `inv_c_${Date.now()}`,
      number: invoiceNumber,
      type: invoiceType,
      date: new Date().toISOString(),
      partyId: selectedPartyId || undefined,
      partyName,
      items: mappedItems,
      subtotal,
      tax, 
      totalTax: tax,
      totalDiscount: 0,
      total,
      paidAmount: total, // Defaulting to full payment for quick cashier
      balanceAmount: 0, // Defaulting to zero balance for quick cashier
      paymentMethod: 'نقدًا (الخزينة)'
    };

    onSale(invoice);

    // Reset Form
    setItems([]);
    setManualPartyName('');
    setSelectedPartyId('');
    setInvoiceNumber(`${invoiceType === 'SALE' ? 'INV' : 'PUR'}-${Math.floor(Math.random() * 1000)}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          إنشاء فاتورة سريعة
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => { setInvoiceType('SALE'); setInvoiceNumber(`INV-${Date.now().toString().slice(-4)}`); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${invoiceType === 'SALE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
          >مبيعات</button>
          <button 
            onClick={() => { setInvoiceType('SUPPLY'); setInvoiceNumber(`PUR-${Date.now().toString().slice(-4)}`); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${invoiceType === 'SUPPLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >مشتريات</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2">رقم الفاتورة</label>
            <input 
              type="text" 
              value={invoiceNumber} 
              readOnly 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-500" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2">التاريخ</label>
            <input 
              type="text" 
              value={new Date().toLocaleDateString('ar-EG')} 
              readOnly 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-500 text-center" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 mr-2">جهة التعامل</label>
          <div className="flex gap-2">
            <select 
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="flex-1 bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none transition-all appearance-none"
            >
              <option value="">-- اختر من القائمة --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {!selectedPartyId && (
              <input 
                type="text" 
                placeholder="أو اكتب اسم جهة جديدة.." 
                value={manualPartyName}
                onChange={(e) => setManualPartyName(e.target.value)}
                className="flex-[1.5] bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl space-y-6">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-6 space-y-2">
            <label className="text-[9px] font-black text-blue-200 mr-2 uppercase">المنتج</label>
            <select 
              value={newItem.productId}
              onChange={(e) => {
                const p = inventory.find(inv => inv.id === e.target.value);
                setNewItem({
                  ...newItem, 
                  productId: e.target.value,
                  price: p ? (invoiceType === 'SALE' ? p.price.toString() : p.cost.toString()) : '0'
                });
              }}
              className="w-full bg-white/10 border-white/20 rounded-2xl py-4 px-4 text-xs font-black text-white outline-none"
            >
              <option value="" className="text-slate-900">اختر منتج من المخزن</option>
              {inventory.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name} (رصيد: {p.quantity})</option>)}
            </select>
          </div>
          <div className="col-span-3 space-y-2">
            <label className="text-[9px] font-black text-blue-200 mr-2 uppercase">الكمية</label>
            <input 
              type="number" 
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
              className="w-full bg-white/10 border-white/20 rounded-2xl py-4 px-4 text-xs font-black text-white text-center outline-none"
            />
          </div>
          <div className="col-span-3">
            <button 
              onClick={handleAddItem}
              className="w-full bg-white text-blue-600 rounded-2xl py-4 font-black flex items-center justify-center transition-all active:scale-90"
            >
              <PlusIcon className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          {items.map(item => (
            <div key={item.productId} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-black">{item.name}</p>
                <div className="flex gap-4 mt-1 opacity-60">
                  <span className="text-[9px] font-bold">الكمية: {item.quantity}</span>
                  <span className="text-[9px] font-bold">السعر: {item.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-black">{(item.price * item.quantity).toLocaleString()}</span>
                <button onClick={() => removeItem(item.productId)} className="text-rose-300 p-2"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-200 uppercase mb-1">الإجمالي (شامل ضريبة 14%)</p>
            <p className="text-3xl font-black tabular-nums">{total.toLocaleString()} <span className="text-sm font-normal text-blue-300">ج.م</span></p>
          </div>
          <button 
            onClick={handleSaveInvoice}
            disabled={items.length === 0}
            className="bg-white text-blue-600 px-8 py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-blue-900/40 flex items-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
          >
            حفظ الفاتورة
            <CheckCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-4">
        <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500">
          <ArrowsRightLeftIcon className="w-5 h-5" />
        </div>
        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
          عند الحفظ، سيتم تحديث أرصدة المخازن والعملاء واحتساب ضريبة القيمة المضافة بنسبة 14% تلقائياً.
        </p>
      </div>
    </div>
  );
};

export default Cashier;
