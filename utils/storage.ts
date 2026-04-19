import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, SavingsGoal } from '@/types';

const KEYS = {
  EXPENSES: '@spendwise_expenses',
  BUDGETS: '@spendwise_budgets',
  GOALS: '@spendwise_goals',
  ONBOARDED: '@spendwise_onboarded',
  USER_NAME: '@spendwise_user_name',
  CURRENCY: '@spendwise_currency',
};

export async function isOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function setOnboarded(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, String(value));
}

export async function loadUserName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.USER_NAME)) ?? '';
}

export async function saveUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
}

export async function loadCurrency(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.CURRENCY)) ?? '$';
}

export async function saveCurrency(symbol: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.CURRENCY, symbol);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.EXPENSES, KEYS.BUDGETS, KEYS.GOALS,
    KEYS.ONBOARDED, KEYS.USER_NAME, KEYS.CURRENCY,
  ]);
}

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
