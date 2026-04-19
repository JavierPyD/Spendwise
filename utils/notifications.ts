import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Expense, Budget } from '@/types';
import { generateInsights } from './insightsEngine';

// ─── Setup ───────────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Scheduled Notifications ─────────────────────────────────────────────────

const IDENTIFIERS = {
  DAILY_REMINDER: 'daily-log-reminder',
  WEEKLY_SUMMARY: 'weekly-summary',
};

/** Schedule a daily reminder to log expenses at a given hour (24h format) */
export async function scheduleDailyReminder(hour: number = 20): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIERS.DAILY_REMINDER).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIERS.DAILY_REMINDER,
    content: {
      title: '💰 SpendWise Reminder',
      body: "Don't forget to log today's expenses!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

/** Schedule a weekly summary every Sunday at 9am */
export async function scheduleWeeklySummary(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIERS.WEEKLY_SUMMARY).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIERS.WEEKLY_SUMMARY,
    content: {
      title: '📊 Weekly Spend Summary',
      body: 'Your weekly spending report is ready. Tap to review.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 9,
      minute: 0,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIERS.DAILY_REMINDER).catch(() => {});
}

export async function cancelWeeklySummary(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIERS.WEEKLY_SUMMARY).catch(() => {});
}

// ─── Immediate Alerts ────────────────────────────────────────────────────────

/** Fire an immediate local notification for budget/anomaly alerts */
export async function sendInsightAlerts(
  expenses: Expense[],
  budgets: Budget[],
  goals: never[]
): Promise<void> {
  const insights = generateInsights(expenses, budgets, goals);
  const urgent = insights.filter((i) => i.severity === 'danger');

  for (const insight of urgent.slice(0, 3)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ${insight.title}`,
        body: insight.message,
        sound: true,
      },
      trigger: null, // immediate
    });
  }
}

/** Fire a budget warning notification */
export async function sendBudgetWarning(
  category: string,
  spent: number,
  limit: number
): Promise<void> {
  const pct = Math.round((spent / limit) * 100);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ ${category} Budget at ${pct}%`,
      body: `You've spent $${spent.toFixed(0)} of your $${limit} ${category} budget.`,
      sound: true,
    },
    trigger: null,
  });
}
