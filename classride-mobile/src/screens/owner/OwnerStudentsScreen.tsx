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
} from 'react-native';
import api from '../../services/api';

export default function OwnerStudentsScreen({ route }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'requests'>(
    route?.params?.tab === 'requests' ? 'requests' : 'students'
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (route?.params?.tab === 'requests') {
      setActiveTab('requests');
    }
  }, [route?.params?.tab]);

  const fetchData = async () => {
    try {
      const [studentsRes, requestsRes] = await Promise.all([
        api.get('/students'),
        api.get('/students/join-requests'),
      ]);
      setStudents(studentsRes.data);
      setJoinRequests(requestsRes.data);
    } catch (error) {
      console.log('Error fetching students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddStudent = async () => {
    if (!phoneNumber || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/students', { phoneNumber, fullName });
      setModalVisible(false);
      setPhoneNumber('');
      setFullName('');
      fetchData();
      Alert.alert(
        '✅ Student Added!',
        `Password: ${response.data.generatedPassword}\n\nShare this with the student.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (phone: string) => {
    Alert.alert('Remove Student', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/students/${phone}`);
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to remove student');
          }
        },
      },
    ]);
  };

  const handleAccept = async (studentPhone: string) => {
    try {
      await api.post('/students/join-requests/accept', { studentPhone });
      Alert.alert('✅ Accepted!', 'Student has been added to your bus.');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async (studentPhone: string) => {
    try {
      await api.post('/students/join-requests/reject', { studentPhone });
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎓 Students</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.activeTab]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
            Students ({students.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({joinRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        contentContainerStyle={styles.list}
      >
        {activeTab === 'students' ? (
          students.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎓</Text>
              <Text style={styles.emptyText}>No students yet</Text>
            </View>
          ) : (
            students.map((s: any) => (
              <View key={s.phoneNumber} style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{s.user?.fullName}</Text>
                  <Text style={styles.cardPhone}>📱 {s.phoneNumber}</Text>
                  {s.homeAddress && (
                    <Text style={styles.cardDetail}>🏠 {s.homeAddress}</Text>
                  )}
                  {s.destination && (
                    <Text style={styles.cardDetail}>📍 {s.destination?.name}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveStudent(s.phoneNumber)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          joinRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📥</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            joinRequests.map((req: any) => (
              <View key={req.reqId} style={styles.requestCard}>
                <Text style={styles.cardName}>{req.user?.fullName}</Text>
                <Text style={styles.cardPhone}>📱 {req.userPhone}</Text>

                {req.student?.homeAddress && (
                  <Text style={styles.cardDetail}>🏠 {req.student.homeAddress}</Text>
                )}
                {req.student?.destination?.name && (
                  <Text style={styles.cardDetail}>🎓 {req.student.destination.name}</Text>
                )}

                {req.schedule?.length > 0 && (
                  <View style={styles.scheduleSection}>
                    <Text style={styles.scheduleTitle}>📅 Schedule:</Text>
                    <View style={styles.scheduleDays}>
                      {req.schedule.map((s: any) => (
                        <View key={s.dayOfWeek} style={styles.scheduleDay}>
                          <Text style={styles.scheduleDayName}>
                            {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][s.dayOfWeek]}
                          </Text>
                          <Text style={styles.scheduleDayTime}>🌅 {s.morningTime}</Text>
                          <Text style={styles.scheduleDayTime}>🌆 {s.returnTime}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.requestButtons}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(req.userPhone)}
                  >
                    <Text style={styles.acceptBtnText}>✅ Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(req.userPhone)}
                  >
                    <Text style={styles.rejectBtnText}>❌ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Add Student Modal */}
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
                <Text style={styles.modalTitle}>Add Student</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sara Hassan"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 70111222"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleAddStudent}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Add Student</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#2563EB',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2563EB' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  activeTabText: { color: '#2563EB', fontWeight: '700' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  cardPhone: { fontSize: 14, color: '#64748B', marginTop: 4 },
  cardDetail: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#DEF7EC',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: { color: '#065F46', fontWeight: '600' },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBtnText: { color: '#991B1B', fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
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
    backgroundColor: '#2563EB',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  scheduleSection: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  scheduleDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleDay: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 70,
    alignItems: 'center',
  },
  scheduleDayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  scheduleDayTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});