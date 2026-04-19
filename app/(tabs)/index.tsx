import { StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES = ['Services', 'Food & Drinks', 'Transport', 'Shopping', 'Health', 'Entertainment'];

export default function HomeScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Services');
  const [expenses, setExpenses] = useState([]);

  useEffect(() => { 
    loadExpenses(); 
  }, []);

  const loadExpenses = async () => {
    try {
      const saved = await AsyncStorage.getItem('@expenses_key');
      if (saved) setExpenses(JSON.parse(saved));
    } catch (e) { 
      console.error("Error loading data", e); 
    }
  };

  const addExpense = async () => {
    if (!amount || !description) return;
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(amount).toFixed(2),
      description,
      category,
      date: new Date().toLocaleDateString()
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    try {
      await AsyncStorage.setItem('@expenses_key', JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving data", e);
    }
    setAmount(''); 
    setDescription(''); 
    Keyboard.dismiss();
  };

  const deleteExpense = async (id) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    try {
      await AsyncStorage.setItem('@expenses_key', JSON.stringify(updatedExpenses));
    } catch (e) {
      console.error("Error deleting data", e);
    }
  };

  const totalAmount = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  const getCategoryTotal = (cat) => {
    return expenses
      .filter(e => e.category === cat)
      .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
        <ScrollView 
          contentContainerStyle={{ alignItems: 'center', paddingTop: 40, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>SpendWise</Text>

          {/* Resumen Total */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
            <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
          </View>

          {/* Gráfica de Barras */}
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Spending by Category</Text>
            {CATEGORIES.map(cat => {
              const catTotal = getCategoryTotal(cat);
              const percentage = totalAmount > 0 ? (catTotal / totalAmount) : 0;
              return (
                <View key={cat} style={styles.chartRow}>
                  <Text style={styles.chartText}>{cat}</Text>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${percentage * 100}%` }]} />
                  </View>
                  <Text style={styles.chartAmount}>${catTotal.toFixed(0)}</Text>
                </View>
              );
            })}
          </View>

          {/* Formulario */}
          <View style={styles.card}>
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 10 }]} 
                placeholder="Amount" 
                keyboardType="numeric" 
                value={amount} 
                onChangeText={setAmount} 
              />
              <View style={styles.categoryPicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setCategory(cat)} 
                      style={[styles.catBtn, category === cat && styles.catBtnActive]}
                    >
                      <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TextInput 
              style={styles.input} 
              placeholder="Description" 
              value={description} 
              onChangeText={setDescription} 
            />
            <TouchableOpacity style={styles.button} onPress={addExpense}>
              <Text style={styles.buttonText}>Log Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Gastos (Usando .map para que el scroll funcione bien) */}
          <View style={{ width: '90%' }}>
            {expenses.map((item) => (
              <View key={item.id} style={styles.expenseItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemCategory}>{item.category} • {item.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemAmount}>${item.amount}</Text>
                  <TouchableOpacity 
                    onPress={() => deleteExpense(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  summaryCard: { backgroundColor: '#1A1A1A', width: '90%', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  summaryLabel: { color: '#AAA', fontSize: 10, fontWeight: '600' },
  summaryValue: { color: '#FFF', fontSize: 36, fontWeight: '800' },
  chartCard: { backgroundColor: '#FFF', width: '90%', padding: 15, borderRadius: 20, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#333' },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chartText: { width: 85, fontSize: 11, color: '#666' },
  barBackground: { flex: 1, height: 8, backgroundColor: '#EEE', borderRadius: 4, marginHorizontal: 10 },
  barFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  chartAmount: { width: 40, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  card: { backgroundColor: '#fff', width: '90%', padding: 15, borderRadius: 20, elevation: 5, marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#EEE' },
  categoryPicker: { flex: 2, height: 40 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 5, height: 35 },
  catBtnActive: { backgroundColor: '#007AFF' },
  catBtnText: { fontSize: 12, color: '#666' },
  catBtnTextActive: { color: '#FFF', fontWeight: 'bold' },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  expenseItem: { backgroundColor: '#fff', padding: 12, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderLeftWidth: 5, borderLeftColor: '#007AFF' },
  itemDescription: { fontSize: 14, fontWeight: '600' },
  itemCategory: { fontSize: 11, color: '#999' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', color: '#2ecc71' },
  deleteButton: { marginTop: 5, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#FF3B30', borderRadius: 8 },
  deleteButtonText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
});