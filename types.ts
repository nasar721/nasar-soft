
export type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
}

export interface Party {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  phone: string;
  address?: string;
  initialBalance: number;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  taxNumber: string;
  logo?: string; // base64 string
  footerNote?: string;
  termsAndConditions?: string;
  primaryColor: string; // Hex color code
  showLogo: boolean;
  showTaxNumber: boolean;
  showAddress: boolean;
  defaultTaxRate: number; // Percentage, e.g., 14
}

export interface JournalHeader {
  id: string;
  date: string;
  description: string;
  txType: string;
  partyId?: string;
  invoiceId?: string; 
}

export interface JournalLine {
  id: string;
  headerId: string;
  accountId: string;
  debit: number;
  credit: number;
  note?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  category: string;
  taxable?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  status: 'active' | 'on_leave';
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  type: 'SALE' | 'SUPPLY';
  date: string;
  partyId?: string;
  partyName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalTax: number;
  totalDiscount: number;
  total: number;
  paidAmount: number; // المبلغ المدفوع
  balanceAmount: number; // المبلغ المتبقي (الدين)
  paymentMethod: string;
  notes?: string;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  assets: { name: string; balance: number }[];
  liabilities: { name: string; balance: number }[];
  equity: { name: string; balance: number }[];
}

export type Category = string;

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export type PaymentMethod = string;

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  method: string;
  type: TransactionType;
}
