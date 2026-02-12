
import React, { useState, useEffect, useMemo } from 'react';
import { Account, JournalHeader, JournalLine, Summary, TransactionType, Transaction, InventoryItem, Employee, Invoice, Party, CompanySettings } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import TransactionList from './components/TransactionList.tsx';
import Reports from './components/Reports.tsx';
import InvoiceModule from './components/InvoiceModule.tsx';
import Warehouse from './components/Warehouse.tsx';
import HR from './components/HR.tsx';
import Parties from './components/Parties.tsx';
import Header from './components/Header.tsx';
import Settings from './components/Settings.tsx';
import InventoryReport from './components/InventoryReport.tsx';
import { 
  HomeIcon, ShoppingBagIcon, CubeIcon, 
  ChartBarIcon, IdentificationIcon, ListBulletIcon, 
  PlusIcon, ArrowUpIcon, ArrowDownIcon, 
  Cog6ToothIcon, BeakerIcon 
} from '@heroicons/react/24/outline';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'نقدًا (الخزينة)', type: 'ASSET' },
  { id: 'acc_bank', name: 'بنك / تحويل', type: 'ASSET' },
  { id: 'acc_sales', name: 'مبيعات', type: 'INCOME' },
  { id: 'acc_inventory', name: 'المخزون', type: 'ASSET' },
  { id: 'acc_cost_sales', name: 'تكلفة المبيعات', type: 'EXPENSE' },
  { id: 'acc_vat_out', name: 'ضريبة مخرجات (VAT)', type: 'LIABILITY' },
  { id: 'acc_vat_in', name: 'ضريبة مدخلات (VAT)', type: 'ASSET' },
  { id: 'acc_purchases', name: 'مشتريات', type: 'EXPENSE' },
  { id: 'acc_other_exp', name: 'أخرى', type: 'EXPENSE' },
];

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'Nasser Soft',
  address: 'شارع العمل، القاهرة',
  phone: '01000000000',
  taxNumber: '000-000-000',
  footerNote: 'شكراً لتعاملكم معنا!',
  termsAndConditions: 'البضاعة المباعة لا ترد ولا تستبدل بعد 14 يومًا.',
  primaryColor: '#2563eb', 
  showLogo: true,
  showTaxNumber: true,
  showAddress: true,
  defaultTaxRate: 14,
};

const App: React.FC = () => {
  type Tab = 'dashboard' | 'cashier' | 'warehouse' | 'hr' | 'reports' | 'inventory_report' | 'parties' | 'transactions' | 'add' | 'settings';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState<TransactionType>(TransactionType.EXPENSE);

  const [accounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [headers, setHeaders] = useState<JournalHeader[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const savedHeaders = localStorage.getItem('acc_headers');
    const savedLines = localStorage.getItem('acc_lines');
    const savedInventory = localStorage.getItem('acc_inventory');
    const savedEmployees = localStorage.getItem('acc_employees');
    const savedParties = localStorage.getItem('acc_parties');
    const savedInvoices = localStorage.getItem('acc_invoices');
    const savedSettings = localStorage.getItem('acc_settings');
    
    if (savedHeaders) setHeaders(JSON.parse(savedHeaders));
    if (savedLines) setLines(JSON.parse(savedLines));
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedParties) setParties(JSON.parse(savedParties));
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setCompanySettings({ ...DEFAULT_SETTINGS, ...parsed });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('acc_headers', JSON.stringify(headers));
    localStorage.setItem('acc_lines', JSON.stringify(lines));
    localStorage.setItem('acc_inventory', JSON.stringify(inventory));
    localStorage.setItem('acc_employees', JSON.stringify(employees));
    localStorage.setItem('acc_parties', JSON.stringify(parties));
    localStorage.setItem('acc_invoices', JSON.stringify(invoices));
    localStorage.setItem('acc_settings', JSON.stringify(companySettings));
  }, [headers, lines, inventory, employees, parties, invoices, companySettings]);

  const summary: Summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const accountMap = new Map<string, Account>(accounts.map(a => [a.id, a]));
    const assetBalances = new Map<string, number>();

    accounts.filter(a => a.type === 'ASSET').forEach(a => assetBalances.set(a.id, 0));

    lines.forEach(line => {
      const acc = accountMap.get(line.accountId);
      if (!acc) return;
      if (acc.type === 'INCOME') totalIncome += (line.credit - line.debit);
      else if (acc.type === 'EXPENSE') totalExpense += (line.debit - line.credit);
      else if (acc.type === 'ASSET') {
        const current = assetBalances.get(acc.id) || 0;
        assetBalances.set(acc.id, current + (line.debit - line.credit));
      }
    });

    let totalReceivables = 0;
    let totalPayables = 0;

    parties.forEach(p => {
      const pHeaders = headers.filter(h => h.partyId === p.id);
      let pDebit = 0;
      let pCredit = 0;
      pHeaders.forEach(h => {
        lines.filter(l => l.headerId === h.id).forEach(l => {
          pDebit += l.debit;
          pCredit += l.credit;
        });
      });

      const balance = p.type === 'CUSTOMER' 
        ? p.initialBalance + (pDebit - pCredit)
        : p.initialBalance + (pCredit - pDebit);

      if (p.type === 'CUSTOMER' && balance > 0) totalReceivables += balance;
      if (p.type === 'SUPPLIER' && balance > 0) totalPayables += balance;
    });

    return {
      totalIncome, totalExpense,
      netProfit: totalIncome - totalExpense,
      assets: [
        ...Array.from(assetBalances.entries()).map(([id, balance]) => ({
          name: accountMap.get(id)?.name || 'حساب', balance
        })),
        { name: 'ديون عند العملاء', balance: totalReceivables }
      ],
      liabilities: [
        { name: 'ديون للموردين', balance: totalPayables }
      ],
      equity: []
    };
  }, [lines, accounts, parties, headers]);

  const handleCreateInvoice = (newInvoice: Invoice) => {
    const headerId = `h_inv_${newInvoice.id}`;
    
    let currentPartyId = newInvoice.partyId;
    if (!currentPartyId) {
      const partyObj: Party = {
        id: `p_${Date.now()}`,
        name: newInvoice.partyName,
        type: newInvoice.type === 'SALE' ? 'CUSTOMER' : 'SUPPLIER',
        phone: '',
        initialBalance: 0
      };
      setParties(prev => [...prev, partyObj]);
      currentPartyId = partyObj.id;
      newInvoice.partyId = currentPartyId;
    }

    const header: JournalHeader = {
      id: headerId,
      date: newInvoice.date,
      description: `فاتورة ${newInvoice.type === 'SALE' ? 'مبيعات' : 'مشتريات'} #${newInvoice.number}`,
      txType: newInvoice.type,
      partyId: currentPartyId,
      invoiceId: newInvoice.id
    };

    const newLines: JournalLine[] = [];
    const updatedInventory = [...inventory];

    if (newInvoice.type === 'SALE') {
      if (newInvoice.paidAmount > 0) {
        newLines.push({ id: `${headerId}_l1`, headerId, accountId: 'acc_cash', debit: newInvoice.paidAmount, credit: 0, note: 'المسدد من الفاتورة' });
      }
      newLines.push({ id: `${headerId}_l2`, headerId, accountId: 'acc_sales', debit: 0, credit: newInvoice.subtotal - newInvoice.totalDiscount, note: 'صافي المبيعات' });
      if (newInvoice.totalTax > 0) {
        newLines.push({ id: `${headerId}_l3`, headerId, accountId: 'acc_vat_out', debit: 0, credit: newInvoice.totalTax, note: 'ضريبة مخرجات' });
      }

      let totalCost = 0;
      newInvoice.items.forEach(item => {
        const p = updatedInventory.find(inv => inv.id === item.productId);
        if (p) {
          p.quantity -= item.quantity;
          totalCost += (p.cost * item.quantity);
        }
      });
      newLines.push({ id: `${headerId}_cogs`, headerId, accountId: 'acc_cost_sales', debit: totalCost, credit: 0, note: 'تكلفة بضاعة مباعة' });
      newLines.push({ id: `${headerId}_inv`, headerId, accountId: 'acc_inventory', debit: 0, credit: totalCost, note: 'صرف من المخزن' });

    } else {
      newLines.push({ id: `${headerId}_l1`, headerId, accountId: 'acc_inventory', debit: newInvoice.subtotal - newInvoice.totalDiscount, credit: 0, note: 'دخول مخزن' });
      if (newInvoice.totalTax > 0) {
        newLines.push({ id: `${headerId}_l2`, headerId, accountId: 'acc_vat_in', debit: newInvoice.totalTax, credit: 0, note: 'ضريبة مدخلات' });
      }
      if (newInvoice.paidAmount > 0) {
        newLines.push({ id: `${headerId}_l3`, headerId, accountId: 'acc_cash', debit: 0, credit: newInvoice.paidAmount, note: 'المسدد للمورد' });
      }

      newInvoice.items.forEach(item => {
        const p = updatedInventory.find(inv => inv.id === item.productId);
        if (p) {
          const currentVal = p.quantity * p.cost;
          const newVal = item.quantity * item.price;
          p.quantity += item.quantity;
          p.cost = (currentVal + newVal) / p.quantity;
        }
      });
    }

    setHeaders(prev => [header, ...prev]);
    setLines(prev => [...prev, ...newLines]);
    setInventory(updatedInventory);
    setInvoices(prev => [newInvoice, ...prev]);
    setActiveTab('transactions');
  };

  const handleAddItemToWarehouse = (item: Omit<InventoryItem, 'id'>, supplierId?: string) => {
    const itemId = `item_${Date.now()}`;
    const newItem: InventoryItem = { ...item, id: itemId };
    setInventory(prev => [...prev, newItem]);

    if (newItem.quantity > 0) {
      const headerId = `h_open_${itemId}`;
      const header: JournalHeader = {
        id: headerId,
        date: new Date().toISOString(),
        description: `رصيد افتتاحي منتج: ${newItem.name}`,
        txType: 'INITIAL',
        partyId: supplierId
      };
      const totalCost = newItem.quantity * newItem.cost;
      const newLines: JournalLine[] = [
        { id: `${headerId}_l1`, headerId, accountId: 'acc_inventory', debit: totalCost, credit: 0, note: 'جرد مخزني' },
        { id: `${headerId}_l2`, headerId, accountId: 'acc_other_exp', debit: 0, credit: totalCost, note: 'رصيد مقابل' }
      ];
      setHeaders(prev => [header, ...prev]);
      setLines(prev => [...prev, ...newLines]);
    }
  };

  const handleQuickAdd = (type: TransactionType) => {
    setPreselectedType(type);
    setActiveTab('add');
    setIsFabOpen(false);
  };

  const addTransaction = (data: Omit<Transaction, 'id' | 'date'>) => {
    const headerId = `h_${Date.now()}`;
    const header: JournalHeader = { id: headerId, date: new Date().toISOString(), description: data.description, txType: data.type };
    const accAsset = accounts.find(a => a.name === data.method) || accounts[0];
    const accCat = accounts.find(a => a.name === data.category) || accounts[accounts.length - 1];

    setHeaders(prev => [header, ...prev]);
    setLines(prev => [...prev, 
      { id: `${headerId}_l1`, headerId, accountId: accAsset.id, debit: data.type === TransactionType.INCOME ? data.amount : 0, credit: data.type === TransactionType.EXPENSE ? data.amount : 0 },
      { id: `${headerId}_l2`, headerId, accountId: accCat.id, debit: data.type === TransactionType.EXPENSE ? data.amount : 0, credit: data.type === TransactionType.INCOME ? data.amount : 0 }
    ]);
    setActiveTab('transactions');
  };

  const handleUpdateParty = (updatedParty: Party) => {
    setParties(prev => prev.map(p => p.id === updatedParty.id ? updatedParty : p));
  };

  const handleDeleteParty = (partyId: string) => {
    const hasTransactions = headers.some(h => h.partyId === partyId);
    if (hasTransactions) {
      alert("لا يمكن حذف طرف مرتبط بعمليات مالية. قم بحذف العمليات أولاً.");
      return;
    }
    setParties(prev => prev.filter(p => p.id !== partyId));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD] pb-32 font-['Cairo'] antialiased">
      <Header />
      <main className="flex-1 p-5 max-w-lg mx-auto w-full relative">
        {activeTab === 'dashboard' && <Dashboard summary={summary} headers={headers} lines={lines} accounts={accounts} onQuickAction={handleQuickAdd} />}
        {activeTab === 'cashier' && (
          <InvoiceModule 
            inventory={inventory} 
            parties={parties} 
            invoices={invoices} 
            onSaveInvoice={handleCreateInvoice} 
            companySettings={companySettings} 
            onUpdateSettings={setCompanySettings}
          />
        )}
        {activeTab === 'warehouse' && <Warehouse inventory={inventory} parties={parties} onAddItem={handleAddItemToWarehouse} />}
        {activeTab === 'parties' && (
          <Parties 
            parties={parties} 
            lines={lines} 
            headers={headers} 
            onAdd={(p) => setParties(prev => [...prev, { ...p, id: `p_${Date.now()}` }])} 
            onUpdate={handleUpdateParty} 
            onDelete={handleDeleteParty}
          />
        )}
        {activeTab === 'hr' && <HR employees={employees} onAdd={(e) => setEmployees(prev => [...prev, { ...e, id: `e_${Date.now()}` }])} />}
        {activeTab === 'reports' && <Reports lines={lines} accounts={accounts} summary={summary} companySettings={companySettings} />}
        {activeTab === 'inventory_report' && <InventoryReport inventory={inventory} invoices={invoices} />}
        {activeTab === 'transactions' && <TransactionList headers={headers} lines={lines} accounts={accounts} onDelete={(id) => { setHeaders(prev => prev.filter(h => h.id !== id)); setLines(prev => prev.filter(l => l.headerId !== id)); }} onQuickAdd={handleQuickAdd} />}
        {activeTab === 'add' && <TransactionForm onAdd={addTransaction} initialType={preselectedType} />}
        {activeTab === 'settings' && <Settings settings={companySettings} onSave={setCompanySettings} />}

        <div className="fixed bottom-28 left-6 z-[60] flex flex-col items-center gap-3 print:hidden">
          {isFabOpen && (
            <>
              <button onClick={() => handleQuickAdd(TransactionType.INCOME)} className="bg-emerald-500 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center animate-in slide-in-from-bottom-4 duration-200">
                <ArrowUpIcon className="w-6 h-6 stroke-[3]" />
              </button>
              <button onClick={() => handleQuickAdd(TransactionType.EXPENSE)} className="bg-rose-500 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center animate-in slide-in-from-bottom-8 duration-200">
                <ArrowDownIcon className="w-6 h-6 stroke-[3]" />
              </button>
            </>
          )}
          <button onClick={() => setIsFabOpen(!isFabOpen)} className={`${isFabOpen ? 'bg-slate-800 rotate-45' : 'bg-blue-600 shadow-blue-200'} text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90`}>
            <PlusIcon className="w-8 h-8 stroke-[2.5]" />
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center h-24 px-4 shadow-lg z-50 rounded-t-[3rem] no-scrollbar overflow-x-auto whitespace-nowrap print:hidden">
        <button onClick={() => setActiveTab('dashboard')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-300'}`}>
          <HomeIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">الرئيسية</span>
        </button>
        <button onClick={() => setActiveTab('cashier')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'cashier' ? 'text-blue-600' : 'text-slate-300'}`}>
          <ShoppingBagIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">الفواتير</span>
        </button>
        <button onClick={() => setActiveTab('warehouse')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'warehouse' ? 'text-blue-600' : 'text-slate-300'}`}>
          <CubeIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">المخزن</span>
        </button>
        <button onClick={() => setActiveTab('inventory_report')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'inventory_report' ? 'text-blue-600' : 'text-slate-300'}`}>
          <BeakerIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">ذكاء المخزن</span>
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-300'}`}>
          <ListBulletIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">القيود</span>
        </button>
        <button onClick={() => setActiveTab('parties')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'parties' ? 'text-blue-600' : 'text-slate-300'}`}>
          <IdentificationIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">الأطراف</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-shrink-0 px-4 flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-300'}`}>
          <Cog6ToothIcon className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[8px] font-black uppercase tracking-wider">الإعدادات</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
