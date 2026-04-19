import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface Props {
  label?: string;
  value: string; // ISO date string or ''
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: Date;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date (optional)',
  minDate,
}: Props) {
  const [visible, setVisible] = useState(false);

  const parsed = value ? new Date(value) : null;
  const display = parsed
    ? parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.field, !display && styles.fieldEmpty]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.fieldText, !display && styles.placeholderText]}>
          📅 {display ?? placeholder}
        </Text>
        {display && (
          <TouchableOpacity
            onPress={() => onChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={visible}
        mode="date"
        date={parsed ?? new Date()}
        minimumDate={minDate ?? new Date()}
        onConfirm={(date) => {
          setVisible(false);
          onChange(date.toISOString());
        }}
        onCancel={() => setVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  fieldEmpty: { borderColor: '#EEE', backgroundColor: '#F8F9FA' },
  fieldText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  placeholderText: { color: '#AAA', fontWeight: '400' },
  clearText: { fontSize: 14, color: '#AAA', fontWeight: '700' },
});
