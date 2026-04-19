import {
  StyleSheet, Text, View, Switch, TouchableOpacity,
  ScrollView, TextInput, Alert, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleWeeklySummary,
  cancelWeeklySummary,
} from '@/utils/notifications';

const KEYS = {
  DAILY_ON: '@notif_daily_on',
  WEEKLY_ON: '@notif_weekly_on',
  DAILY_HOUR: '@notif_daily_hour',
};

export default function SettingsScreen() {
  const [dailyOn, setDailyOn] = useState(false);
  const [weeklyOn, setWeeklyOn] = useState(false);
  const [dailyHour, setDailyHour] = useState('20');
  const [permGranted, setPermGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestPermissions();
      setPermGranted(granted);
      const [d, w, h] = await Promise.all([
        AsyncStorage.getItem(KEYS.DAILY_ON),
        AsyncStorage.getItem(KEYS.WEEKLY_ON),
        AsyncStorage.getItem(KEYS.DAILY_HOUR),
      ]);
      setDailyOn(d === 'true');
      setWeeklyOn(w === 'true');
      if (h) setDailyHour(h);
    })();
  }, []);

  const toggleDaily = async (val: boolean) => {
    if (val && !permGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission needed', 'Please enable notifications in your device settings.');
        return;
      }
      setPermGranted(true);
    }
    setDailyOn(val);
    await AsyncStorage.setItem(KEYS.DAILY_ON, String(val));
    if (val) {
      await scheduleDailyReminder(parseInt(dailyHour, 10) || 20);
    } else {
      await cancelDailyReminder();
    }
  };

  const toggleWeekly = async (val: boolean) => {
    if (val && !permGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission needed', 'Please enable notifications in your device settings.');
        return;
      }
      setPermGranted(true);
    }
    setWeeklyOn(val);
    await AsyncStorage.setItem(KEYS.WEEKLY_ON, String(val));
    if (val) await scheduleWeeklySummary();
    else await cancelWeeklySummary();
  };

  const saveHour = async () => {
    const h = parseInt(dailyHour, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      Alert.alert('Invalid hour', 'Enter a number between 0 and 23.');
      return;
    }
    await AsyncStorage.setItem(KEYS.DAILY_HOUR, String(h));
    if (dailyOn) await scheduleDailyReminder(h);
    Alert.alert('Saved', `Daily reminder set for ${h}:00`);
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>

          {!permGranted && (
            <View style={styles.permBanner}>
              <Text style={styles.permText}>
                Notifications are disabled. Enable them in your device settings to use reminders.
              </Text>
            </View>
          )}

          {/* Daily reminder */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Daily Expense Reminder</Text>
              <Text style={styles.rowSub}>Reminds you to log expenses each day</Text>
            </View>
            <Switch
              value={dailyOn}
              onValueChange={toggleDaily}
              trackColor={{ true: '#007AFF' }}
            />
          </View>

          {dailyOn && (
            <View style={styles.hourRow}>
              <Text style={styles.rowSub}>Reminder hour (0–23):</Text>
              <TextInput
                style={styles.hourInput}
                value={dailyHour}
                onChangeText={setDailyHour}
                keyboardType="numeric"
                maxLength={2}
              />
              <TouchableOpacity onPress={saveHour} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Weekly summary */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Weekly Summary</Text>
              <Text style={styles.rowSub}>Every Sunday at 9am — your week in review</Text>
            </View>
            <Switch
              value={weeklyOn}
              onValueChange={toggleWeekly}
              trackColor={{ true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.aboutText}>SpendWise v1.0</Text>
          <Text style={styles.aboutText}>Your personal spend intelligence companion.</Text>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  content: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 40 },
  header: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 },
  permBanner: { backgroundColor: '#FFF3CD', borderRadius: 10, padding: 10, marginBottom: 14 },
  permText: { fontSize: 12, color: '#856404' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  rowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 },
  hourInput: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#EEE', width: 52, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  saveBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  aboutText: { fontSize: 13, color: '#999', marginBottom: 4 },
});
