
import React, { useMemo } from 'react';
import { InventoryItem, Invoice } from '../types.ts';
import { 
  CubeIcon, BoltIcon, ExclamationTriangleIcon, 
  ArrowTrendingUpIcon, BanknotesIcon, ClockIcon,
  CircleStackIcon, ShoppingCartIcon
} from '@heroicons/react/24/outline';

interface InventoryReportProps {
  inventory: InventoryItem[];
  invoices: Invoice[];
}

const InventoryReport: React.FC<InventoryReportProps> = ({ inventory, invoices }) => {
  // تحليل المبيعات خلال الـ 30 يوماً الماضية
  const analytics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesMap = new Map<string, number>();
    
    invoices
      .filter(inv => inv.type === 'SALE' && new Date(inv.date) >= thirtyDaysAgo)
      .forEach(inv => {
        inv.items.forEach(item => {
          const current = salesMap.get(item.productId) || 0;
          salesMap.set(item.productId, current + item.quantity);
        });
      });

    return inventory.map(item => {
      const totalSoldLast30Days = salesMap.get(item.id) || 0;
      const velocity = totalSoldLast30Days / 30; // متوسط مبيعات يومية
      const daysLeft = velocity > 0 ? Math.floor(item.quantity / velocity) : Infinity;
      
      // اقتراح إعادة طلب إذا كانت الكمية تكفي لأقل من 7 أيام
      const reorderPoint = Math.ceil(velocity * 7) || 5; 
      const needsReorder = item.quantity <= reorderPoint;

      return {
        ...item,
        velocity,
        totalSoldLast30Days,
        daysLeft,
        reorderPoint,
        needsReorder,
        totalCost: item.quantity * item.cost,
        potentialRevenue: item.quantity * item.price
      };
    });
  }, [inventory, invoices]);

  const stats = useMemo(() => {
    const totalCostValue = analytics.reduce((sum, item) => sum + item.totalCost, 0);
    const totalPotentialRevenue = analytics.reduce((sum, item) => sum + item.potentialRevenue, 0);
    const lowStockCount = analytics.filter(i => i.needsReorder).length;

    return { totalCostValue, totalPotentialRevenue, lowStockCount };
  }, [analytics]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">ذكاء المخزن</h2>
        <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2 border border-amber-100">
          <BoltIcon className="w-4 h-4" /> تحليل ذكي
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
          <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
            <CircleStackIcon className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">قيمة المخزون (بالتكلفة)</p>
          <h3 className="text-xl font-black tabular-nums">{stats.totalCostValue.toLocaleString()} <span className="text-[10px] font-normal opacity-50">ج.م</span></h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
            <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الأرباح المتوقعة</p>
          <h3 className="text-xl font-black tabular-nums text-emerald-600">{(stats.totalPotentialRevenue - stats.totalCostValue).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span></h3>
        </div>
      </div>

      {/* Alerts */}
      {stats.lowStockCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-[2rem] flex items-center gap-4">
          <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-200">
            <ExclamationTriangleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black text-rose-800">تنبيه إعادة طلب</h4>
            <p className="text-[10px] text-rose-600 font-bold leading-relaxed">يوجد {stats.lowStockCount} أصناف قاربت على النفاذ بناءً على معدل مبيعاتك.</p>
          </div>
        </div>
      )}

      {/* Detailed Analysis List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">تحليل الأصناف</h3>
        {analytics.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`p-4 rounded-2xl ${item.needsReorder ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                  <CubeIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{item.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg">SKU: {item.sku}</span>
                    <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-lg">التكلفة: {item.cost}</span>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-black tabular-nums">{item.quantity}</div>
                <div className="text-[9px] font-black text-slate-300 uppercase">قطعة بالمخزن</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-50 pt-5">
              <div className="bg-slate-50/50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="w-3 h-3" /> سرعة البيع
                </p>
                <p className="text-xs font-black tabular-nums text-slate-700">{item.velocity.toFixed(2)} <span className="text-[8px] font-normal">يومياً</span></p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" /> التغطية
                </p>
                <p className={`text-xs font-black tabular-nums ${item.daysLeft < 7 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {item.daysLeft === Infinity ? '∞' : `${item.daysLeft} يوم`}
                </p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ShoppingCartIcon className="w-3 h-3" /> نقطة الطلب
                </p>
                <p className="text-xs font-black tabular-nums text-slate-700">{item.reorderPoint} <span className="text-[8px] font-normal">قطعة</span></p>
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-1.5">
               <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase">
                 <span>حالة التوفر</span>
                 <span>{Math.min(100, Math.floor((item.quantity / (item.reorderPoint * 3)) * 100))}%</span>
               </div>
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-1000 ${item.needsReorder ? 'bg-rose-500' : 'bg-emerald-500'}`}
                   style={{ width: `${Math.min(100, (item.quantity / (item.reorderPoint * 3)) * 100)}%` }}
                 ></div>
               </div>
            </div>
          </div>
        ))}

        {inventory.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <CircleStackIcon className="w-16 h-16 mx-auto mb-4 text-slate-100" />
             <p className="text-slate-400 font-bold">لا توجد بيانات مخزون للتحليل</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryReport;
