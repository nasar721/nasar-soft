
import React, { useState } from 'react';
import { CompanySettings } from '../types.ts';
import { 
  BuildingOfficeIcon, PhotoIcon, DevicePhoneMobileIcon, 
  MapPinIcon, IdentificationIcon, ChatBubbleBottomCenterTextIcon, 
  CheckCircleIcon, EyeIcon, PaintBrushIcon, BanknotesIcon
} from '@heroicons/react/24/outline';

interface SettingsProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const THEME_COLORS = [
  { name: 'أزرق', hex: '#2563eb' },
  { name: 'أخضر', hex: '#059669' },
  { name: 'أحمر', hex: '#dc2626' },
  { name: 'رمادي', hex: '#4b5563' },
  { name: 'بنفسجي', hex: '#7c3aed' },
];

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const CustomToggle = ({ enabled }: { enabled: boolean }) => (
    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${enabled ? '-translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800">إعدادات المؤسسة</h2>
        {isSaved && (
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full animate-bounce">
            <CheckCircleIcon className="w-4 h-4" /> تم الحفظ بنجاح
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        
        {/* Invoice Preview Card */}
        <div className="bg-slate-900 p-1 rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
           <div className="bg-white m-0.5 p-6 rounded-[2.3rem] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-3">
                  {formData.showLogo && formData.logo ? (
                    <img src={formData.logo} className="w-10 h-10 rounded-lg object-contain" />
                  ) : formData.showLogo && (
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{formData.name}</h4>
                    {formData.showTaxNumber && <p className="text-[8px] text-slate-400 font-bold">{formData.taxNumber}</p>}
                  </div>
                </div>
                <div className="text-left">
                  <div className="h-1.5 w-12 rounded-full mb-1" style={{ backgroundColor: formData.primaryColor }}></div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">فاتورة مبيعات</p>
                </div>
              </div>
              <div className="space-y-1.5 opacity-40">
                <div className="h-2 w-full bg-slate-100 rounded"></div>
                <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
              </div>
              <p className="text-[8px] text-slate-300 italic text-center border-t border-slate-50 pt-2">{formData.footerNote}</p>
           </div>
           <div className="absolute top-4 left-4 bg-slate-900/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
             <EyeIcon className="w-3 h-3 text-white" />
             <span className="text-[8px] font-black text-white uppercase tracking-widest">معاينة مباشرة</span>
           </div>
        </div>

        {/* Customization Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
           <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
             <PaintBrushIcon className="w-4 h-4 text-blue-500" /> مظهر القالب (Theme)
           </h3>
           
           <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-400 uppercase">اللون الرئيسي للهوية</p>
             <div className="flex gap-3">
               {THEME_COLORS.map(color => (
                 <button
                   key={color.hex}
                   type="button"
                   onClick={() => setFormData({...formData, primaryColor: color.hex})}
                   className={`w-10 h-10 rounded-2xl border-4 transition-all ${formData.primaryColor === color.hex ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent'}`}
                   style={{ backgroundColor: color.hex }}
                 />
               ))}
             </div>
           </div>

           <div className="grid grid-cols-1 gap-3">
              <button 
                type="button"
                onClick={() => setFormData({...formData, showLogo: !formData.showLogo})}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.showLogo ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}
              >
                <span className="text-xs font-black text-slate-700">إظهار الشعار في الفاتورة</span>
                <CustomToggle enabled={formData.showLogo} />
              </button>

              <button 
                type="button"
                onClick={() => setFormData({...formData, showTaxNumber: !formData.showTaxNumber})}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.showTaxNumber ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}
              >
                <span className="text-xs font-black text-slate-700">إظهار الرقم الضريبي</span>
                <CustomToggle enabled={formData.showTaxNumber} />
              </button>

              <button 
                type="button"
                onClick={() => setFormData({...formData, showAddress: !formData.showAddress})}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.showAddress ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}
              >
                <span className="text-xs font-black text-slate-700">إظهار العنوان بالترويسة</span>
                <CustomToggle enabled={formData.showAddress} />
              </button>
           </div>
        </div>

        {/* Info Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase">
              <BuildingOfficeIcon className="w-3 h-3" /> اسم المؤسسة
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none focus:ring-4 ring-blue-50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase">
                <DevicePhoneMobileIcon className="w-3 h-3" /> رقم التواصل
              </label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase">
                <IdentificationIcon className="w-3 h-3" /> الرقم الضريبي
              </label>
              <input 
                type="text" 
                value={formData.taxNumber}
                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase">
                <MapPinIcon className="w-3 h-3" /> العنوان
              </label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase">
                <BanknotesIcon className="w-3 h-3" /> نسبة الضريبة الافتراضية (%)
              </label>
              <input 
                type="number" 
                value={formData.defaultTaxRate}
                onChange={e => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase">
              <ChatBubbleBottomCenterTextIcon className="w-3 h-3" /> ملاحظات أسفل الفاتورة
            </label>
            <textarea 
              value={formData.footerNote}
              onChange={e => setFormData({ ...formData, footerNote: e.target.value })}
              rows={2}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 outline-none resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-50">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-3">شعار المحل</p>
             <div className="flex items-center gap-4">
               <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                 {formData.logo ? (
                   <img src={formData.logo} className="w-full h-full object-contain" />
                 ) : <PhotoIcon className="w-8 h-8 text-slate-200" />}
               </div>
               <label className="bg-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-600 cursor-pointer active:scale-95 transition-all">
                 رفع صورة
                 <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
               </label>
             </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <CheckCircleIcon className="w-6 h-6 text-blue-400" />
          حفظ كافة التغييرات
        </button>
      </form>
    </div>
  );
};

export default Settings;
