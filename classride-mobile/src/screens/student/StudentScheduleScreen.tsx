import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
} from 'react-native';
import api from '../../services/api';

const DAY_NAMES: { [key: number]: string } = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

const ALL_DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

export default function StudentScheduleScreen() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [morningTime, setMorningTime] = useState('07:00');
  const [returnTime, setReturnTime] = useState('17:00');
  const [attendanceMorning, setAttendanceMorning] = useState(true);
  const [attendanceReturn, setAttendanceReturn] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/students/my/schedule');
      setSchedule(response.data);
    } catch (error) {
      console.log('Error fetching schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEdit = (day: any) => {
    setEditingDay(day);
    setMorningTime(day.morningTime || '07:00');
    setReturnTime(day.returnTime || '17:00');
    setAttendanceMorning(day.attendanceMorning ?? true);
    setAttendanceReturn(day.attendanceReturn ?? true);
    setModalVisible(true);
  };

  const handleAddDay = (dayValue: number) => {
    setEditingDay({ dayOfWeek: dayValue, isNew: true });
    setMorningTime('07:00');
    setReturnTime('17:00');
    setAttendanceMorning(true);
    setAttendanceReturn(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/students/my/schedule', {
        day_of_week: editingDay.dayOfWeek,
        morning_time: morningTime,
        return_time: returnTime,
        attendance_morning: attendanceMorning,
        attendance_return: attendanceReturn,
      });
      setModalVisible(false);
      fetchSchedule();
      Alert.alert('✅ Saved!', 'Schedule updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dayOfWeek: number) => {
    Alert.alert(
      'Delete Day',
      `Remove ${DAY_NAMES[dayOfWeek]} from your schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/students/my/schedule/${dayOfWeek}`);
              fetchSchedule();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const scheduledDays = schedule.map(s => s.dayOfWeek);
  const availableDays = ALL_DAYS.filter(d => !scheduledDays.includes(d.value));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchSchedule} />}
    >
      {/* Header */}
      <View style={styles.header}>
      <Text style={styles.headerTitle}>🗓️ Weekly Schedule</Text>
<Text style={styles.headerSubtitle}>Your fixed default schedule & attendance</Text>
      </View>

      <View style={styles.content}>
        {/* Scheduled Days */}
        {schedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No schedule set yet</Text>
            <Text style={styles.emptySubtext}>Add your travel days below</Text>
          </View>
        ) : (
          schedule.map((day: any) => (
            <View key={day.dayOfWeek} style={styles.dayCard}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{DAY_NAMES[day.dayOfWeek]}</Text>
                <View style={styles.timesRow}>
                  <Text style={styles.timeText}>🌅 {day.morningTime}</Text>
                  <Text style={styles.timeSeparator}>•</Text>
                  <Text style={styles.timeText}>🌆 {day.returnTime}</Text>
                </View>
                <View style={styles.attendanceRow}>
                  <Text style={[styles.attendanceBadge,
                    { backgroundColor: day.attendanceMorning ? '#DEF7EC' : '#FEE2E2' }
                  ]}>
                    {day.attendanceMorning ? '✅ Morning' : '❌ Morning'}
                  </Text>
                  <Text style={[styles.attendanceBadge,
                    { backgroundColor: day.attendanceReturn ? '#DEF7EC' : '#FEE2E2' }
                  ]}>
                    {day.attendanceReturn ? '✅ Return' : '❌ Return'}
                  </Text>
                </View>
              </View>
              <View style={styles.dayActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEdit(day)}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(day.dayOfWeek)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Add Available Days */}
        {availableDays.length > 0 && (
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>+ Add a Day</Text>
            <View style={styles.daysRow}>
              {availableDays.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={styles.addDayBtn}
                  onPress={() => handleAddDay(day.value)}
                >
                  <Text style={styles.addDayBtnText}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 This is your default weekly schedule. You can override specific dates from the Attendance tab.
          </Text>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingDay?.isNew ? '+ Add' : '✏️ Edit'} {DAY_NAMES[editingDay?.dayOfWeek]}
                </Text>

                <Text style={styles.label}>🌅 Morning Pickup Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 07:00"
                  value={morningTime}
                  onChangeText={setMorningTime}
                  returnKeyType="next"
                />

                <Text style={styles.label}>🌆 Return Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 17:00"
                  value={returnTime}
                  onChangeText={setReturnTime}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                {/* Attendance Toggles */}
                <View style={styles.toggleSection}>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>🌅 Attending Morning by default</Text>
                    <Switch
                      value={attendanceMorning}
                      onValueChange={setAttendanceMorning}
                      trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                      thumbColor={attendanceMorning ? '#059669' : '#94A3B8'}
                    />
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>🌆 Attending Return by default</Text>
                    <Switch
                      value={attendanceReturn}
                      onValueChange={setAttendanceReturn}
                      trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                      thumbColor={attendanceReturn ? '#059669' : '#94A3B8'}
                    />
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save ✅</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#059669',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#A7F3D0', fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  timesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  timeText: { fontSize: 14, color: '#64748B' },
  timeSeparator: { color: '#CBD5E1' },
  attendanceRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  attendanceBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: '#1E293B',
  },
  dayActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: '#DBEAFE', borderRadius: 8 },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  deleteBtnText: { fontSize: 16 },
  addSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addDayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  addDayBtnText: { color: '#059669', fontWeight: '600' },
  infoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  infoText: { color: '#065F46', fontSize: 13, lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
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
  toggleSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: { fontSize: 14, color: '#374151', flex: 1 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});