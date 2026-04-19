import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, Category } from '@/types';

export default function DashboardScreen() {
  const { expenses, budgets, addExpense, isLoading } = useApp();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<Category>('Food & Drinks');

  const now = new Date();
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const todayExpenses = expenses.filter((e) => {
    const d = new Date(e.timestamp);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });
  const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const getCategoryTotal = (cat: Category) =>
    thisMonthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);

  const getBudgetForCategory = (cat: Category) =>
    budgets.find((b) => b.category === cat);

  const handleAdd = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || !description.trim()) return;
    await addExpense({
      amount: parsed,
      description: description.trim(),
      merchant: merchant.trim() || undefined,
      category,
      date: new Date().toISOString(),
    });
    setAmount('');
    setDescription('');
    setMerchant('');
    Keyboard.dismiss();
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Text style={styles.header}>SpendWise</Text>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.gearBtn}>
              <Text style={styles.gearIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#1A1A1A' }]}>
              <Text style={styles.summaryLabel}>THIS MONTH</Text>
              <Text style={styles.summaryValue}>${totalThisMonth.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.summaryLabel}>TODAY</Text>
              <Text style={styles.summaryValue}>${totalToday.toFixed(2)}</Text>
            </View>
          </View>

          {/* Category bar chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Month by Category</Text>
            {CATEGORIES.map((cat) => {
              const catTotal = getCategoryTotal(cat);
              if (catTotal === 0) return null;
              const budget = getBudgetForCategory(cat);
              const pct = budget ? Math.min(catTotal / budget.monthlyLimit, 1) : 0;
              const barPct = totalThisMonth > 0 ? catTotal / totalThisMonth : 0;
              const barColor = budget
                ? pct >= 1
                  ? '#FF3B30'
                  : pct >= 0.8
                  ? '#FF9500'
                  : '#34C759'
                : '#007AFF';
              return (
                <View key={cat} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{cat}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${barPct * 100}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.chartAmt}>${catTotal.toFixed(0)}</Text>
                </View>
              );
            })}
            {thisMonthExpenses.length === 0 && (
              <Text style={styles.emptyText}>No expenses this month yet.</Text>
            )}
          </View>

          {/* Add expense form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log Expense</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#999"
              />
            </View>
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Merchant (optional)"
              value={merchant}
              onChangeText={setMerchant}
              placeholderTextColor="#999"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catBtn, category === cat && styles.catBtnActive]}
                >
                  <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>+ Log Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Recent expenses */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent</Text>
            {expenses.slice(0, 5).map((e) => (
              <View key={e.id} style={styles.expenseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseDesc}>{e.description}</Text>
                  <Text style={styles.expenseMeta}>
                    {e.category}
                    {e.merchant ? ` · ${e.merchant}` : ''} ·{' '}
                    {new Date(e.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.expenseAmt}>${e.amount.toFixed(2)}</Text>
              </View>
            ))}
            {expenses.length === 0 && (
              <Text style={styles.emptyText}>No expenses logged yet.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { alignItems: 'center', paddingTop: 52, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '90%', marginBottom: 16 },
  gearBtn: { padding: 4 },
  gearIcon: { fontSize: 22 },
  summaryRow: { flexDirection: 'row', width: '90%', gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 18, alignItems: 'center' },
  summaryLabel: { color: '#AAA', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  summaryValue: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  card: { backgroundColor: '#FFF', width: '90%', padding: 16, borderRadius: 20, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chartLabel: { width: 90, fontSize: 11, color: '#555' },
  barBg: { flex: 1, height: 8, backgroundColor: '#EEE', borderRadius: 4, marginHorizontal: 8 },
  barFill: { height: '100%', borderRadius: 4 },
  chartAmt: { width: 44, fontSize: 11, fontWeight: '600', textAlign: 'right', color: '#333' },
  row: { flexDirection: 'row', marginBottom: 10 },
  input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#EEE', fontSize: 14, color: '#1A1A1A' },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EEE', marginRight: 6 },
  catBtnActive: { backgroundColor: '#007AFF' },
  catBtnText: { fontSize: 12, color: '#555' },
  catBtnTextActive: { color: '#FFF', fontWeight: '700' },
  addBtn: { backgroundColor: '#007AFF', padding: 13, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  expenseDesc: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  expenseMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  expenseAmt: { fontSize: 15, fontWeight: '700', color: '#007AFF' },
  emptyText: { color: '#AAA', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
});
