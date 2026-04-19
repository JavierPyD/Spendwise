import { Expense, Category } from '@/types';

export interface DailyPoint {
  day: string;       // "Mon 14"
  value: number;
  timestamp: number;
}

export interface CategorySlice {
  category: Category;
  value: number;
  color: string;
  percentage: number;
}

export interface MonthBar {
  month: string;   // "Jan", "Feb" …
  value: number;
}

export interface CorrelationPoint {
  x: number;   // day of month
  y: number;   // cumulative spend
  label: string;
}

// Consistent category colours
export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drinks':  '#FF6B6B',
  'Groceries':      '#4ECDC4',
  'Transport':      '#45B7D1',
  'Shopping':       '#96CEB4',
  'Health':         '#FFEAA7',
  'Entertainment':  '#DDA0DD',
  'Services':       '#98D8C8',
  'Travel':         '#F7DC6F',
  'Education':      '#82E0AA',
  'Other':          '#AEB6BF',
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last N days daily totals */
export function buildDailyTrend(expenses: Expense[], days = 30): DailyPoint[] {
  const now = new Date();
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const total = expenses
      .filter((e) => e.timestamp >= d.getTime() && e.timestamp < next.getTime())
      .reduce((s, e) => s + e.amount, 0);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    points.push({ day: label, value: total, timestamp: d.getTime() });
  }
  return points;
}

/** Category breakdown for a given month */
export function buildCategoryPie(expenses: Expense[], date: Date): CategorySlice[] {
  const start = startOfMonth(date);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  const monthExp = expenses.filter((e) => e.timestamp >= start.getTime() && e.timestamp <= end.getTime());
  const total = monthExp.reduce((s, e) => s + e.amount, 0);
  if (total === 0) return [];

  const map: Partial<Record<Category, number>> = {};
  for (const e of monthExp) {
    map[e.category] = (map[e.category] ?? 0) + e.amount;
  }
  return Object.entries(map)
    .map(([cat, val]) => ({
      category: cat as Category,
      value: val as number,
      color: CATEGORY_COLORS[cat] ?? '#AEB6BF',
      percentage: Math.round(((val as number) / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/** Last 6 months totals for bar chart */
export function buildMonthlyBars(expenses: Expense[]): MonthBar[] {
  const now = new Date();
  const bars: MonthBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const total = expenses
      .filter((e) => e.timestamp >= d.getTime() && e.timestamp <= end.getTime())
      .reduce((s, e) => s + e.amount, 0);
    bars.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      value: Math.round(total),
    });
  }
  return bars;
}

/** Cumulative spend curve for current month (actual vs projected) */
export function buildCumulativeCurve(expenses: Expense[]): {
  actual: CorrelationPoint[];
  projected: CorrelationPoint[];
} {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const start = startOfMonth(now);
  const monthExp = expenses.filter(
    (e) => e.timestamp >= start.getTime() && e.timestamp <= now.getTime()
  );

  // Build actual cumulative
  const actual: CorrelationPoint[] = [];
  let running = 0;
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    const next = new Date(now.getFullYear(), now.getMonth(), day + 1);
    const dayTotal = monthExp
      .filter((e) => e.timestamp >= d.getTime() && e.timestamp < next.getTime())
      .reduce((s, e) => s + e.amount, 0);
    running += dayTotal;
    actual.push({ x: day, y: Math.round(running), label: `Day ${day}` });
  }

  // Project forward based on daily burn rate
  const burnRate = now.getDate() > 0 ? running / now.getDate() : 0;
  const projected: CorrelationPoint[] = [...actual];
  let projRunning = running;
  for (let day = now.getDate() + 1; day <= totalDays; day++) {
    projRunning += burnRate;
    projected.push({ x: day, y: Math.round(projRunning), label: `Day ${day}` });
  }

  return { actual, projected };
}

/** Category spend correlation: two categories over last 6 months */
export function buildCategoryCorrelation(
  expenses: Expense[],
  catA: Category,
  catB: Category
): { month: string; a: number; b: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthExp = expenses.filter(
      (e) => e.timestamp >= d.getTime() && e.timestamp <= end.getTime()
    );
    result.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      a: Math.round(monthExp.filter((e) => e.category === catA).reduce((s, e) => s + e.amount, 0)),
      b: Math.round(monthExp.filter((e) => e.category === catB).reduce((s, e) => s + e.amount, 0)),
    });
  }
  return result;
}
