
export enum Category {
  MORNING_KINGDOM = 'MORNING_KINGDOM',
  STUDENT_PAYMENT = 'STUDENT_PAYMENT',
  INVOICE_REIMBURSEMENT = 'INVOICE_REIMBURSEMENT',
  OTHER_ADJUSTMENT = 'OTHER_ADJUSTMENT',
}

export interface Transaction {
  id: string;
  date: string; // ISO string format
  category: Category;
  description: string;
  amount: number; // Always positive
  type: 'income' | 'expense';
  reimbursed: boolean;
}
