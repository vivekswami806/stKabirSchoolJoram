
export interface FeeBreakdownItem {
    item: string;
    amount: number;
  }
  
  export interface DueFee {
    id: number;
    month: string;
    amount: number;
    dueDate: string | null;
    isPaid: boolean;
    breakdown: FeeBreakdownItem[];
  }
  
  export interface PaidFee {
    id: number;
    month: string;
    amount: number;
    paidDate: string;
    transactionId: string;
    paymentMethod: string;
    breakdown: FeeBreakdownItem[];
  }
  
  export interface Transaction {
    id: string;
    date: string;
    time: string;
    amount: number;
    status: 'Success' | 'Failed';
    method: string;
    feeMonth: string;
  }
  
  export interface MonthlyBreakdown {
    month: string;
    amount: number;
    status: 'Paid' | 'Due';
  }
  
  export interface Summary {
    totalFees: number;
    totalPaid: number;
    totalDue: number;
    monthlyBreakdown: MonthlyBreakdown[];
  }
  
  export interface FeeData {
    dues: DueFee[];
    paid: PaidFee[];
    transactions: Transaction[];
    summary: Summary;
  }
  
  export interface PaymentResponse {
    success: boolean;
    message: string;
    transactionId: string;
  }
  
  export interface ReceiptResponse {
    success: boolean;
    url: string;
  }