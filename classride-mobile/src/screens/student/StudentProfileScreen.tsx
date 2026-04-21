import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

export default function StudentProfileScreen() {
  const { user, logout } = useAuth();

  // Profile state
  const [homeAddress, setHomeAddress] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Schedule state
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [morningTime, setMorningTime] = useState('07:00');
  const [returnTime, setReturnTime] = useState('17:00');
  const [attendanceMorning, setAttendanceMorning] = useState(true);
  const [attendanceReturn, setAttendanceReturn] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSchedule();
  }, []);

  // ─── Profile ───────────────────────────────────

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setHomeAddress(res.data.student?.homeAddress ?? '');
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!homeAddress.trim()) {
      Alert.alert('Error', 'Please enter your home address');
      return;
    }
    setSavingProfile(true);
    try {
      await api.put('/students/my/profile', { homeAddress });
      Alert.alert('✅ Saved!', 'Your home address has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save');
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Schedule ──────────────────────────────────

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/students/my/schedule');
      setSchedule(res.data);
    } catch (error) {
      console.log('Error fetching schedule:', error);
    } finally {
      setLoadingSchedule(false);
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

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
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
      Alert.alert('✅ Saved!', 'Schedule updated.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteDay = (dayOfWeek: number) => {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👤 My Profile</Text>
        </View>

        <View style={styles.content}>

          {/* ── User Info Card ── */}
          <View style={styles.infoCard}>
            <Text style={styles.infoAvatar}>🎓</Text>
            <Text style={styles.infoName}>{user?.fullName}</Text>
            <Text style={styles.infoPhone}>📱 {user?.phoneNumber}</Text>
            <View style={[
              styles.roleBadge,
              { backgroundColor: user?.role === 'student' ? '#DCFCE7' : '#FEF3C7' }
            ]}>
              <Text style={[
                styles.roleBadgeText,
                { color: user?.role === 'student' ? '#059669' : '#D97706' }
              ]}>
                {user?.role === 'student' ? '✅ Student' : '⏳ Pending Approval'}
              </Text>
            </View>
          </View>

          {/* ── Home Address ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📍 Home Address</Text>
            <Text style={styles.sectionSubtitle}>
              Your pickup location shown to the bus owner
            </Text>
            {loadingProfile ? (
              <ActivityIndicator color="#059669" style={{ marginVertical: 12 }} />
            ) : (
              <>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="e.g. Hamra Street, near ABC building, Beirut"
                  value={homeAddress}
                  onChangeText={setHomeAddress}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>💾 Save Address</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Weekly Schedule ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🗓️ Weekly Schedule</Text>
            <Text style={styles.sectionSubtitle}>
              Your default pickup and return times
            </Text>

            {loadingSchedule ? (
              <ActivityIndicator color="#059669" style={{ marginVertical: 12 }} />
            ) : (
              <>
                {schedule.length === 0 ? (
                  <View style={styles.emptySchedule}>
                    <Text style={styles.emptyScheduleText}>No days added yet</Text>
                  </View>
                ) : (
                  schedule.map((day: any) => (
                    <View key={day.dayOfWeek} style={styles.dayRow}>
                      <View style={styles.dayInfo}>
                        <Text style={styles.dayName}>{DAY_NAMES[day.dayOfWeek]}</Text>
                        <View style={styles.timesRow}>
                          <Text style={styles.timeText}>🌅 {day.morningTime}</Text>
                          <Text style={styles.timeDot}>•</Text>
                          <Text style={styles.timeText}>🌆 {day.returnTime}</Text>
                        </View>
                        <View style={styles.badgesRow}>
                          <View style={[styles.badge, { backgroundColor: day.attendanceMorning ? '#DCFCE7' : '#FEE2E2' }]}>
                            <Text style={[styles.badgeText, { color: day.attendanceMorning ? '#059669' : '#DC2626' }]}>
                              {day.attendanceMorning ? '✅ Morning' : '❌ Morning'}
                            </Text>
                          </View>
                          <View style={[styles.badge, { backgroundColor: day.attendanceReturn ? '#DCFCE7' : '#FEE2E2' }]}>
                            <Text style={[styles.badgeText, { color: day.attendanceReturn ? '#059669' : '#DC2626' }]}>
                              {day.attendanceReturn ? '✅ Return' : '❌ Return'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.dayActions}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(day)}>
                          <Text style={styles.editBtnText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteDay(day.dayOfWeek)}>
                          <Text style={styles.deleteBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                {/* Add available days */}
                {availableDays.length > 0 && (
                  <View style={styles.addDaysSection}>
                    <Text style={styles.addDaysTitle}>+ Add a Day</Text>
                    <View style={styles.daysChipRow}>
                      {availableDays.map(day => (
                        <TouchableOpacity
                          key={day.value}
                          style={styles.addDayChip}
                          onPress={() => handleAddDay(day.value)}
                        >
                          <Text style={styles.addDayChipText}>{day.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ── Pending Info ── */}
          {user?.role === 'pending' && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingText}>
                ⏳ Your join request is pending. Once a bus owner accepts you, your role will become Student.
              </Text>
            </View>
          )}

          {/* ── Logout ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>🚪 Logout</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ── Edit/Add Day Modal ── */}
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
                    style={styles.modalSaveBtn}
                    onPress={handleSaveSchedule}
                    disabled={savingSchedule}
                  >
                    {savingSchedule ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalSaveBtnText}>Save ✅</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16 },

  // Info card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoAvatar: { fontSize: 52, marginBottom: 10 },
  infoName: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  infoPhone: { fontSize: 14, color: '#64748B', marginTop: 4 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  roleBadgeText: { fontWeight: '700', fontSize: 13 },

  // Section cards
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },

  // Input
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  multilineInput: { height: 80, textAlignVertical: 'top' },

  // Save address button
  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Schedule day rows
  emptySchedule: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 12,
  },
  emptyScheduleText: { color: '#94A3B8', fontSize: 14 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  timesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timeText: { fontSize: 13, color: '#64748B' },
  timeDot: { color: '#CBD5E1' },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dayActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: '#DBEAFE', borderRadius: 8 },
  editBtnText: { fontSize: 15 },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  deleteBtnText: { fontSize: 15 },

  // Add days
  addDaysSection: { marginTop: 16 },
  addDaysTitle: { fontSize: 14, fontWeight: '600', color: '#059669', marginBottom: 10 },
  daysChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addDayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  addDayChipText: { color: '#059669', fontWeight: '600', fontSize: 13 },

  // Pending info
  pendingBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: { color: '#92400E', fontSize: 13, lineHeight: 20 },

  // Logout
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },

  // Modal
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
  toggleSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 14, color: '#374151', flex: 1 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#F1F5F9',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  modalSaveBtn: {
    flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#059669',
  },
  modalSaveBtnText: { color: '#fff', fontWeight: '700' },
});