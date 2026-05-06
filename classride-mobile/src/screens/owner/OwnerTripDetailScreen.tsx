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
  Modal,
} from 'react-native';
import api from '../../services/api';

export default function OwnerTripDetailScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
const [suggestedStudents, setSuggestedStudents] = useState<any[]>([]);
  const [otherStudents, setOtherStudents] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [tripRes, suggestedRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/suggested-students`),
      ]);
      setTrip(tripRes.data);
      setSuggestedStudents(suggestedRes.data.suggested ?? []);
      setOtherStudents(suggestedRes.data.others ?? []);
    } catch (error) {
      console.log('Error fetching trip detail:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssign = async (studentPhone: string) => {
    setAssigning(true);
    try {
      await api.post(`/trips/${tripId}/assign`, { studentPhone });
      setAssignModalVisible(false);
      fetchData();
      Alert.alert('✅ Student assigned!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (studentPhone: string, studentName: string) => {
    Alert.alert(
      'Unassign Student',
      `Remove ${studentName} from this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/trips/${tripId}/assign/${studentPhone}`);
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to unassign');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return { bg: '#DEF7EC', text: '#065F46' };
    if (status === 'completed') return { bg: '#E5E7EB', text: '#374151' };
    return { bg: '#DBEAFE', text: '#1D4ED8' };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const colors = getStatusColor(trip?.status);
  const isScheduled = trip?.status === 'scheduled';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        contentContainerStyle={styles.content}
      >
        {/* Trip Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.destination}>📍 {trip?.destination?.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {trip?.status}
              </Text>
            </View>
          </View>
          <Text style={styles.infoText}>
            {trip?.type === 'morning' ? '🌅 Morning' : '🌆 Return'}
          </Text>
          <Text style={styles.infoText}>
            🗓️ {new Date(trip?.date).toLocaleDateString()}
          </Text>
          <Text style={styles.infoText}>⏰ Pickup: {trip?.pickupTime}</Text>
          <Text style={styles.infoText}>🚌 {trip?.bus?.busName}</Text>
          <Text style={styles.infoText}>👨‍✈️ {trip?.driver?.fullName}</Text>
        </View>

        {/* Students Section */}
        <View style={styles.studentsCard}>
          <View style={styles.studentsHeader}>
            <Text style={styles.studentsTitle}>
              👥 Students ({trip?.assignments?.length ?? 0})
            </Text>
            {isScheduled && (
              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => setAssignModalVisible(true)}
              >
                <Text style={styles.assignBtnText}>+ Assign</Text>
              </TouchableOpacity>
            )}
          </View>

          {trip?.assignments?.length === 0 ? (
            <View style={styles.emptyStudents}>
              <Text style={styles.emptyStudentsText}>No students assigned yet</Text>
              {isScheduled && (
                <TouchableOpacity
                  style={styles.assignBtnLarge}
                  onPress={() => setAssignModalVisible(true)}
                >
                  <Text style={styles.assignBtnLargeText}>+ Assign Students</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            trip?.assignments?.map((a: any) => {
              const payment = trip?.payments?.find(
                (p: any) => p.studentPhone === a.studentPhone
              );
              return (
                <View key={a.studentPhone} style={styles.studentRow}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      👤 {a.student?.user?.fullName}
                    </Text>
                    {a.student?.homeAddress && (
                      <Text style={styles.studentAddress}>
                        🏠 {a.student.homeAddress}
                      </Text>
                    )}
                    {payment && (
                      <Text style={styles.paymentBadge}>
                        💰 {payment.amountPaid?.toLocaleString()} LBP
                      </Text>
                    )}
                    {a.student?.balances?.[0] && (
                      <Text style={[
                        styles.balanceBadge,
                        { color: a.student.balances[0].balance < 0 ? '#DC2626' : '#059669' }
                      ]}>
                        Balance: {a.student.balances[0].balance?.toLocaleString()} LBP
                      </Text>
                    )}
                  </View>
                  {isScheduled && (
                    <TouchableOpacity
                      style={styles.unassignBtn}
                      onPress={() => handleUnassign(
                        a.studentPhone,
                        a.student?.user?.fullName
                      )}
                    >
                      <Text style={styles.unassignBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Assign Student Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Student</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

           {suggestedStudents.length === 0 && otherStudents.length === 0 ? (
              <Text style={styles.noStudentsText}>
                All students are already assigned to this trip
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 500 }}>
                {/* Suggested Students */}
                {suggestedStudents.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>
                      ✅ Suggested ({suggestedStudents.length})
                    </Text>
                    {suggestedStudents.map((s: any) => (
                      <TouchableOpacity
                        key={s.phoneNumber}
                        style={[styles.studentOption, styles.studentOptionSuggested]}
                        onPress={() => handleAssign(s.phoneNumber)}
                        disabled={assigning}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentOptionName}>
                            👤 {s.fullName}
                          </Text>
                          {s.homeAddress && (
                            <Text style={styles.studentOptionAddress}>
                              🏠 {s.homeAddress}
                            </Text>
                          )}
                          <Text style={styles.matchReason}>{s.matchReason}</Text>
                        </View>
                        <Text style={styles.studentOptionArrow}>+</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Other Students */}
                {otherStudents.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                      👥 Others ({otherStudents.length})
                    </Text>
                    {otherStudents.map((s: any) => (
                      <TouchableOpacity
                        key={s.phoneNumber}
                        style={styles.studentOption}
                        onPress={() => handleAssign(s.phoneNumber)}
                        disabled={assigning}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentOptionName}>
                            👤 {s.fullName}
                          </Text>
                          {s.homeAddress && (
                            <Text style={styles.studentOptionAddress}>
                              🏠 {s.homeAddress}
                            </Text>
                          )}
                          <Text style={styles.matchReason}>{s.matchReason}</Text>
                        </View>
                        <Text style={styles.studentOptionArrow}>+</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
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
  backBtn: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16 },
  infoCard: {
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
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destination: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  infoText: { fontSize: 14, color: '#64748B', marginTop: 6 },
  studentsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentsTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  assignBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyStudents: { alignItems: 'center', paddingVertical: 24 },
  emptyStudentsText: { color: '#94A3B8', fontSize: 14, marginBottom: 16 },
  assignBtnLarge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  assignBtnLargeText: { color: '#fff', fontWeight: '700' },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  studentAddress: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  paymentBadge: { fontSize: 12, color: '#059669', marginTop: 4, fontWeight: '600' },
  balanceBadge: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  unassignBtn: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  unassignBtnText: { color: '#DC2626', fontWeight: '700' },
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  closeBtn: { fontSize: 18, color: '#64748B', padding: 4 },
  noStudentsText: { color: '#94A3B8', textAlign: 'center', padding: 24 },
  studentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentOptionName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  studentOptionAddress: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  studentOptionArrow: {
    fontSize: 20,
    color: '#2563EB',
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  studentOptionSuggested: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  matchReason: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
});