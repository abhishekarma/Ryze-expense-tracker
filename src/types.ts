export type ExpenseStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Paid / Reimbursed';

export type ApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Clarification Required';

export type PaymentMode =
  | 'Cash'
  | 'Personal Credit Card'
  | 'Personal UPI'
  | 'Company Credit Card'
  | 'Company UPI'
  | 'Bank Transfer'
  | 'Advance Received'
  | 'Other';

export interface Expense {
  id: string; // e.g. EXP-2026-00001
  expenseDate: string; // YYYY-MM-DD
  submissionDate: string; // YYYY-MM-DD
  submissionTime: string; // HH:MM:SS
  employeeName: string;
  employeeEmail: string;
  department: string;
  expenseCategory: string;
  vendor: string;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  billAvailable: boolean; // Yes or No
  reasonForNoBill?: string;
  driveFileName?: string;
  driveFileUrl?: string;
  driveFolder?: string;
  receiptBase64?: string;
  receiptMimeType?: string;
  receiptOriginalName?: string;
  status: ExpenseStatus;
  approvalStatus: ApprovalStatus;
  approverName?: string;
  approvalDate?: string;
  approverComments?: string;
  submittedBy: string;
  lastUpdated: string;
  invoiceNumber?: string;
  gstNumber?: string;
}

export interface ExtractedReceiptData {
  vendor?: string;
  date?: string;
  amount?: number;
  invoiceNumber?: string;
  gstNumber?: string;
  suggestedCategory?: string;
  suggestedDescription?: string;
  rawText?: string;
  confidence?: number;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Employee' | 'Manager' | 'Admin';
  managerName?: string;
  avatarUrl?: string;
}

export interface AppConfig {
  categories: string[];
  departments: string[];
  paymentModes: PaymentMode[];
  googleSheetName: string;
  googleDriveRootFolder: string;
  googleAppsScriptUrl: string;
  lastSyncedAt?: string;
}

export interface MonthlyStats {
  monthName: string;
  year: number;
  totalExpense: number;
  submittedExpense: number;
  approvedExpense: number;
  pendingApprovalExpense: number;
  missingBillsCount: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
}
