import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../../services/api';

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

export default function StudentProfileSetupScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [homeAddress, setHomeAddress] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [morningTime, setMorningTime] = useState('07:00');
  const [returnTime, setReturnTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveAddress = () => {
    if (!homeAddress.trim()) {
      Alert.alert('Error', 'Please enter your home address');
      return;
    }
    setStep(2);
  };

  const handleSaveSchedule = async () => {
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setSaving(true);
    try {
      // Step 1 — Save home address
      await api.put('/students/my/profile', { homeAddress });

      // Step 2 — Save weekly schedule for each selected day
      for (const day of selectedDays) {
        await api.post('/students/my/schedule', {
          day_of_week: day,
          morning_time: morningTime,
          return_time: returnTime,
          attendance_morning: true,
          attendance_return: true,
        });
      }

      Alert.alert(
        '✅ Profile Complete!',
        'Your profile has been set up. You can now find a bus!',
        [{ text: 'Continue', onPress: () => navigation.replace('StudentHome') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={styles.title}>Setup Your Profile</Text>
          <Text style={styles.subtitle}>Step {step} of 2</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>📍 Your Home Address</Text>
            <Text style={styles.stepSubtitle}>
              This helps the owner know your pickup location
            </Text>

            <Text style={styles.label}>Home Address</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. Hamra Street, Beirut, near ABC building"
              value={homeAddress}
              onChangeText={setHomeAddress}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.button} onPress={handleSaveAddress}>
              <Text style={styles.buttonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>📅 Your Weekly Schedule</Text>
            <Text style={styles.stepSubtitle}>
              Which days do you need the bus?
            </Text>

            {/* Day Selector */}
            <Text style={styles.label}>Select Your Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayBtn,
                    selectedDays.includes(day.value) && styles.dayBtnActive,
                  ]}
                  onPress={() => toggleDay(day.value)}
                >
                  <Text style={[
                    styles.dayBtnText,
                    selectedDays.includes(day.value) && styles.dayBtnTextActive,
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Morning Time */}
            <Text style={styles.label}>🌅 Morning Pickup Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 07:00"
              value={morningTime}
              onChangeText={setMorningTime}
              returnKeyType="next"
            />

            {/* Return Time */}
            <Text style={styles.label}>🌆 Return Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 17:00"
              value={returnTime}
              onChangeText={setReturnTime}
              returnKeyType="done"
            />

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { flex: 2 }]}
                onPress={handleSaveSchedule}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Complete ✅</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 You can always update your schedule later from your profile settings
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 24,
  },
  progress: {
    height: 6,
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  stepSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  dayBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  dayBtnText: { color: '#64748B', fontWeight: '600' },
  dayBtnTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  backBtnText: { color: '#64748B', fontWeight: '600' },
  infoBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  infoText: { color: '#065F46', fontSize: 13, textAlign: 'center' },
});