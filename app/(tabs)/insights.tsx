import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { generateInsights } from '@/utils/insightsEngine';
import { Insight } from '@/types';
import { Palette as P } from '@/constants/theme';

type InsightFilter = 'all' | 'warning' | 'danger' | 'positive' | 'info';

const SEVERITY_CONFIG: Record<Insight['severity'], { bg: string; border: string; icon: string }> = {
  danger:   { bg: '#FFF0F5', border: P.danger,      icon: '🚨' },
  warning:  { bg: '#FFFBF0', border: P.warning,     icon: '⚠️' },
  info:     { bg: '#F0F4FF', border: P.blueAccent,  icon: '💡' },
  positive: { bg: '#F0FFF8', border: P.success,     icon: '✅' },
};

const TYPE_LABELS: Record<Insight['type'], string> = {
  budget_threshold:    'Budget',
  pace_alert:          'Pace',
  trend:               'Trend',
  behavioral:          'Behavior',
  anomaly:             'Anomaly',
  savings_opportunity: 'Savings',
  goal_aware:          'Goal',
  compound:            'Compound',
};

export default function InsightsScreen() {
  const { expenses, budgets, goals } = useApp();
  const [filter, setFilter] = useState<InsightFilter>('all');

  const insights = useMemo(() => generateInsights(expenses, budgets, goals), [expenses, budgets, goals]);
  const filtered = useMemo(() => filter === 'all' ? insights : insights.filter((i) => i.severity === filter), [insights, filter]);

  const counts = {
    danger:   insights.filter((i) => i.severity === 'danger').length,
    warning:  insights.filter((i) => i.severity === 'warning').length,
    positive: insights.filter((i) => i.severity === 'positive').length,
    info:     insights.filter((i) => i.severity === 'info').length,
  };

  const FILTERS: { key: InsightFilter; label: string; color: string }[] = [
    { key: 'all',      label: `All (${insights.length})`, color: P.navyDeep },
    { key: 'danger',   label: `🚨 ${counts.danger}`,      color: P.danger },
    { key: 'warning',  label: `⚠️ ${counts.warning}`,     color: P.warning },
    { key: 'positive', label: `✅ ${counts.positive}`,    color: P.success },
    { key: 'info',     label: `💡 ${counts.info}`,        color: P.blueAccent },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Spend Intelligence</Text>
        <Text style={styles.subHeader}>Your money, decoded</Text>
      </View>

      {/* Summary pills */}
      <View style={styles.pillRow}>
        {counts.danger > 0 && <View style={[styles.pill, { backgroundColor: P.danger }]}><Text style={styles.pillText}>🚨 {counts.danger}</Text></View>}
        {counts.warning > 0 && <View style={[styles.pill, { backgroundColor: P.warning }]}><Text style={styles.pillText}>⚠️ {counts.warning}</Text></View>}
        {counts.positive > 0 && <View style={[styles.pill, { backgroundColor: P.success }]}><Text style={styles.pillText}>✅ {counts.positive}</Text></View>}
        {counts.info > 0 && <View style={[styles.pill, { backgroundColor: P.blueAccent }]}><Text style={styles.pillText}>💡 {counts.info}</Text></View>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterBtn, filter === f.key && { backgroundColor: f.color }]}>
            <Text style={[styles.filterText, filter === f.key && { color: '#FFF' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && insights.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptySub}>Log expenses and set budgets — your intelligence will appear here.</Text>
          </View>
        )}
        {filtered.length === 0 && insights.length > 0 && (
          <Text style={styles.noMatch}>No insights in this category.</Text>
        )}
        {filtered.map((insight) => {
          const cfg = SEVERITY_CONFIG[insight.severity];
          return (
            <View key={insight.id} style={[styles.card, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: cfg.border }]} numberOfLines={2}>{insight.title}</Text>
                    <View style={[styles.badge, { backgroundColor: cfg.border }]}>
                      <Text style={styles.badgeText}>{TYPE_LABELS[insight.type]}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMsg}>{insight.message}</Text>
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
  container: { flex: 1, backgroundColor: P.offWhite, paddingTop: 52 },
  topBar: { paddingHorizontal: 20, marginBottom: 10 },
  header: { fontSize: 26, fontWeight: '800', color: P.navyDeep },
  subHeader: { fontSize: 12, color: P.textMuted, marginTop: 2 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: P.blush },
  filterText: { fontSize: 13, fontWeight: '600', color: P.textMid },
  list: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 14, marginBottom: 12, borderLeftWidth: 4, elevation: 1, shadowColor: P.navyDeep, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', gap: 10 },
  cardIcon: { fontSize: 22, marginTop: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  cardTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardMsg: { fontSize: 13, color: P.textMid, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: P.navyDeep, marginBottom: 8 },
  emptySub: { fontSize: 14, color: P.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  noMatch: { textAlign: 'center', color: P.textMuted, marginTop: 40, fontSize: 14 },
});
