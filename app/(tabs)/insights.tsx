import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { generateInsights } from '@/utils/insightsEngine';
import { Insight } from '@/types';

type InsightFilter = 'all' | 'warning' | 'danger' | 'positive' | 'info';

const SEVERITY_CONFIG: Record<
  Insight['severity'],
  { bg: string; border: string; icon: string; label: string }
> = {
  danger:   { bg: '#FFF0F0', border: '#FF3B30', icon: '🚨', label: 'Alert' },
  warning:  { bg: '#FFF8EC', border: '#FF9500', icon: '⚠️', label: 'Warning' },
  info:     { bg: '#F0F6FF', border: '#007AFF', icon: '💡', label: 'Insight' },
  positive: { bg: '#F0FFF4', border: '#34C759', icon: '✅', label: 'Win' },
};

const TYPE_LABELS: Record<Insight['type'], string> = {
  budget_threshold:   'Budget',
  pace_alert:         'Pace',
  trend:              'Trend',
  behavioral:         'Behavior',
  anomaly:            'Anomaly',
  savings_opportunity:'Savings',
  goal_aware:         'Goal',
  compound:           'Compound',
};

export default function InsightsScreen() {
  const { expenses, budgets, goals } = useApp();
  const [filter, setFilter] = useState<InsightFilter>('all');

  const insights = useMemo(
    () => generateInsights(expenses, budgets, goals),
    [expenses, budgets, goals]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter((i) => i.severity === filter);
  }, [insights, filter]);

  const counts = useMemo(() => ({
    danger:   insights.filter((i) => i.severity === 'danger').length,
    warning:  insights.filter((i) => i.severity === 'warning').length,
    positive: insights.filter((i) => i.severity === 'positive').length,
    info:     insights.filter((i) => i.severity === 'info').length,
  }), [insights]);

  const FILTERS: { key: InsightFilter; label: string; color: string }[] = [
    { key: 'all',      label: `All (${insights.length})`,      color: '#1A1A1A' },
    { key: 'danger',   label: `🚨 ${counts.danger}`,           color: '#FF3B30' },
    { key: 'warning',  label: `⚠️ ${counts.warning}`,          color: '#FF9500' },
    { key: 'positive', label: `✅ ${counts.positive}`,         color: '#34C759' },
    { key: 'info',     label: `💡 ${counts.info}`,             color: '#007AFF' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Spend Intelligence</Text>
      </View>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        {counts.danger > 0 && (
          <View style={[styles.pill, { backgroundColor: '#FF3B30' }]}>
            <Text style={styles.pillText}>🚨 {counts.danger} alert{counts.danger > 1 ? 's' : ''}</Text>
          </View>
        )}
        {counts.warning > 0 && (
          <View style={[styles.pill, { backgroundColor: '#FF9500' }]}>
            <Text style={styles.pillText}>⚠️ {counts.warning} warning{counts.warning > 1 ? 's' : ''}</Text>
          </View>
        )}
        {counts.positive > 0 && (
          <View style={[styles.pill, { backgroundColor: '#34C759' }]}>
            <Text style={styles.pillText}>✅ {counts.positive} win{counts.positive > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterBtn,
              filter === f.key && { backgroundColor: f.color },
            ]}
          >
            <Text style={[styles.filterText, filter === f.key && { color: '#FFF' }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && insights.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptySubtitle}>
              Log some expenses and set budgets — your spend intelligence will appear here.
            </Text>
          </View>
        )}
        {filtered.length === 0 && insights.length > 0 && (
          <Text style={styles.noMatch}>No insights in this category.</Text>
        )}
        {filtered.map((insight) => {
          const cfg = SEVERITY_CONFIG[insight.severity];
          return (
            <View
              key={insight.id}
              style={[styles.insightCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.insightTitleRow}>
                    <Text style={[styles.insightTitle, { color: cfg.border }]}>{insight.title}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: cfg.border }]}>
                      <Text style={styles.typeBadgeText}>{TYPE_LABELS[insight.type]}</Text>
                    </View>
                  </View>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingTop: 52 },
  topBar: { paddingHorizontal: 20, marginBottom: 12 },
  header: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EEE' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#555' },
  list: { padding: 20, paddingBottom: 40 },
  insightCard: { borderRadius: 16, padding: 14, marginBottom: 12, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  insightHeader: { flexDirection: 'row', gap: 10 },
  insightIcon: { fontSize: 22, marginTop: 1 },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  insightTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  insightMessage: { fontSize: 13, color: '#444', lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  noMatch: { textAlign: 'center', color: '#AAA', marginTop: 40, fontSize: 14 },
});
