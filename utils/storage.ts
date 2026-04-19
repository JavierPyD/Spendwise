import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, SavingsGoal } from '@/types';

const KEYS = {
  EXPENSES: '@spendwise_expenses',
  BUDGETS: '@spendwise_budgets',
  GOALS: '@spendwise_goals',
};

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.EXPENSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
}

export async function loadBudgets(): Promise<Budget[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BUDGETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBudgets(budgets: Budget[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
}

export async function loadGoals(): Promise<SavingsGoal[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GOALS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveGoals(goals: SavingsGoal[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
}
