// utils/feeReceipts.ts

interface Installment {
    id: number;
    monthLabel: string;
    dueDate: string;
    dueAmount: number;
    paidAmount: number;
    balance: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING' | 'UPCOMING';
    visible: boolean;
  }
interface FeeCategory {
    assignmentId: number;
    categoryName: string;
    billingType: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING';
    totalDue: number;
    totalPaid: number;
    balance: number;
    installments: Installment[];
  }
export interface MonthlyReceiptItem {
  categoryName: string;
  monthLabel: string;
  dueAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
}

export interface MonthlyReceipt {
  monthKey: string;     // "2026-06"
  monthDisplay: string; // "June 2026"
  items: MonthlyReceiptItem[];
  totalPaid: number;
}

const formatMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export const getMonthlyReceipts = (categories: FeeCategory[]): MonthlyReceipt[] => {
  const monthMap: Record<string, MonthlyReceiptItem[]> = {};

  categories.forEach(cat => {
    cat.installments.forEach(inst => {
      const monthKey = inst.dueDate.slice(0, 7); // "YYYY-MM"
      if (!monthMap[monthKey]) monthMap[monthKey] = [];
      monthMap[monthKey].push({
        categoryName: cat.categoryName,
        monthLabel: inst.monthLabel,
        dueAmount: inst.dueAmount,
        paidAmount: inst.paidAmount,
        dueDate: inst.dueDate,
        status: inst.status,
      });
    });
  });

  const receipts: MonthlyReceipt[] = [];

  Object.entries(monthMap).forEach(([monthKey, items]) => {
    const allPaid = items.length > 0 && items.every(i => i.status === 'PAID');
    if (allPaid) {
      receipts.push({
        monthKey,
        monthDisplay: formatMonthKey(monthKey),
        items,
        totalPaid: items.reduce((s, i) => s + i.paidAmount, 0),
      });
    }
  });

  return receipts.sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // latest first
};