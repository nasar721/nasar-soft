
import React, { useState, useMemo } from 'react';
import { Party, JournalLine, JournalHeader } from '../types.ts';
import { 
  UserGroupIcon, UserPlusIcon, PhoneIcon, 
  MapPinIcon, PencilSquareIcon, CheckIcon, 
  XMarkIcon, BanknotesIcon, TrashIcon,
  ChevronLeftIcon, ChevronDownIcon,
  DocumentTextIcon, MagnifyingGlassIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

interface PartiesProps {
  parties: Party[];
  lines: JournalLine[];
  headers: JournalHeader[];
  onAdd: (party: Omit<Party, 'id'>) => void;
  onUpdate: (party: Party) => void;
  onDelete: (partyId: string) => void;
}

export default function Parties({ parties, lines, headers, onAdd, onUpdate, onDelete }: PartiesProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    initialBalance: '0' 
  });

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', initialBalance: '0' });
    setShowAdd(false);
    setEditingId(null);
  };

  const handleEdit = (e: React.MouseEvent, party: Party) => {
    e.stopPropagation();
    setFormData({
      name: party.name,
      phone: party.phone,
      address: party.address || '',
      initialBalance: party.initialBalance.toString()
    });
    setEditingId(party.id);
    setShowAdd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const original = parties.find(p => p.id === editingId);
      if (original) {
        onUpdate({
          ...original,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          initialBalance: parseFloat(formData.initialBalance) || 0
        });
      }
    } else {
      onAdd({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        type: filter,
        initialBalance: parseFloat(formData.initialBalance) || 0
      });
    }
    resetForm();
  };

  const getPartyStats = (partyId: string, initialBalance: number, type: 'CUSTOMER' | 'SUPPLIER') => {
    const partyHeaders = headers.filter(h => h.partyId === partyId);
    let totalDebit = 0;
    let totalCredit = 0;

    const transactionList = partyHeaders.map(h => {
      const partyLines = lines.filter(l => l.headerId === h.id);
      let debit = 0;
      let credit = 0;
      partyLines.forEach(l => {
        debit += l.debit;
        credit += l.credit;
      });
      totalDebit += debit;
      totalCredit += credit;
      return { ...h, debit, credit };
    });

    // Customer: Bal = Init + Debit (Sales) - Credit (Payments)
    // Supplier: Bal = Init + Credit (Purchases) - Debit (Payments)
    const currentBalance = type === 'CUSTOMER' 
      ? initialBalance + (totalDebit - totalCredit)
      : initialBalance + (totalCredit - totalDebit);

    return { balance: currentBalance, transactions: transactionList };
  };

  const filteredParties = useMemo(() => {
    return parties
      .filter(p => p.type === filter)
      .filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.phone.includes(searchQuery)
      );
  }, [parties, filter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800">أطراف التعامل</h2>
        <button 
          onClick={() => { resetForm(); setShowAdd(!showAdd); }} 
          className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          {showAdd ? <XMarkIcon className="w-6 h-6" /> : <UserPlusIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="space-y-4">
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">
          <button 
            onClick={() => { setFilter('CUSTOMER'); setExpandedId(null); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${filter === 'CUSTOMER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >العملاء</button>
          <button 
            onClick={() => { setFilter('SUPPLIER'); setExpandedId(null); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${filter === 'SUPPLIER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >الموردين</button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text"
            placeholder={`بحث في ${filter === 'CUSTOMER' ? 'العملاء' : 'الموردين'}..`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pr-12 pl-4 text-xs font-bold outline-none focus:border-blue-400 transition-all shadow-sm"
          />
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl space-y-4 animate-in zoom-in-95">
          <h3 className="text-sm font-black text-slate-800 mb-2">
            {editingId ? 'تعديل بيانات الطرف' : `إضافة ${filter === 'CUSTOMER' ? 'عميل' : 'مورد'} جديد`}
          </h3>
          <input 
            type="text" 
            placeholder="الاسم الكامل" 
            className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <input 
            type="tel" 
            placeholder="رقم الهاتف" 
            className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="العنوان بالتفصيل" 
            className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all" 
            value={formData.address} 
            onChange={e => setFormData({...formData, address: e.target.value})} 
          />
          <div className="relative">
            <input 
              type="number" 
              placeholder="الرصيد الافتتاحي" 
              className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all" 
              value={formData.initialBalance} 
              onChange={e => setFormData({...formData, initialBalance: e.target.value})} 
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">ج.م</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
              <CheckIcon className="w-5 h-5 stroke-[3]" />
              {editingId ? 'حفظ التعديلات' : 'إضافة الآن'}
            </button>
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl"
            >إلغاء</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 pb-20">
        {filteredParties.map(p => {
          const stats = getPartyStats(p.id, p.initialBalance, p.type);
          const isExpanded = expandedId === p.id;

          return (
            <div 
              key={p.id} 
              className={`bg-white rounded-[2.5rem] border transition-all duration-300 shadow-sm overflow-hidden ${isExpanded ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-50'}`}
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${filter === 'CUSTOMER' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      <UserGroupIcon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-base">{p.name}</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{p.type === 'CUSTOMER' ? 'عميل' : 'مورد'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleEdit(e, p)}
                      className="p-3 text-slate-300 hover:text-blue-500 transition-colors bg-slate-50 rounded-xl"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('هل تريد الحذف؟')) onDelete(p.id); }}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {p.phone && (
                    <a 
                      href={`tel:${p.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-3 rounded-xl transition-all"
                    >
                      <DevicePhoneMobileIcon className="w-4 h-4" />
                      <span className="text-[10px] font-black">{p.phone}</span>
                    </a>
                  )}
                  {p.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 py-3 rounded-xl transition-all"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      <span className="text-[10px] font-black">الموقع</span>
                    </a>
                  )}
                </div>

                <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">الرصيد الحالي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-lg font-black tabular-nums ${stats.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {stats.balance.toLocaleString()} <span className="text-[9px] font-normal mr-1 opacity-50">ج.م</span>
                    </p>
                    {isExpanded ? <ChevronDownIcon className="w-4 h-4 text-slate-300" /> : <ChevronLeftIcon className="w-4 h-4 text-slate-300" />}
                  </div>
                </div>
              </div>

              {/* Expanded History Ledger */}
              {isExpanded && (
                <div className="bg-slate-50 p-6 border-t border-slate-100 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4" /> كشف حساب تفصيلي
                    </h4>
                    <span className="text-[9px] font-black text-slate-300">افتتاحي: {p.initialBalance.toLocaleString()}</span>
                  </div>
                  
                  {stats.transactions.length === 0 ? (
                    <p className="text-xs font-bold text-slate-300 text-center py-4">لا توجد عمليات مسجلة</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 px-2 text-[8px] font-black text-slate-300 uppercase">
                        <div className="col-span-5">البيان</div>
                        <div className="col-span-3 text-center">مدين</div>
                        <div className="col-span-3 text-center">دائن</div>
                      </div>
                      {stats.transactions.map(t => (
                        <div key={t.id} className="grid grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-center">
                          <div className="col-span-5">
                            <p className="text-[10px] font-black text-slate-700 truncate">{t.description}</p>
                            <p className="text-[8px] text-slate-400 font-bold">{new Date(t.date).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <div className="col-span-3 text-center text-[10px] font-black text-rose-500">{t.debit > 0 ? t.debit.toLocaleString() : '-'}</div>
                          <div className="col-span-3 text-center text-[10px] font-black text-emerald-600">{t.credit > 0 ? t.credit.toLocaleString() : '-'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredParties.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-50">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-slate-100" />
            <p className="font-black text-slate-300">لا توجد نتائج بحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
