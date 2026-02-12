
import React, { useState } from 'react';
import { Employee } from '../types.ts';
import { UsersIcon, UserPlusIcon, BriefcaseIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface HRProps {
  employees: Employee[];
  onAdd: (emp: Omit<Employee, 'id'>) => void;
}

const HR: React.FC<HRProps> = ({ employees, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', position: '', salary: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: newEmp.name,
      position: newEmp.position,
      salary: parseFloat(newEmp.salary),
      status: 'active'
    });
    setNewEmp({ name: '', position: '', salary: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800">الموظفين</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg">
          <UserPlusIcon className="w-6 h-6" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl space-y-4">
          <input type="text" placeholder="اسم الموظف" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} required />
          <input type="text" placeholder="المسمى الوظيفي" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newEmp.position} onChange={e => setNewEmp({...newEmp, position: e.target.value})} required />
          <input type="number" placeholder="الراتب الأساسي" className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: e.target.value})} required />
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl">تسجيل موظف جديد</button>
        </form>
      )}

      <div className="grid gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-slate-800">{emp.name}</p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><BriefcaseIcon className="w-3 h-3"/> {emp.position}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-lg font-black tabular-nums text-slate-800">{emp.salary.toLocaleString()} ج.م</p>
              <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">على رأس العمل</span>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
            <p className="font-black">لا يوجد موظفين مسجلين</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HR;
