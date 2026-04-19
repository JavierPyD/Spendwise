import { Expense, Budget, SavingsGoal, Insight, Category } from '@/types';

// ─── Date helpers ────────────────────────────────────────────────────────────

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfLastMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function endOfLastMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfLastWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() - 7);
  return d;
}

function endOfLastWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() - 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function dayOfMonth(date: Date): number {
  return date.getDate();
}

function filterByRange(expenses: Expense[], from: Date, to: Date): Expense[] {
  return expenses.filter((e) => e.timestamp >= from.getTime() && e.timestamp <= to.getTime());
}

function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

function byCategory(expenses: Expense[], category: Category): Expense[] {
  return expenses.filter((e) => e.category === category);
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function generateInsights(
  expenses: Expense[],
  budgets: Budget[],
  goals: SavingsGoal[]
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfLastMonth(now);
  const lastMonthEnd = endOfLastMonth(now);
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = startOfLastWeek(now);
  const lastWeekEnd = endOfLastWeek(now);

  const thisMonthExpenses = filterByRange(expenses, thisMonthStart, now);
  const lastMonthExpenses = filterByRange(expenses, lastMonthStart, lastMonthEnd);
  const thisWeekExpenses = filterByRange(expenses, thisWeekStart, now);
  const lastWeekExpenses = filterByRange(expenses, lastWeekStart, lastWeekEnd);

  const totalDays = daysInMonth(now);
  const elapsedDays = dayOfMonth(now);
  const remainingDays = totalDays - elapsedDays;
  const thisMonthTotal = sumAmount(thisMonthExpenses);
  const dailyBurnRate = elapsedDays > 0 ? thisMonthTotal / elapsedDays : 0;
  const projectedMonthTotal = dailyBurnRate * totalDays;

  // ── 1. Budget Threshold Rules ─────────────────────────────────────────────

  for (const budget of budgets) {
    const catExpenses = byCategory(thisMonthExpenses, budget.category);
    const spent = sumAmount(catExpenses);
    const pct = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
    const catBurnRate = elapsedDays > 0 ? spent / elapsedDays : 0;
    const projectedCatSpend = catBurnRate * totalDays;

    if (pct >= 1) {
      insights.push({
        id: uid(),
        type: 'budget_threshold',
        severity: 'danger',
        title: `${budget.category} budget exceeded`,
        message: `You've spent $${spent.toFixed(0)} of your $${budget.monthlyLimit} ${budget.category} budget (${Math.round(pct * 100)}%).`,
        category: budget.category,
        generatedAt: Date.now(),
      });
    } else if (pct >= 0.8) {
      insights.push({
        id: uid(),
        type: 'budget_threshold',
        severity: 'warning',
        title: `${budget.category} budget at ${Math.round(pct * 100)}%`,
        message: `$${(budget.monthlyLimit - spent).toFixed(0)} left with ${remainingDays} days to go.`,
        category: budget.category,
        generatedAt: Date.now(),
      });
    }

    // Pace alert
    if (projectedCatSpend > budget.monthlyLimit && pct < 1) {
      insights.push({
        id: uid(),
        type: 'pace_alert',
        severity: 'warning',
        title: `${budget.category} on track to overspend`,
        message: `At your current pace you'll spend $${projectedCatSpend.toFixed(0)} vs your $${budget.monthlyLimit} budget.`,
        category: budget.category,
        generatedAt: Date.now(),
      });
    } else if (pct < 0.8 && elapsedDays > 5) {
      insights.push({
        id: uid(),
        type: 'pace_alert',
        severity: 'info',
        title: `${budget.category} on track`,
        message: `You're on track to spend $${projectedCatSpend.toFixed(0)} this month — within your $${budget.monthlyLimit} budget.`,
        category: budget.category,
        generatedAt: Date.now(),
      });
    }
  }

  // ── 2. Trend / Comparative Rules ─────────────────────────────────────────

  // MoM per category
  const allCategories = [...new Set(expenses.map((e) => e.category))];
  for (const cat of allCategories) {
    const thisMonthCat = sumAmount(byCategory(thisMonthExpenses, cat));
    const lastMonthCat = sumAmount(byCategory(lastMonthExpenses, cat));
    if (lastMonthCat > 0 && elapsedDays >= 7) {
      // Normalise this month to full month for fair comparison
      const projectedThisCat = (thisMonthCat / elapsedDays) * totalDays;
      const change = (projectedThisCat - lastMonthCat) / lastMonthCat;
      if (change >= 0.4) {
        insights.push({
          id: uid(),
          type: 'trend',
          severity: 'warning',
          title: `${cat} spending up ${Math.round(change * 100)}% MoM`,
          message: `Projected $${projectedThisCat.toFixed(0)} vs $${lastMonthCat.toFixed(0)} last month.`,
          category: cat,
          generatedAt: Date.now(),
        });
      } else if (change <= -0.25) {
        insights.push({
          id: uid(),
          type: 'trend',
          severity: 'positive',
          title: `${cat} spending down ${Math.round(Math.abs(change) * 100)}% MoM`,
          message: `Great job — you're projected to spend $${projectedThisCat.toFixed(0)} vs $${lastMonthCat.toFixed(0)} last month.`,
          category: cat,
          generatedAt: Date.now(),
        });
      }
    }
  }

  // WoW change
  const thisWeekTotal = sumAmount(thisWeekExpenses);
  const lastWeekTotal = sumAmount(lastWeekExpenses);
  if (lastWeekTotal > 0) {
    const wowChange = (thisWeekTotal - lastWeekTotal) / lastWeekTotal;
    if (wowChange >= 0.5) {
      insights.push({
        id: uid(),
        type: 'trend',
        severity: 'warning',
        title: `Spending up ${Math.round(wowChange * 100)}% this week`,
        message: `$${thisWeekTotal.toFixed(0)} this week vs $${lastWeekTotal.toFixed(0)} last week.`,
        generatedAt: Date.now(),
      });
    }
  }

  // Unusually high week — spend > 1.5× rolling 4-week average
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const rollingExpenses = filterByRange(expenses, fourWeeksAgo, now);
  const rollingWeeklyAvg = sumAmount(rollingExpenses) / 4;
  if (rollingWeeklyAvg > 0 && thisWeekTotal > rollingWeeklyAvg * 1.5) {
    insights.push({
      id: uid(),
      type: 'trend',
      severity: 'warning',
      title: 'Unusually high week',
      message: `This week's $${thisWeekTotal.toFixed(0)} is ${Math.round((thisWeekTotal / rollingWeeklyAvg - 1) * 100)}% above your 4-week average of $${rollingWeeklyAvg.toFixed(0)}.`,
      generatedAt: Date.now(),
    });
  }

  // ── 3. Behavioral Pattern Rules ───────────────────────────────────────────

  // Biggest spend day of week
  if (thisMonthExpenses.length >= 5) {
    const dayTotals: Record<number, number> = {};
    for (const e of thisMonthExpenses) {
      const day = new Date(e.timestamp).getDay();
      dayTotals[day] = (dayTotals[day] ?? 0) + e.amount;
    }
    const topDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (topDay) {
      insights.push({
        id: uid(),
        type: 'behavioral',
        severity: 'info',
        title: `${dayNames[Number(topDay[0])]} is your biggest spend day`,
        message: `You've spent $${Number(topDay[1]).toFixed(0)} on ${dayNames[Number(topDay[0])]}s this month.`,
        generatedAt: Date.now(),
      });
    }
  }

  // Biggest spend time of day
  if (thisMonthExpenses.length >= 5) {
    const hourBuckets: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const e of thisMonthExpenses) {
      const h = new Date(e.timestamp).getHours();
      if (h >= 6 && h < 12) hourBuckets.morning += e.amount;
      else if (h >= 12 && h < 17) hourBuckets.afternoon += e.amount;
      else if (h >= 17 && h < 21) hourBuckets.evening += e.amount;
      else hourBuckets.night += e.amount;
    }
    const topBucket = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
    if (topBucket && topBucket[1] > 0) {
      insights.push({
        id: uid(),
        type: 'behavioral',
        severity: 'info',
        title: `Most spending happens in the ${topBucket[0]}`,
        message: `$${topBucket[1].toFixed(0)} spent during ${topBucket[0]} hours this month.`,
        generatedAt: Date.now(),
      });
    }
  }

  // Merchant frequency
  const merchantCounts: Record<string, number> = {};
  for (const e of thisMonthExpenses) {
    if (e.merchant) {
      merchantCounts[e.merchant] = (merchantCounts[e.merchant] ?? 0) + 1;
    }
  }
  const topMerchant = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0];
  if (topMerchant && topMerchant[1] >= 4) {
    insights.push({
      id: uid(),
      type: 'behavioral',
      severity: 'info',
      title: `You've visited ${topMerchant[0]} ${topMerchant[1]}× this month`,
      message: `That's your most frequent merchant this month.`,
      generatedAt: Date.now(),
    });
  }

  // Weekend vs weekday ratio
  if (thisMonthExpenses.length >= 5) {
    const weekendSpend = thisMonthExpenses
      .filter((e) => [0, 6].includes(new Date(e.timestamp).getDay()))
      .reduce((s, e) => s + e.amount, 0);
    const weekdaySpend = thisMonthTotal - weekendSpend;
    const weekendDays = thisMonthExpenses.filter((e) =>
      [0, 6].includes(new Date(e.timestamp).getDay())
    ).length;
    const weekdayDays = thisMonthExpenses.length - weekendDays;
    const weekendAvg = weekendDays > 0 ? weekendSpend / weekendDays : 0;
    const weekdayAvg = weekdayDays > 0 ? weekdaySpend / weekdayDays : 0;
    if (weekendAvg > weekdayAvg * 1.5 && weekendDays >= 2) {
      insights.push({
        id: uid(),
        type: 'behavioral',
        severity: 'info',
        title: 'Weekend spending is higher',
        message: `You spend $${weekendAvg.toFixed(0)}/day on weekends vs $${weekdayAvg.toFixed(0)}/day on weekdays.`,
        generatedAt: Date.now(),
      });
    }
  }

  // ── 4. Anomaly / Outlier Detection ────────────────────────────────────────

  // Single transaction > 30% of monthly category budget
  for (const budget of budgets) {
    const catExpenses = byCategory(thisMonthExpenses, budget.category);
    for (const e of catExpenses) {
      if (e.amount > budget.monthlyLimit * 0.3) {
        insights.push({
          id: uid(),
          type: 'anomaly',
          severity: 'warning',
          title: `Large ${budget.category} transaction`,
          message: `"${e.description}" ($${e.amount.toFixed(2)}) is ${Math.round((e.amount / budget.monthlyLimit) * 100)}% of your monthly ${budget.category} budget.`,
          category: budget.category,
          generatedAt: Date.now(),
        });
      }
    }
  }

  // Duplicate-looking charges (same merchant/description, same amount, ±2 days)
  for (let i = 0; i < thisMonthExpenses.length; i++) {
    for (let j = i + 1; j < thisMonthExpenses.length; j++) {
      const a = thisMonthExpenses[i];
      const b = thisMonthExpenses[j];
      const sameAmount = Math.abs(a.amount - b.amount) < 0.01;
      const sameDesc = a.description.toLowerCase() === b.description.toLowerCase();
      const daysDiff = Math.abs(a.timestamp - b.timestamp) / (1000 * 60 * 60 * 24);
      if (sameAmount && sameDesc && daysDiff <= 2) {
        insights.push({
          id: uid(),
          type: 'anomaly',
          severity: 'warning',
          title: 'Possible duplicate charge',
          message: `"${a.description}" for $${a.amount.toFixed(2)} appears twice within 2 days.`,
          generatedAt: Date.now(),
        });
        break;
      }
    }
  }

  // Dormant category suddenly spikes
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const twoMonthsAgoEnd = new Date(lastMonthStart);
  twoMonthsAgoEnd.setDate(0);
  for (const cat of allCategories) {
    const recentPast = filterByRange(expenses, twoMonthsAgo, lastMonthEnd);
    const pastCatTotal = sumAmount(byCategory(recentPast, cat));
    const thisCatTotal = sumAmount(byCategory(thisMonthExpenses, cat));
    if (pastCatTotal === 0 && thisCatTotal > 20) {
      insights.push({
        id: uid(),
        type: 'anomaly',
        severity: 'info',
        title: `New spending in ${cat}`,
        message: `You haven't spent in ${cat} recently, but logged $${thisCatTotal.toFixed(0)} this month.`,
        category: cat,
        generatedAt: Date.now(),
      });
    }
  }

  // ── 5. Savings Opportunity Rules ──────────────────────────────────────────

  // Recurring charges detection (same amount ±$0.50, same category, appears 2+ consecutive months)
  const recurringCandidates: Record<string, number[]> = {};
  for (const e of expenses) {
    const key = `${e.description.toLowerCase()}_${Math.round(e.amount)}`;
    if (!recurringCandidates[key]) recurringCandidates[key] = [];
    recurringCandidates[key].push(new Date(e.timestamp).getMonth());
  }
  for (const [key, months] of Object.entries(recurringCandidates)) {
    const uniqueMonths = [...new Set(months)];
    if (uniqueMonths.length >= 2) {
      const desc = key.split('_')[0];
      const amount = Number(key.split('_')[1]);
      insights.push({
        id: uid(),
        type: 'savings_opportunity',
        severity: 'info',
        title: `Recurring charge detected: ${desc}`,
        message: `~$${amount}/month. Review if this subscription is still needed.`,
        generatedAt: Date.now(),
      });
    }
  }

  // Food delivery savings opportunity
  const deliveryKeywords = ['uber eats', 'doordash', 'grubhub', 'delivery', 'postmates', 'instacart'];
  const deliverySpend = thisMonthExpenses
    .filter((e) =>
      deliveryKeywords.some(
        (k) =>
          e.description.toLowerCase().includes(k) ||
          (e.merchant ?? '').toLowerCase().includes(k)
      )
    )
    .reduce((s, e) => s + e.amount, 0);
  if (deliverySpend > 50) {
    const estimatedSavings = deliverySpend * 0.6;
    insights.push({
      id: uid(),
      type: 'savings_opportunity',
      severity: 'info',
      title: 'Food delivery spending',
      message: `You spent $${deliverySpend.toFixed(0)} on food delivery this month. Cooking at home could save ~$${estimatedSavings.toFixed(0)}.`,
      generatedAt: Date.now(),
    });
  }

  // Category creep — gradual MoM drift in discretionary spend
  const discretionary: Category[] = ['Entertainment', 'Shopping', 'Food & Drinks'];
  for (const cat of discretionary) {
    const thisMonthCat = sumAmount(byCategory(thisMonthExpenses, cat));
    const lastMonthCat = sumAmount(byCategory(lastMonthExpenses, cat));
    if (lastMonthCat > 0) {
      const drift = (thisMonthCat - lastMonthCat) / lastMonthCat;
      if (drift > 0.15 && drift < 0.4) {
        insights.push({
          id: uid(),
          type: 'savings_opportunity',
          severity: 'info',
          title: `${cat} creeping up`,
          message: `${cat} is up ${Math.round(drift * 100)}% vs last month — small increases add up over time.`,
          category: cat,
          generatedAt: Date.now(),
        });
      }
    }
  }

  // ── 6. Goal-Aware Rules ───────────────────────────────────────────────────

  for (const goal of goals) {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) {
      insights.push({
        id: uid(),
        type: 'goal_aware',
        severity: 'positive',
        title: `Goal reached: ${goal.name}`,
        message: `You've hit your $${goal.targetAmount} goal. Amazing work!`,
        generatedAt: Date.now(),
      });
      continue;
    }

    if (goal.targetDate) {
      const daysLeft = Math.ceil(
        (new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const monthsLeft = daysLeft / 30;
      const neededPerMonth = monthsLeft > 0 ? remaining / monthsLeft : remaining;
      const lastMonthSavings = Math.max(
        0,
        sumAmount(lastMonthExpenses) > 0
          ? 0
          : 0
      );
      if (daysLeft > 0) {
        insights.push({
          id: uid(),
          type: 'goal_aware',
          severity: daysLeft < 30 ? 'warning' : 'info',
          title: `Goal: ${goal.name}`,
          message: `$${remaining.toFixed(0)} to go. You need ~$${neededPerMonth.toFixed(0)}/month to hit your target in ${Math.round(monthsLeft)} months.`,
          generatedAt: Date.now(),
        });
      }
    }
  }

  // ── 7. Compound Rules ─────────────────────────────────────────────────────

  // Budget pressure increases as month-end nears
  for (const budget of budgets) {
    const spent = sumAmount(byCategory(thisMonthExpenses, budget.category));
    const pct = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
    const monthProgress = elapsedDays / totalDays;
    if (pct > monthProgress + 0.2 && remainingDays <= 10) {
      insights.push({
        id: uid(),
        type: 'compound',
        severity: 'danger',
        title: `${budget.category} budget pressure — ${remainingDays} days left`,
        message: `You've used ${Math.round(pct * 100)}% of your budget but only ${Math.round(monthProgress * 100)}% of the month has passed. Slow down!`,
        category: budget.category,
        generatedAt: Date.now(),
      });
    }
  }

  // Counterbalance: overspend in one category offset by underspend in another
  const overCategories: string[] = [];
  const underCategories: string[] = [];
  for (const budget of budgets) {
    const spent = sumAmount(byCategory(thisMonthExpenses, budget.category));
    const pct = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
    if (pct > 1.1) overCategories.push(budget.category);
    if (pct < 0.6 && elapsedDays > 15) underCategories.push(budget.category);
  }
  if (overCategories.length > 0 && underCategories.length > 0) {
    insights.push({
      id: uid(),
      type: 'compound',
      severity: 'info',
      title: 'Spending counterbalance',
      message: `Overspending in ${overCategories.join(', ')} is partially offset by underspending in ${underCategories.join(', ')}.`,
      generatedAt: Date.now(),
    });
  }

  // Streak: overspent on same category 2+ months in a row
  for (const budget of budgets) {
    const lastMonthCatSpend = sumAmount(byCategory(lastMonthExpenses, budget.category));
    const thisMonthCatSpend = sumAmount(byCategory(thisMonthExpenses, budget.category));
    const projectedThisCat =
      elapsedDays > 0 ? (thisMonthCatSpend / elapsedDays) * totalDays : 0;
    if (lastMonthCatSpend > budget.monthlyLimit && projectedThisCat > budget.monthlyLimit) {
      insights.push({
        id: uid(),
        type: 'compound',
        severity: 'danger',
        title: `${budget.category} overspend streak`,
        message: `You overspent on ${budget.category} last month and are on track to do it again. Time to course-correct.`,
        category: budget.category,
        generatedAt: Date.now(),
      });
    }
  }

  // Deduplicate by title (keep first occurrence)
  const seen = new Set<string>();
  return insights.filter((i) => {
    if (seen.has(i.title)) return false;
    seen.add(i.title);
    return true;
  });
}
