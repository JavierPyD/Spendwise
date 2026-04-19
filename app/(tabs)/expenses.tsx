import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Expense, CATEGORIES, Category } from '@/types';

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function ExpensesScreen() {
  const { expenses, updateExpense, deleteExpense } = useApp();
  const [filter, setFilter] = useState<FilterPeriod>('month');
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Food & Drinks');

  const filtered = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.timestamp);
      let inPeriod = true;
      if (filter === 'today') {
        inPeriod =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
      } else if (filter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        inPeriod = e.timestamp >= weekAgo.getTime();
      } else if (filter === 'month') {
        inPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.merchant ?? '').toLowerCase().includes(q);
      return inPeriod && matchSearch;
    });
  }, [expenses, filter, search]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const openEdit = (e: Expense) => {
    setEditTarget(e);
    setEditAmount(e.amount.toString());
    setEditDesc(e.description);
    setEditMerchant(e.merchant ?? '');
    setEditCategory(e.category);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    await updateExpense(editTarget.id, {
      amount: parseFloat(editAmount) || editTarget.amount,
      description: editDesc.trim() || editTarget.description,
      merchant: editMerchant.trim() || undefined,
      category: editCategory,
    });
    setEditTarget(null);
  };

  const PERIODS: { key: FilterPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Expenses</Text>
        <Text style={styles.totalBadge}>${total.toFixed(2)}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Period filter */}
      <View style={styles.filterRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setFilter(p.key)}
            style={[styles.filterBtn, filter === p.key && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === p.key && styles.filterTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No expenses found.</Text>
        )}
        {filtered.map((e) => (
          <View key={e.id} style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemDesc}>{e.description}</Text>
              <Text style={styles.itemMeta}>
                {e.category}
                {e.merchant ? ` · ${e.merchant}` : ''} ·{' '}
                {new Date(e.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmt}>${e.amount.toFixed(2)}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openEdit(e)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteExpense(e.id)} style={styles.delBtn}>
                  <Text style={styles.delBtnText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={!!editTarget} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TextInput
                style={styles.input}
                placeholder="Amount"
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={editDesc}
                onChangeText={setEditDesc}
              />
              <TextInput
                style={styles.input}
                placeholder="Merchant (optional)"
                value={editMerchant}
                onChangeText={setEditMerchant}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setEditCategory(cat)}
                    style={[styles.catBtn, editCategory === cat && styles.catBtnActive]}
                  >
                    <Text style={[styles.catText, editCategory === cat && styles.catTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditTarget(null)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingTop: 52 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  header: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  totalBadge: { backgroundColor: '#007AFF', color: '#FFF', fontWeight: '700', fontSize: 14, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 10, fontSize: 14, borderWidth: 1, borderColor: '#EEE', color: '#1A1A1A' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EEE' },
  filterBtnActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#555', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  item: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  itemLeft: { flex: 1 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  itemMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmt: { fontSize: 16, fontWeight: '700', color: '#007AFF' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  editBtn: { backgroundColor: '#E8F0FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  editBtnText: { color: '#007AFF', fontSize: 11, fontWeight: '700' },
  delBtn: { backgroundColor: '#FFE5E5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  delBtnText: { color: '#FF3B30', fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#AAA', marginTop: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: '#1A1A1A' },
  input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 11, borderWidth: 1, borderColor: '#EEE', fontSize: 14, marginBottom: 10, color: '#1A1A1A' },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EEE', marginRight: 6 },
  catBtnActive: { backgroundColor: '#007AFF' },
  catText: { fontSize: 12, color: '#555' },
  catTextActive: { color: '#FFF', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#EEE', alignItems: 'center' },
  cancelText: { fontWeight: '700', color: '#555' },
  saveBtn: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  saveText: { fontWeight: '700', color: '#FFF' },
});
