export type Category =
  | 'Food & Drinks'
  | 'Transport'
  | 'Shopping'
  | 'Health'
  | 'Entertainment'
  | 'Services'
  | 'Groceries'
  | 'Travel'
  | 'Education'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food & Drinks',
  'Groceries',
  'Transport',
  'Shopping',
  'Health',
  'Entertainment',
  'Services',
  'Travel',
  'Education',
  'Other',
];

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  merchant?: string;
  date: string; // ISO string
  timestamp: number; // ms epoch
}

export interface Budget {
  category: Category;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO string
  createdAt: string;
}

export interface Insight {
  id: string;
  type:
    | 'budget_threshold'
    | 'pace_alert'
    | 'trend'
    | 'behavioral'
    | 'anomaly'
    | 'savings_opportunity'
    | 'goal_aware'
    | 'compound';
  severity: 'info' | 'warning' | 'danger' | 'positive';
  title: string;
  message: string;
  category?: Category;
  generatedAt: number;
}
