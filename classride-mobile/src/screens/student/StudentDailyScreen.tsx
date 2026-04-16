import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

const DAY_NAMES: { [key: number]: string } = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday',
  3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

export default function StudentDailyScreen() {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [showPicker, setShowPicker] = useState<{
    date: string;
    field: 'morning' | 'return';
  } | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/students/my/attendance');
      setAttendance(response.data);
    } catch (error) {
      console.log('Error fetching attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleAttendance = async (
    date: string,
    field: 'attendanceMorning' | 'attendanceReturn',
    currentValue: boolean,
    otherValue: boolean
  ) => {
    const newValue = !currentValue;
    if (!newValue) {
      Alert.alert(
        'Mark Absent',
        `Mark yourself absent for ${field === 'attendanceMorning' ? 'morning' : 'return'} on ${date}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => saveAttendance(date, field, newValue, otherValue),
          },
        ]
      );
    } else {
      saveAttendance(date, field, newValue, otherValue);
    }
  };

  const saveAttendance = async (
    date: string,
    field: 'attendanceMorning' | 'attendanceReturn',
    newValue: boolean,
    otherValue: boolean
  ) => {
    setUpdating(`${date}-${field}`);
    try {
      await api.put('/students/my/attendance', {
        date,
        attendanceMorning: field === 'attendanceMorning' ? newValue : otherValue,
        attendanceReturn: field === 'attendanceReturn' ? newValue : otherValue,
      });
      await fetchAttendance();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const handleTimePress = (date: string, field: 'morning' | 'return', timeStr: string) => {
    const [hours, minutes] = (timeStr || '07:00').split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    setTempTime(d);
    setShowPicker({ date, field });
    setPickerModalVisible(true);
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) setTempTime(selectedDate);
  };

  const handleTimeSave = async () => {
    if (!showPicker) return;
    const hours = tempTime.getHours().toString().padStart(2, '0');
    const minutes = tempTime.getMinutes().toString().padStart(2, '0');
    const newTime = `${hours}:${minutes}`;
    const { date, field } = showPicker;

    setPickerModalVisible(false);
    setUpdating(`${date}-time-${field}`);

    try {
      const day = date === attendance?.today?.date ? attendance.today : attendance.tomorrow;
      await api.put('/students/my/attendance', {
        date,
        attendanceMorning: day.attendanceMorning,
        attendanceReturn: day.attendanceReturn,
        overrideMorningTime: field === 'morning' ? newTime : day.morningTime,
        overrideReturnTime: field === 'return' ? newTime : day.returnTime,
      });
      await fetchAttendance();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update time');
    } finally {
      setUpdating(null);
      setShowPicker(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const renderDayCard = (day: any, label: string) => {
    if (!day) return null;
    const dayName = DAY_NAMES[new Date(day.date).getDay()];
    const hasSchedule = day.morningTime || day.returnTime;

    return (
      <View style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayLabel}>{label}</Text>
            <Text style={styles.dayName}>{dayName}, {day.date}</Text>
          </View>
          {day.source === 'override' && (
            <View style={styles.overrideBadge}>
              <Text style={styles.overrideBadgeText}>Modified</Text>
            </View>
          )}
        </View>

        {!hasSchedule ? (
          <View style={styles.noSchedule}>
            <Text style={styles.noScheduleText}>No schedule set for this day</Text>
            <Text style={styles.noScheduleSubtext}>Set your weekly schedule first</Text>
          </View>
        ) : (
          <>
            {day.morningTime && (
              <View style={styles.tripRow}>
                <View style={styles.tripLeft}>
                  <Text style={styles.tripType}>🌅 Morning</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => handleTimePress(day.date, 'morning', day.morningTime)}
                  >
                    {updating === `${day.date}-time-morning` ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <>
                        <Text style={styles.timeText}>{day.morningTime}</Text>
                        <Text style={styles.timeTapHint}>tap to change</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.toggleCol}>
                  {updating === `${day.date}-attendanceMorning` ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <Switch
                      value={day.attendanceMorning}
                      onValueChange={() =>
                        handleToggleAttendance(
                          day.date, 'attendanceMorning',
                          day.attendanceMorning, day.attendanceReturn
                        )
                      }
                      trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                      thumbColor={day.attendanceMorning ? '#059669' : '#94A3B8'}
                    />
                  )}
                  <Text style={[styles.toggleLabel, { color: day.attendanceMorning ? '#059669' : '#DC2626' }]}>
                    {day.attendanceMorning ? 'Going' : 'Absent'}
                  </Text>
                </View>
              </View>
            )}

            {day.returnTime && (
              <View style={[styles.tripRow, styles.tripRowBorder]}>
                <View style={styles.tripLeft}>
                  <Text style={styles.tripType}>🌆 Return</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => handleTimePress(day.date, 'return', day.returnTime)}
                  >
                    {updating === `${day.date}-time-return` ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <>
                        <Text style={styles.timeText}>{day.returnTime}</Text>
                        <Text style={styles.timeTapHint}>tap to change</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.toggleCol}>
                  {updating === `${day.date}-attendanceReturn` ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <Switch
                      value={day.attendanceReturn}
                      onValueChange={() =>
                        handleToggleAttendance(
                          day.date, 'attendanceReturn',
                          day.attendanceReturn, day.attendanceMorning
                        )
                      }
                      trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                      thumbColor={day.attendanceReturn ? '#059669' : '#94A3B8'}
                    />
                  )}
                  <Text style={[styles.toggleLabel, { color: day.attendanceReturn ? '#059669' : '#DC2626' }]}>
                    {day.attendanceReturn ? 'Going' : 'Absent'}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAttendance} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Daily Attendance</Text>
        <Text style={styles.headerSubtitle}>Override today & tomorrow attendance or times</Text>
      </View>

      <View style={styles.content}>
        {renderDayCard(attendance?.today, 'Today')}
        {renderDayCard(attendance?.tomorrow, 'Tomorrow')}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Toggle to mark absent — you'll be removed from your trip and owner notified.{'\n\n'}
            Tap the time to change it for this date only.
          </Text>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {showPicker?.field === 'morning' ? '🌅 Morning Time' : '🌆 Return Time'}
              </Text>
              <TouchableOpacity onPress={handleTimeSave}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
          <DateTimePicker
  value={tempTime}
  mode="time"
  is24Hour={true}
  display="spinner"
  onChange={handleTimeChange}
  style={styles.picker}
  textColor="#1E293B"
  themeVariant="light"
/>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#059669' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#A7F3D0', fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  dayName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 2 },
  overrideBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  overrideBadgeText: { color: '#D97706', fontSize: 11, fontWeight: '600' },
  noSchedule: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, alignItems: 'center' },
  noScheduleText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  noScheduleSubtext: { color: '#CBD5E1', fontSize: 12, marginTop: 4 },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tripRowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  tripLeft: { flex: 1 },
  tripType: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  timeBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignSelf: 'flex-start',
  },
  timeText: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
  timeTapHint: { fontSize: 10, color: '#93C5FD', marginTop: 2 },
  toggleCol: { alignItems: 'center', gap: 4, marginLeft: 12 },
  toggleLabel: { fontSize: 11, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  infoText: { color: '#065F46', fontSize: 13, lineHeight: 20 },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  pickerCancel: { fontSize: 16, color: '#64748B' },
  pickerDone: { fontSize: 16, color: '#059669', fontWeight: '700' },
  picker: { height: 200 },
});