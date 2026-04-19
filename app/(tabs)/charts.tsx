import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, useColorScheme,
} from 'react-native';
import { useMemo, useState } from 'react';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useApp } from '@/context/AppContext';
import {
  buildDailyTrend, buildCategoryPie, buildMonthlyBars,
  buildCumulativeCurve, buildCategoryCorrelation,
  CATEGORY_COLORS,
} from '@/utils/chartHelpers';
import { CATEGORIES, Category } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W * 0.88;

type Tab = 'daily' | 'monthly' | 'categories' | 'cumulative' | 'correlation';

export default function ChartsScreen() {
  const { expenses } = useApp();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const [tab, setTab] = useState<Tab>('daily');
  const [corrCatA, setCorrCatA] = useState<Category>('Food & Drinks');
  const [corrCatB, setCorrCatB] = useState<Category>('Transport');

  const now = new Date();

  // ── Data ──────────────────────────────────────────────────────────────────
  const dailyPoints = useMemo(() => buildDailyTrend(expenses, 14), [expenses]);
  const monthlyBars = useMemo(() => buildMonthlyBars(expenses), [expenses]);
  const pieSlices   = useMemo(() => buildCategoryPie(expenses, now), [expenses]);
  const { actual, projected } = useMemo(() => buildCumulativeCurve(expenses), [expenses]);
  const corrData    = useMemo(
    () => buildCategoryCorrelation(expenses, corrCatA, corrCatB),
    [expenses, corrCatA, corrCatB]
  );

  // ── Chart data transforms ─────────────────────────────────────────────────
  const lineData = dailyPoints.map((p) => ({
    value: p.value,
    label: p.day.split(' ')[1], // just the day number
    dataPointText: p.value > 0 ? `$${p.value.toFixed(0)}` : '',
  }));

  const barData = monthlyBars.map((b, i) => ({
    value: b.value,
    label: b.month,
    frontColor: i === monthlyBars.length - 1 ? '#007AFF' : '#A8C8FF',
    topLabelComponent: () => (
      <Text style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>
        {b.value > 0 ? `$${b.value}` : ''}
      </Text>
    ),
  }));

  const pieData = pieSlices.map((s) => ({
    value: s.value,
    color: s.color,
    text: `${s.percentage}%`,
    label: s.category,
  }));

  const actualLineData = actual.map((p) => ({ value: p.y, label: p.x % 5 === 0 ? `${p.x}` : '' }));
  const projectedLineData = projected.map((p) => ({ value: p.y, label: p.x % 5 === 0 ? `${p.x}` : '' }));

  const corrBarA = corrData.map((d) => ({
    value: d.a,
    label: d.month,
    frontColor: CATEGORY_COLORS[corrCatA] ?? '#007AFF',
  }));
  const corrBarB = corrData.map((d) => ({
    value: d.b,
    label: d.month,
    frontColor: CATEGORY_COLORS[corrCatB] ?? '#FF6B6B',
  }));

  const TABS: { key: Tab; label: string }[] = [
    { key: 'daily',       label: '📈 Daily' },
    { key: 'monthly',     label: '📊 Monthly' },
    { key: 'categories',  label: '🥧 Categories' },
    { key: 'cumulative',  label: '📉 Pace' },
    { key: 'correlation', label: '🔗 Correlation' },
  ];

  const bg = dark ? '#1A1A1A' : '#F0F2F5';
  const cardBg = dark ? '#2C2C2E' : '#FFF';
  const textColor = dark ? '#FFF' : '#1A1A1A';
  const subColor = dark ? '#AAA' : '#666';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.topBar}>
        <Text style={[styles.header, { color: textColor }]}>Charts & Trends</Text>
      </View>

      {/* Tab selector */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll} contentContainerStyle={styles.tabContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Daily Trend ── */}
        {tab === 'daily' && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Daily Spending — Last 14 Days</Text>
            <Text style={[styles.cardSub, { color: subColor }]}>
              Total: ${dailyPoints.reduce((s, p) => s + p.value, 0).toFixed(0)}
            </Text>
            {lineData.every((d) => d.value === 0) ? (
              <EmptyChart />
            ) : (
              <LineChart
                data={lineData}
                width={CHART_W - 32}
                height={200}
                color="#007AFF"
                thickness={2}
                dataPointsColor="#007AFF"
                dataPointsRadius={4}
                startFillColor="#007AFF"
                endFillColor="transparent"
                areaChart
                curved
                hideYAxisText={false}
                yAxisTextStyle={{ color: subColor, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: subColor, fontSize: 9 }}
                noOfSections={4}
                rulesColor={dark ? '#333' : '#EEE'}
                yAxisColor="transparent"
                xAxisColor={dark ? '#444' : '#EEE'}
                initialSpacing={10}
                spacing={Math.max(20, (CHART_W - 64) / lineData.length)}
              />
            )}
          </View>
        )}

        {/* ── Monthly Bars ── */}
        {tab === 'monthly' && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Monthly Spending — Last 6 Months</Text>
            {barData.every((d) => d.value === 0) ? (
              <EmptyChart />
            ) : (
              <BarChart
                data={barData}
                width={CHART_W - 32}
                height={200}
                barWidth={32}
                spacing={16}
                roundedTop
                hideRules={false}
                rulesColor={dark ? '#333' : '#EEE'}
                yAxisTextStyle={{ color: subColor, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: subColor, fontSize: 11 }}
                noOfSections={4}
                yAxisColor="transparent"
                xAxisColor={dark ? '#444' : '#EEE'}
                initialSpacing={16}
              />
            )}
            {/* MoM delta */}
            {monthlyBars.length >= 2 && (
              <MoMDelta
                current={monthlyBars[monthlyBars.length - 1].value}
                previous={monthlyBars[monthlyBars.length - 2].value}
                subColor={subColor}
              />
            )}
          </View>
        )}

        {/* ── Category Pie ── */}
        {tab === 'categories' && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>
              Category Breakdown — {now.toLocaleDateString('en-US', { month: 'long' })}
            </Text>
            {pieData.length === 0 ? (
              <EmptyChart />
            ) : (
              <>
                <View style={styles.pieWrap}>
                  <PieChart
                    data={pieData}
                    donut
                    radius={100}
                    innerRadius={60}
                    centerLabelComponent={() => (
                      <View style={styles.pieCenter}>
                        <Text style={[styles.pieCenterVal, { color: textColor }]}>
                          ${pieSlices.reduce((s, p) => s + p.value, 0).toFixed(0)}
                        </Text>
                        <Text style={[styles.pieCenterLabel, { color: subColor }]}>total</Text>
                      </View>
                    )}
                  />
                </View>
                {/* Legend */}
                <View style={styles.legend}>
                  {pieSlices.map((s) => (
                    <View key={s.category} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={[styles.legendLabel, { color: textColor }]}>{s.category}</Text>
                      <Text style={[styles.legendVal, { color: subColor }]}>
                        ${s.value.toFixed(0)} ({s.percentage}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Cumulative Pace ── */}
        {tab === 'cumulative' && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Spend Pace — This Month</Text>
            <Text style={[styles.cardSub, { color: subColor }]}>
              Actual (blue) vs Projected (orange)
            </Text>
            {actualLineData.every((d) => d.value === 0) ? (
              <EmptyChart />
            ) : (
              <LineChart
                data={actualLineData}
                data2={projectedLineData}
                width={CHART_W - 32}
                height={200}
                color="#007AFF"
                color2="#FF9500"
                thickness={2}
                thickness2={2}
                dataPointsColor="#007AFF"
                dataPointsColor2="#FF9500"
                dataPointsRadius={3}
                curved
                hideYAxisText={false}
                yAxisTextStyle={{ color: subColor, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: subColor, fontSize: 9 }}
                noOfSections={4}
                rulesColor={dark ? '#333' : '#EEE'}
                yAxisColor="transparent"
                xAxisColor={dark ? '#444' : '#EEE'}
                initialSpacing={8}
                spacing={Math.max(10, (CHART_W - 64) / projectedLineData.length)}
              />
            )}
            {projected.length > 0 && (
              <View style={styles.projectedBadge}>
                <Text style={styles.projectedBadgeText}>
                  📍 Projected month-end: ${projected[projected.length - 1]?.y ?? 0}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Correlation ── */}
        {tab === 'correlation' && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Category Correlation</Text>
            <Text style={[styles.cardSub, { color: subColor }]}>
              Compare two categories over 6 months
            </Text>

            {/* Category A picker */}
            <Text style={[styles.pickerLabel, { color: subColor }]}>Category A</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCorrCatA(cat)}
                  style={[
                    styles.catChip,
                    corrCatA === cat && { backgroundColor: CATEGORY_COLORS[cat] ?? '#007AFF' },
                  ]}
                >
                  <Text style={[styles.catChipText, corrCatA === cat && { color: '#FFF' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category B picker */}
            <Text style={[styles.pickerLabel, { color: subColor }]}>Category B</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCorrCatB(cat)}
                  style={[
                    styles.catChip,
                    corrCatB === cat && { backgroundColor: CATEGORY_COLORS[cat] ?? '#FF6B6B' },
                  ]}
                >
                  <Text style={[styles.catChipText, corrCatB === cat && { color: '#FFF' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {corrBarA.every((d) => d.value === 0) && corrBarB.every((d) => d.value === 0) ? (
              <EmptyChart />
            ) : (
              <>
                <BarChart
                  data={corrBarA}
                  data2={corrBarB}
                  width={CHART_W - 32}
                  height={200}
                  barWidth={18}
                  spacing={8}
                  roundedTop
                  rulesColor={dark ? '#333' : '#EEE'}
                  yAxisTextStyle={{ color: subColor, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: subColor, fontSize: 11 }}
                  noOfSections={4}
                  yAxisColor="transparent"
                  xAxisColor={dark ? '#444' : '#EEE'}
                  initialSpacing={12}
                />
                {/* Correlation insight */}
                <CorrelationInsight
                  dataA={corrData.map((d) => d.a)}
                  dataB={corrData.map((d) => d.b)}
                  catA={corrCatA}
                  catB={corrCatB}
                  colorA={CATEGORY_COLORS[corrCatA] ?? '#007AFF'}
                  colorB={CATEGORY_COLORS[corrCatB] ?? '#FF6B6B'}
                />
              </>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyChartText}>Not enough data yet — log some expenses!</Text>
    </View>
  );
}

function MoMDelta({
  current, previous, subColor,
}: {
  current: number; previous: number; subColor: string;
}) {
  if (previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const up = delta > 0;
  return (
    <View style={styles.deltaRow}>
      <Text style={[styles.deltaText, { color: up ? '#FF3B30' : '#34C759' }]}>
        {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs last month
      </Text>
      <Text style={{ color: subColor, fontSize: 12 }}>
        {' '}(${previous} → ${current})
      </Text>
    </View>
  );
}

function CorrelationInsight({
  dataA, dataB, catA, catB, colorA, colorB,
}: {
  dataA: number[]; dataB: number[];
  catA: string; catB: string;
  colorA: string; colorB: string;
}) {
  // Pearson correlation coefficient
  const n = dataA.length;
  if (n < 2) return null;
  const meanA = dataA.reduce((s, v) => s + v, 0) / n;
  const meanB = dataB.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    num  += (dataA[i] - meanA) * (dataB[i] - meanB);
    denA += (dataA[i] - meanA) ** 2;
    denB += (dataB[i] - meanB) ** 2;
  }
  const r = denA === 0 || denB === 0 ? 0 : num / Math.sqrt(denA * denB);
  const rRounded = Math.round(r * 100) / 100;

  let label = '';
  let insight = '';
  if (r > 0.7) {
    label = 'Strong positive';
    insight = `When you spend more on ${catA}, you tend to spend more on ${catB} too.`;
  } else if (r > 0.3) {
    label = 'Moderate positive';
    insight = `${catA} and ${catB} spending tend to rise together.`;
  } else if (r < -0.7) {
    label = 'Strong negative';
    insight = `Higher ${catA} spending tends to coincide with lower ${catB} spending — a trade-off pattern.`;
  } else if (r < -0.3) {
    label = 'Moderate negative';
    insight = `${catA} and ${catB} seem to offset each other month to month.`;
  } else {
    label = 'No clear correlation';
    insight = `${catA} and ${catB} spending appear independent of each other.`;
  }

  return (
    <View style={styles.corrInsight}>
      <View style={styles.corrLegend}>
        <View style={[styles.corrDot, { backgroundColor: colorA }]} />
        <Text style={styles.corrLegendText}>{catA}</Text>
        <View style={[styles.corrDot, { backgroundColor: colorB, marginLeft: 12 }]} />
        <Text style={styles.corrLegendText}>{catB}</Text>
      </View>
      <Text style={styles.corrR}>r = {rRounded} — {label}</Text>
      <Text style={styles.corrInsightText}>{insight}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 52 },
  topBar: { paddingHorizontal: 20, marginBottom: 8 },
  header: { fontSize: 26, fontWeight: '800' },
  tabScroll: { maxHeight: 46 },
  tabContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE' },
  tabBtnActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#FFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: 14 },
  pieWrap: { alignItems: 'center', marginVertical: 8 },
  pieCenter: { alignItems: 'center' },
  pieCenterVal: { fontSize: 20, fontWeight: '800' },
  pieCenterLabel: { fontSize: 11 },
  legend: { marginTop: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  legendVal: { fontSize: 12 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  deltaText: { fontSize: 13, fontWeight: '700' },
  projectedBadge: { backgroundColor: '#FFF8EC', borderRadius: 10, padding: 10, marginTop: 12 },
  projectedBadgeText: { color: '#FF9500', fontWeight: '700', fontSize: 13 },
  pickerLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#EEE', marginRight: 6 },
  catChipText: { fontSize: 12, color: '#555' },
  corrInsight: { backgroundColor: '#F0F6FF', borderRadius: 12, padding: 12, marginTop: 14 },
  corrLegend: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  corrDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  corrLegendText: { fontSize: 12, fontWeight: '600', color: '#333' },
  corrR: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  corrInsightText: { fontSize: 13, color: '#444', lineHeight: 18 },
  emptyChart: { height: 120, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { color: '#AAA', fontSize: 13 },
});
