import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Expense, Budget, SavingsGoal } from '@/types';
import * as Storage from '@/utils/storage';

interface AppContextType {
  expenses: Expense[];
  budgets: Budget[];
  goals: SavingsGoal[];
  addExpense: (e: Omit<Expense, 'id' | 'timestamp'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudget: (budget: Budget) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([Storage.loadExpenses(), Storage.loadBudgets(), Storage.loadGoals()]).then(
      ([e, b, g]) => {
        setExpenses(e);
        setBudgets(b);
        setGoals(g);
        setIsLoading(false);
      }
    );
  }, []);

  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...data,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      Storage.saveExpenses(updated);
      return updated;
    });
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      Storage.saveExpenses(updated);
      return updated;
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      Storage.saveExpenses(updated);
      return updated;
    });
  }, []);

  const setBudget = useCallback(async (budget: Budget) => {
    setBudgets((prev) => {
      const exists = prev.find((b) => b.category === budget.category);
      const updated = exists
        ? prev.map((b) => (b.category === budget.category ? budget : b))
        : [...prev, budget];
      Storage.saveBudgets(updated);
      return updated;
    });
  }, []);

  const removeBudget = useCallback(async (category: string) => {
    setBudgets((prev) => {
      const updated = prev.filter((b) => b.category !== category);
      Storage.saveBudgets(updated);
      return updated;
    });
  }, []);

  const addGoal = useCallback(async (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => {
      const updated = [...prev, newGoal];
      Storage.saveGoals(updated);
      return updated;
    });
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      Storage.saveGoals(updated);
      return updated;
    });
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      Storage.saveGoals(updated);
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        expenses,
        budgets,
        goals,
        addExpense,
        updateExpense,
        deleteExpense,
        setBudget,
        removeBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
