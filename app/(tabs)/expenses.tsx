import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Modal, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Expense, CATEGORIES, Category } from '@/types';
import { Palette as P } from '@/constants/theme';

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
        inPeriod = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (filter === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
        inPeriod = e.timestamp >= weekAgo.getTime();
      } else if (filter === 'month') {
        inPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      const q = search.toLowerCase();
      return inPeriod && (!q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.merchant ?? '').toLowerCase().includes(q));
    });
  }, [expenses, filter, search]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const openEdit = (e: Expense) => {
    setEditTarget(e); setEditAmount(e.amount.toString());
    setEditDesc(e.description); setEditMerchant(e.merchant ?? ''); setEditCategory(e.category);
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
    { key: 'today', label: 'Today' }, { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' }, { key: 'all', label: 'All' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Expenses</Text>
        <View style={styles.totalBadge}><Text style={styles.totalText}>${total.toFixed(2)}</Text></View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} placeholder="🔍  Search expenses..." value={search} onChangeText={setSearch} placeholderTextColor={P.textMuted} />
      </View>

      <View style={styles.filterRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity key={p.key} onPress={() => setFilter(p.key)} style={[styles.filterBtn, filter === p.key && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === p.key && styles.filterTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && <Text style={styles.emptyText}>No expenses found.</Text>}
        {filtered.map((e) => (
          <View key={e.id} style={styles.item}>
            <View style={styles.itemAccent} />
            <View style={styles.itemLeft}>
              <Text style={styles.itemDesc}>{e.description}</Text>
              <Text style={styles.itemMeta}>{e.category}{e.merchant ? ` · ${e.merchant}` : ''} · {new Date(e.timestamp).toLocaleDateString()}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmt}>${e.amount.toFixed(2)}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openEdit(e)} style={styles.editBtn}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteExpense(e.id)} style={styles.delBtn}><Text style={styles.delBtnText}>Del</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!editTarget} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric" value={editAmount} onChangeText={setEditAmount} />
              <TextInput style={styles.input} placeholder="Description" value={editDesc} onChangeText={setEditDesc} />
              <TextInput style={styles.input} placeholder="Merchant (optional)" value={editMerchant} onChangeText={setEditMerchant} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setEditCategory(cat)} style={[styles.catBtn, editCategory === cat && styles.catBtnActive]}>
                    <Text style={[styles.catText, editCategory === cat && styles.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditTarget(null)} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.offWhite, paddingTop: 52 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  header: { fontSize: 26, fontWeight: '800', color: P.navyDeep },
  totalBadge: { backgroundColor: P.navyDeep, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  totalText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { backgroundColor: P.white, borderRadius: 12, padding: 11, fontSize: 14, borderWidth: 1, borderColor: P.blush, color: P.textDark },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: P.blush },
  filterBtnActive: { backgroundColor: P.navyDeep },
  filterText: { fontSize: 13, color: P.textMid, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  item: { backgroundColor: P.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1, shadowColor: P.navyDeep, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  itemAccent: { width: 4, height: '100%', backgroundColor: P.rose, borderRadius: 4, marginRight: 12 },
  itemLeft: { flex: 1 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: P.navyDeep },
  itemMeta: { fontSize: 11, color: P.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmt: { fontSize: 16, fontWeight: '700', color: P.navyDeep },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  editBtn: { backgroundColor: P.blush, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  editBtnText: { color: P.navyDeep, fontSize: 11, fontWeight: '700' },
  delBtn: { backgroundColor: '#FFE5F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  delBtnText: { color: P.danger, fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: P.textMuted, marginTop: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(13,30,76,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: P.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: P.blush, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, color: P.navyDeep },
  input: { backgroundColor: P.offWhite, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: P.blush, fontSize: 14, marginBottom: 10, color: P.textDark },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: P.blush, marginRight: 6 },
  catBtnActive: { backgroundColor: P.navyDeep },
  catText: { fontSize: 12, color: P.textMid },
  catTextActive: { color: '#FFF', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: P.blush, alignItems: 'center' },
  cancelText: { fontWeight: '700', color: P.textMid },
  saveBtn: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: P.navyDeep, alignItems: 'center' },
  saveText: { fontWeight: '700', color: '#FFF' },
});
