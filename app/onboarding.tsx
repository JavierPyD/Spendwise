import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Keyboard, TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CATEGORIES, Category } from '@/types';
import * as Storage from '@/utils/storage';
import { useApp } from '@/context/AppContext';

const { width: W } = Dimensions.get('window');

const CURRENCIES = ['$', '€', '£', '¥', '₹', 'MXN'];

const SUGGESTED_BUDGETS: { category: Category; amount: number }[] = [
  { category: 'Food & Drinks', amount: 300 },
  { category: 'Groceries',     amount: 400 },
  { category: 'Transport',     amount: 150 },
  { category: 'Entertainment', amount: 100 },
  { category: 'Shopping',      amount: 200 },
  { category: 'Health',        amount: 100 },
];

type Step = 0 | 1 | 2 | 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const { setBudget, addGoal } = useApp();

  const [step, setStep] = useState<Step>(0);

  // Step 1 — profile
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');

  // Step 2 — budgets
  const [budgetAmounts, setBudgetAmounts] = useState<Partial<Record<Category, string>>>({
    'Food & Drinks': '300',
    'Groceries':     '400',
    'Transport':     '150',
    'Entertainment': '100',
    'Shopping':      '200',
    'Health':        '100',
  });
  const [selectedBudgetCats, setSelectedBudgetCats] = useState<Set<Category>>(
    new Set(['Food & Drinks', 'Groceries', 'Transport'])
  );

  // Step 3 — goal
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const toggleCat = (cat: Category) => {
    setSelectedBudgetCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const finishOnboarding = async () => {
    // Save profile
    await Storage.saveUserName(name.trim() || 'Friend');
    await Storage.saveCurrency(currency);

    // Save selected budgets
    for (const cat of selectedBudgetCats) {
      const amt = parseFloat(budgetAmounts[cat] ?? '0');
      if (amt > 0) await setBudget({ category: cat, monthlyLimit: amt });
    }

    // Save goal if filled
    const target = parseFloat(goalTarget);
    if (goalName.trim() && target > 0) {
      await addGoal({
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: parseFloat(goalCurrent) || 0,
        targetDate: goalDate || undefined,
      });
    }

    await Storage.setOnboarded(true);
    router.replace('/(tabs)');
  };

  const STEPS = ['Welcome', 'Profile', 'Budgets', 'Goal'];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepWrap}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
            </View>
          ))}
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.emoji}>👋</Text>
              <Text style={styles.title}>Welcome to SpendWise</Text>
              <Text style={styles.subtitle}>
                Your personal spend intelligence companion. Let's get you set up in just a few steps.
              </Text>
              <View style={styles.featureList}>
                {[
                  ['💰', 'Track every expense effortlessly'],
                  ['📊', 'Visualise your spending with charts'],
                  ['🧠', 'Get smart insights and alerts'],
                  ['🎯', 'Set budgets and savings goals'],
                ].map(([icon, text]) => (
                  <View key={text} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>{icon}</Text>
                    <Text style={styles.featureText}>{text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Step 1: Profile ── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.emoji}>🙋</Text>
              <Text style={styles.title}>Tell us about you</Text>
              <Text style={styles.subtitle}>We'll personalise your experience.</Text>

              <Text style={styles.fieldLabel}>Your name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Javier"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#AAA"
              />

              <Text style={styles.fieldLabel}>Currency</Text>
              <View style={styles.currencyRow}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                  >
                    <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Step 2: Budgets ── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={styles.title}>Set your monthly budgets</Text>
              <Text style={styles.subtitle}>
                Select categories and set limits. You can always change these later.
              </Text>

              {SUGGESTED_BUDGETS.map(({ category, amount }) => {
                const selected = selectedBudgetCats.has(category);
                return (
                  <View key={category} style={[styles.budgetRow, selected && styles.budgetRowActive]}>
                    <TouchableOpacity
                      onPress={() => toggleCat(category)}
                      style={styles.budgetCheck}
                    >
                      <Text style={styles.budgetCheckText}>{selected ? '✅' : '⬜'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.budgetCat}>{category}</Text>
                    <View style={styles.budgetInputWrap}>
                      <Text style={styles.currencyPrefix}>{currency}</Text>
                      <TextInput
                        style={styles.budgetInput}
                        value={budgetAmounts[category]}
                        onChangeText={(v) =>
                          setBudgetAmounts((prev) => ({ ...prev, [category]: v }))
                        }
                        keyboardType="numeric"
                        editable={selected}
                        placeholderTextColor="#CCC"
                      />
                    </View>
                  </View>
                );
              })}
              <Text style={styles.skipNote}>You can skip this and set budgets later.</Text>
            </View>
          )}

          {/* ── Step 3: Goal ── */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.emoji}>🏆</Text>
              <Text style={styles.title}>Set your first savings goal</Text>
              <Text style={styles.subtitle}>
                A goal keeps you motivated. You can skip this and add one later.
              </Text>

              <Text style={styles.fieldLabel}>Goal name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Emergency Fund, Vacation"
                value={goalName}
                onChangeText={setGoalName}
                placeholderTextColor="#AAA"
              />

              <Text style={styles.fieldLabel}>Target amount ({currency})</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000"
                value={goalTarget}
                onChangeText={setGoalTarget}
                keyboardType="numeric"
                placeholderTextColor="#AAA"
              />

              <Text style={styles.fieldLabel}>Already saved ({currency})</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 200"
                value={goalCurrent}
                onChangeText={setGoalCurrent}
                keyboardType="numeric"
                placeholderTextColor="#AAA"
              />

              <Text style={styles.fieldLabel}>Target date (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={goalDate}
                onChangeText={setGoalDate}
                placeholderTextColor="#AAA"
              />
            </View>
          )}

        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity
              onPress={() => setStep((s) => (s - 1) as Step)}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 3 ? (
            <TouchableOpacity
              onPress={() => setStep((s) => (s + 1) as Step)}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {step === 0 ? "Let's go →" : 'Next →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={finishOnboarding} style={styles.finishBtn}>
              <Text style={styles.finishBtnText}>🚀 Start SpendWise</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingTop: 52 },
  progressWrap: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 8 },
  stepWrap: { alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#007AFF' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#999' },
  stepDotTextActive: { color: '#FFF' },
  stepLabel: { fontSize: 10, color: '#AAA', fontWeight: '600' },
  stepLabelActive: { color: '#007AFF' },
  progressBarBg: { height: 3, backgroundColor: '#DDD', marginHorizontal: 20, borderRadius: 2, marginBottom: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  stepContent: { alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: 12, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
  featureList: { width: '100%', gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  featureIcon: { fontSize: 22 },
  featureText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  fieldLabel: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 4 },
  input: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#EEE', fontSize: 15, color: '#1A1A1A', marginBottom: 14 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10, alignSelf: 'flex-start' },
  currencyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EEE' },
  currencyBtnActive: { backgroundColor: '#007AFF' },
  currencyText: { fontSize: 15, fontWeight: '700', color: '#555' },
  currencyTextActive: { color: '#FFF' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, width: '100%', borderWidth: 1, borderColor: '#EEE' },
  budgetRowActive: { borderColor: '#007AFF' },
  budgetCheck: { marginRight: 10 },
  budgetCheckText: { fontSize: 18 },
  budgetCat: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  budgetInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 8, paddingHorizontal: 8, borderWidth: 1, borderColor: '#EEE' },
  currencyPrefix: { fontSize: 13, color: '#999', marginRight: 2 },
  budgetInput: { width: 60, fontSize: 14, fontWeight: '700', color: '#1A1A1A', padding: 6 },
  skipNote: { fontSize: 12, color: '#AAA', marginTop: 8, textAlign: 'center' },
  navRow: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, gap: 12 },
  backBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#EEE', alignItems: 'center' },
  backBtnText: { fontWeight: '700', color: '#555', fontSize: 15 },
  nextBtn: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: '#007AFF', alignItems: 'center' },
  nextBtnText: { fontWeight: '700', color: '#FFF', fontSize: 15 },
  finishBtn: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: '#34C759', alignItems: 'center' },
  finishBtnText: { fontWeight: '700', color: '#FFF', fontSize: 15 },
});
