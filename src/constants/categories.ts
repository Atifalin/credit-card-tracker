export const EXPENSE_CATEGORIES = [
  { id: 'food_dining', label: 'Food & Dining', icon: 'food' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping' },
  { id: 'transportation', label: 'Transportation', icon: 'car' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'utilities', label: 'Utilities', icon: 'lightning-bolt' },
  { id: 'health', label: 'Health', icon: 'medical-bag' },
  { id: 'groceries', label: 'Groceries', icon: 'cart' },
  { id: 'travel', label: 'Travel', icon: 'airplane' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'bills', label: 'Bills', icon: 'file-document' },
  { id: 'rent', label: 'Rent', icon: 'home' },
  { id: 'investment', label: 'Investment', icon: 'chart-line' },
  { id: 'gifts', label: 'Gifts', icon: 'gift' },
  { id: 'personal_care', label: 'Personal Care', icon: 'face-man' },
  { id: 'expense_other', label: 'Other', icon: 'dots-horizontal' },
];

export const PAYMENT_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: 'cash' },
  { id: 'refund', label: 'Refund', icon: 'cash-refund' },
  { id: 'investment_return', label: 'Investment Return', icon: 'chart-line' },
  { id: 'gift', label: 'Gift', icon: 'gift' },
  { id: 'payment_other', label: 'Other', icon: 'dots-horizontal' },
];

export interface Category {
  id: string;
  label: string;
  icon: string;
}
