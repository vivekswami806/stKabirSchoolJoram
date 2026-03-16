export interface ApiConfig {
    USE_DUMMY_DATA: boolean;
    BASE_URL: string;
    ENDPOINTS: {
      GET_FEES: string;
      PAY_FEES: string;
      DOWNLOAD_RECEIPT: string;
    };
    TIMEOUT: number;
  }
  
  export const API_CONFIG: ApiConfig = {
    USE_DUMMY_DATA: true,
    BASE_URL: 'https://your-api.com/api',
    ENDPOINTS: {
      GET_FEES: '/fees/all',
      PAY_FEES: '/fees/pay',
      DOWNLOAD_RECEIPT: '/fees/receipt',
    },
    TIMEOUT: 30000,
  };
  export const getAuthHeaders = (token: string | null): Record<string, string> => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

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

  export const DUMMY_FEE_DATA: FeeData = {
    dues: [
      {
        id: 3,
        month: 'July',
        amount: 1155,
        dueDate: '30-Jul-2023',
        isPaid: false,
        breakdown: []
      },
      {
        id: 4,
        month: 'August',
        amount: 1155,
        dueDate: '30-Aug-2023',
        isPaid: false,
        breakdown: []
      }
    ],
    paid: [
      {
        id: 1,
        month: 'April',
        amount: 3000,
        paidDate: '28-Apr-2023',
        transactionId: 'TXN001234567',
        paymentMethod: 'UPI',
        breakdown: []
      },
      {
        id: 2,
        month: 'May',
        amount: 6120,
        paidDate: '29-May-2023',
        transactionId: 'TXN001234568',
        paymentMethod: 'Credit Card',
        breakdown: [
          { item: 'Uniform', amount: 4935 },
          { item: 'PT Shoes', amount: 605 },
          { item: 'Regular Shoes', amount: 580 }
        ]
      }
    ],
    transactions: [
      {
        id: 'TXN001234568',
        date: '29-May-2023',
        time: '02:45 PM',
        amount: 6120,
        status: 'Success',
        method: 'Credit Card',
        feeMonth: 'May'
      },
      {
        id: 'TXN001234567',
        date: '28-Apr-2023',
        time: '11:20 AM',
        amount: 3000,
        status: 'Success',
        method: 'UPI',
        feeMonth: 'April'
      },
      {
        id: 'TXN001234566',
        date: '25-Mar-2023',
        time: '03:15 PM',
        amount: 2500,
        status: 'Failed',
        method: 'Net Banking',
        feeMonth: 'March'
      }
    ],
    summary: {
      totalFees: 11430,
      totalPaid: 9120,
      totalDue: 2310,
      monthlyBreakdown: [
        { month: 'April', amount: 3000, status: 'Paid' },
        { month: 'May', amount: 6120, status: 'Paid' },
        { month: 'July', amount: 1155, status: 'Due' },
        { month: 'August', amount: 1155, status: 'Due' }
      ]
    }
  };
  