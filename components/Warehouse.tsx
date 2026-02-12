
import React, { useState } from 'react';
import { InventoryItem, Party } from '../types.ts';
import { CubeIcon, PlusIcon, TagIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/outline';

interface WarehouseProps {
  inventory: InventoryItem[];
  parties: Party[];
  onAddItem: (item: Omit<InventoryItem, 'id'>, supplierId?: string) => void;
}

const Warehouse: React.FC<WarehouseProps> = ({ inventory, parties, onAddItem }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', sku: '', price: '', cost: '', quantity: '', category: 'عام', supplierId: '' });

  const suppliers = parties.filter(p => p.type === 'SUPPLIER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem({
      name: newItem.name,
      sku: newItem.sku || `SKU-${Date.now()}`,
      price: parseFloat(newItem.price),
      cost: parseFloat(newItem.cost),
      quantity: parseFloat(newItem.quantity),
      category: newItem.category
    }, newItem.supplierId || undefined);
    setNewItem({ name: '', sku: '', price: '', cost: '', quantity: '', category: 'عام', supplierId: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800">المستودع</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-900/5 space-y-4 animate-in zoom-in-95">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="اسم المنتج" className="col-span-2 w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
            
            <div className="col-span-2 relative">
              <select 
                value={newItem.supplierId}
                onChange={e => setNewItem({...newItem, supplierId: e.target.value})}
                className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none appearance-none border-2 border-transparent focus:border-blue-400 transition-all"
              >
                <option value="">اختر المورد (اختياري)</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <input type="number" placeholder="سعر البيع" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
            <input type="number" placeholder="التكلفة" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} required />
            <input type="number" placeholder="الكمية الافتتاحية" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} required />
            <input type="text" placeholder="التصنيف" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl mt-4 shadow-lg shadow-blue-100 transition-all active:scale-95">إضافة للمخزن</button>
        </form>
      )}

      <div className="grid gap-4">
        {inventory.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center justify-between shadow-sm group">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                <CubeIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-slate-800">{item.name}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><TagIcon className="w-3 h-3"/> {item.category}</span>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><BanknotesIcon className="w-3 h-3"/> {item.price} ج.م</span>
                </div>
              </div>
            </div>
            <div className="text-left">
              <p className={`text-xl font-black tabular-nums ${item.quantity < 10 ? 'text-rose-500' : 'text-slate-800'}`}>
                {item.quantity}
              </p>
              <p className="text-[8px] font-black text-slate-300 uppercase">قطعة متوفرة</p>
            </div>
          </div>
        ))}
        {inventory.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <CubeIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="font-black">المخزن فارغ حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Warehouse;
