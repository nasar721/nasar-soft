
import React from 'react';
import { CalculatorIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  return (
    <header className="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-50 print:hidden">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <CalculatorIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Nasser Soft</h1>
      </div>
      <div className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
        يعمل بدون إنترنت
      </div>
    </header>
  );
};

export default Header;
