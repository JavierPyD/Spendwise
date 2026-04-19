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
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, Category, Budget } from '@/types';
import DatePickerField from '@/components/DatePickerField';

export default function BudgetsScreen() {
  const { expenses, budgets, goals, setBudget, removeBudget, addGoal, updateGoal, deleteGoal } = useApp();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category>('Food & Drinks');
  const [limitInput, setLimitInput] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const now = new Date();
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const getSpent = (cat: Category) =>
    thisMonthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);

  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsedDays = now.getDate();

  const saveBudget = async () => {
    const limit = parseFloat(limitInput);
    if (!limit) return;
    await setBudget({ category: selectedCat, monthlyLimit: limit });
    setLimitInput('');
    setShowBudgetModal(false);
  };

  const saveGoal = async () => {
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent) || 0;
    if (!goalName.trim() || !target) return;
    await addGoal({
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: goalDate || undefined,
    });
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDate('');
    setShowGoalModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Budgets & Goals</Text>

        {/* Budgets section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Budgets</Text>
          <TouchableOpacity onPress={() => setShowBudgetModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No budgets set yet. Add one to start tracking.</Text>
          </View>
        )}

        {budgets.map((b) => {
          const spent = getSpent(b.category);
          const pct = b.monthlyLimit > 0 ? Math.min(spent / b.monthlyLimit, 1) : 0;
          const projectedSpend = elapsedDays > 0 ? (spent / elapsedDays) * totalDays : 0;
          const barColor = pct >= 1 ? '#FF3B30' : pct >= 0.8 ? '#FF9500' : '#34C759';
          return (
            <View key={b.category} style={styles.budgetCard}>
              <View style={styles.budgetTop}>
                <Text style={styles.budgetCat}>{b.category}</Text>
                <TouchableOpacity onPress={() => removeBudget(b.category)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.budgetAmounts}>
                <Text style={styles.spentText}>${spent.toFixed(0)} spent</Text>
                <Text style={styles.limitText}>of ${b.monthlyLimit}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.projectedText}>
                Projected: ${projectedSpend.toFixed(0)} this month
              </Text>
            </View>
          );
        })}

        {/* Goals section */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <TouchableOpacity onPress={() => setShowGoalModal(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No goals yet. Set a savings target to stay motivated.</Text>
          </View>
        )}

        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount, 1) : 0;
          const remaining = g.targetAmount - g.currentAmount;
          return (
            <View key={g.id} style={styles.goalCard}>
              <View style={styles.budgetTop}>
                <Text style={styles.budgetCat}>{g.name}</Text>
                <TouchableOpacity onPress={() => deleteGoal(g.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.budgetAmounts}>
                <Text style={styles.spentText}>${g.currentAmount.toFixed(0)} saved</Text>
                <Text style={styles.limitText}>of ${g.targetAmount}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: '#007AFF' }]} />
              </View>
              <View style={styles.goalMeta}>
                <Text style={styles.projectedText}>${remaining.toFixed(0)} remaining</Text>
                {g.targetDate && (
                  <Text style={styles.projectedText}>
                    Target: {new Date(g.targetDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {/* Quick update current amount */}
              <GoalContributeRow
                goalId={g.id}
                currentAmount={g.currentAmount}
                onUpdate={(id, val) => updateGoal(id, { currentAmount: val })}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Budget modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Set Budget</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCat(cat)}
                    style={[styles.catBtn, selectedCat === cat && styles.catBtnActive]}
                  >
                    <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Monthly limit ($)"
                keyboardType="numeric"
                value={limitInput}
                onChangeText={setLimitInput}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowBudgetModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveBudget} style={styles.saveBtn}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Goal modal */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Savings Goal</Text>
              <TextInput style={styles.input} placeholder="Goal name" value={goalName} onChangeText={setGoalName} />
              <TextInput style={styles.input} placeholder="Target amount ($)" keyboardType="numeric" value={goalTarget} onChangeText={setGoalTarget} />
              <TextInput style={styles.input} placeholder="Already saved ($)" keyboardType="numeric" value={goalCurrent} onChangeText={setGoalCurrent} />
              <DatePickerField
                label="Target date"
                value={goalDate}
                onChange={setGoalDate}
                placeholder="Pick a target date (optional)"
                minDate={new Date()}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowGoalModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveGoal} style={styles.saveBtn}>
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

function GoalContributeRow({
  goalId,
  currentAmount,
  onUpdate,
}: {
  goalId: string;
  currentAmount: number;
  onUpdate: (id: string, val: number) => void;
}) {
  const [val, setVal] = useState('');
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      <TextInput
        style={[styles2.input, { flex: 1 }]}
        placeholder="Add savings ($)"
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
      />
      <TouchableOpacity
        style={styles2.contributeBtn}
        onPress={() => {
          const add = parseFloat(val);
          if (add > 0) {
            onUpdate(goalId, currentAmount + add);
            setVal('');
          }
        }}
      >
        <Text style={styles2.contributeBtnText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingTop: 52 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
  emptyText: { color: '#AAA', fontSize: 13, textAlign: 'center' },
  budgetCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  goalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetCat: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  removeText: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },
  budgetAmounts: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  spentText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  limitText: { fontSize: 13, color: '#999' },
  progressBg: { height: 8, backgroundColor: '#EEE', borderRadius: 4, marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  projectedText: { fontSize: 11, color: '#999' },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
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

const styles2 = StyleSheet.create({
  input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 9, borderWidth: 1, borderColor: '#EEE', fontSize: 13, color: '#1A1A1A' },
  contributeBtn: { backgroundColor: '#34C759', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  contributeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
