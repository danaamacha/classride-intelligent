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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DriverTripsScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pricePerTrip, setPricePerTrip] = useState(0);

  // Payment modal state
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [payingStudent, setPayingStudent] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, activeRes, unreadRes, priceRes] = await Promise.all([
        api.get('/driver/trips'),
        api.get('/driver/trips/active'),
        api.get('/notifications/unread/count'),
        api.get('/payments/price'),
      ]);
      setTrips(tripsRes.data.filter((t: any) => t.status === 'scheduled'));
      setActiveTrip(activeRes.data?.tripId ? activeRes.data : null);
      setUnreadCount(unreadRes.data.count);
      setPricePerTrip(priceRes.data.pricePerTrip ?? 300000);
    } catch (error) {
      console.log('Error fetching driver data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleActivate = async (tripId: number) => {
    Alert.alert('Start Trip', 'Are you sure you want to start this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start 🚀',
        onPress: async () => {
          try {
            await api.put(`/driver/trips/${tripId}/activate`);
            Alert.alert('✅ Trip Started!', 'Trip is now active.');
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to start trip');
          }
        },
      },
    ]);
  };

  const handleComplete = async (tripId: number) => {
    Alert.alert('Complete Trip', 'Are you sure you want to complete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete ✓',
        onPress: async () => {
          try {
            await api.put(`/driver/trips/${tripId}/complete`);
            Alert.alert('✅ Trip Completed!');
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to complete trip');
          }
        },
      },
    ]);
  };

  // ─── Record payment via wallet system ───
  const handlePayment = async (
    tripId: number,
    studentPhone: string,
    amountPaid: number,
    note?: string,
  ) => {
    setPayingStudent(studentPhone);
    try {
      const res = await api.post('/payments/record', {
        tripId,
        studentPhone,
        amountPaid,
        note,
      });
      const balance = res.data.balance;
      const balanceText = balance >= 0
        ? `Balance: +${balance.toLocaleString()} LBP 🟡`
        : `Balance: ${balance.toLocaleString()} LBP 🔴`;
      Alert.alert('✅ Recorded!', balanceText);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record payment');
    } finally {
      setPayingStudent(null);
    }
  };

  const handleCustomPayment = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setCustomModalVisible(false);
    setCustomAmount('');
    if (selectedTripId && selectedStudent) {
      await handlePayment(selectedTripId, selectedStudent.phoneNumber, amount, 'Custom amount');
    }
  };

  const openCustomModal = (tripId: number, student: any) => {
    setSelectedTripId(tripId);
    setSelectedStudent(student);
    setCustomAmount('');
    setCustomModalVisible(true);
  };

  const getPaymentStatus = (payments: any[], studentPhone: string) => {
    return payments?.find((p: any) => p.studentPhone === studentPhone);
  };

  const renderPaymentButtons = (tripId: number, student: any, payments: any[]) => {
    const payment = getPaymentStatus(payments, student.studentPhone ?? student.phoneNumber);
    const isProcessing = payingStudent === (student.studentPhone ?? student.phoneNumber);
    const studentPhone = student.studentPhone ?? student.phoneNumber;
    const doublePrice = pricePerTrip * 2;

    if (isProcessing) {
      return <ActivityIndicator size="small" color="#7C3AED" />;
    }

    if (payment?.amountPaid > 0) {
      return (
        <View style={styles.paidBadge}>
          <Text style={styles.paidBadgeText}>
            ✅ {payment.amountPaid.toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.editPayBtn}
            onPress={() => openCustomModal(tripId, { phoneNumber: studentPhone, ...student })}
          >
            <Text style={styles.editPayBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (payment && payment.amountPaid === 0) {
      return (
        <View style={styles.laterBadge}>
          <Text style={styles.laterBadgeText}>⏰ Later</Text>
          <TouchableOpacity
            style={styles.editPayBtn}
            onPress={() => openCustomModal(tripId, { phoneNumber: studentPhone, ...student })}
          >
            <Text style={styles.editPayBtnText}>💰</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.payBtnsRow}>
        <TouchableOpacity
          style={styles.payAmountBtn}
          onPress={() => handlePayment(tripId, studentPhone, pricePerTrip, 'Single trip')}
        >
          <Text style={styles.payAmountBtnText}>
            {(pricePerTrip / 1000).toFixed(0)}k
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.payAmountBtn, styles.payAmountBtnDouble]}
          onPress={() => handlePayment(tripId, studentPhone, doublePrice, 'Both trips')}
        >
          <Text style={styles.payAmountBtnText}>
            {(doublePrice / 1000).toFixed(0)}k
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payCustomBtn}
          onPress={() => openCustomModal(tripId, { phoneNumber: studentPhone, ...student })}
        >
          <Text style={styles.payCustomBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payLaterBtn}
          onPress={() => handlePayment(tripId, studentPhone, 0, 'Will pay later')}
        >
          <Text style={styles.payLaterBtnText}>⏰</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Driver Dashboard 🚌</Text>
            <Text style={styles.driverName}>{user?.fullName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.getParent()?.navigate('Notifications')}
            >
              <Text style={styles.notifBtnText}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Trip */}
        {activeTrip && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🟢 Active Trip</Text>
            <View style={styles.activeTripCard}>
              <View style={styles.activeTripHeader}>
                <Text style={styles.activeTripDestination}>
                  📍 {activeTrip.destination?.name}
                </Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.tripInfo}>🚌 {activeTrip.bus?.busName}</Text>
              <Text style={styles.tripInfo}>⏰ {activeTrip.pickupTime}</Text>
              <Text style={styles.tripInfo}>
                {activeTrip.type === 'morning' ? '🌅 Morning' : '🌆 Return'} •
                🗓️ {new Date(activeTrip.date).toLocaleDateString()}
              </Text>

              {/* Payment legend */}
              <View style={styles.legendRow}>
                <Text style={styles.legendText}>
                  💡 {(pricePerTrip / 1000).toFixed(0)}k = 1 trip •
                  {((pricePerTrip * 2) / 1000).toFixed(0)}k = both trips
                </Text>
              </View>

              {/* Students List */}
              <View style={styles.studentsSection}>
                <Text style={styles.studentsTitle}>
                  👥 Students ({activeTrip.assignments?.length || 0})
                </Text>
                {activeTrip.assignments?.map((a: any) => (
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
                    </View>
                    {renderPaymentButtons(
                      activeTrip.tripId,
                      { phoneNumber: a.studentPhone, ...a.student },
                      activeTrip.payments ?? [],
                    )}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => handleComplete(activeTrip.tripId)}
              >
                <Text style={styles.completeBtnText}>Complete Trip ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scheduled Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Scheduled Trips</Text>
          {trips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyText}>No scheduled trips</Text>
              <Text style={styles.emptySubtext}>
                Your owner will assign trips to you
              </Text>
            </View>
          ) : (
            trips.map((trip: any) => (
              <View key={trip.tripId} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripDestination}>
                    📍 {trip.destination?.name}
                  </Text>
                  <Text style={styles.tripType}>
                    {trip.type === 'morning' ? '🌅' : '🌆'}
                  </Text>
                </View>
                <Text style={styles.tripInfo}>
                  🗓️ {new Date(trip.date).toLocaleDateString()}
                </Text>
                <Text style={styles.tripInfo}>⏰ Pickup: {trip.pickupTime}</Text>
                <Text style={styles.tripInfo}>🚌 {trip.bus?.busName}</Text>

                <View style={styles.studentPreview}>
                  <Text style={styles.studentPreviewText}>
                    👥 {trip.assignments?.length || 0} students assigned
                  </Text>
                </View>

                {trip.assignments?.length > 0 && (
                  <View style={styles.studentsSection}>
                    {trip.assignments.map((a: any) => (
                      <View key={a.studentPhone} style={styles.studentRowSimple}>
                        <Text style={styles.studentName}>
                          👤 {a.student?.user?.fullName}
                        </Text>
                        {a.student?.homeAddress && (
                          <Text style={styles.studentAddress}>
                            🏠 {a.student.homeAddress}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => handleActivate(trip.tripId)}
                >
                  <Text style={styles.startBtnText}>Start Trip 🚀</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Custom Amount Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              💰 {selectedStudent?.user?.fullName ?? 'Student'}
            </Text>
            <Text style={styles.modalSubtitle}>Enter amount received (LBP)</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 450000"
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
              autoFocus
            />

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {[pricePerTrip, pricePerTrip * 2, pricePerTrip * 3].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickAmountBtn}
                  onPress={() => setCustomAmount(String(amt))}
                >
                  <Text style={styles.quickAmountBtnText}>
                    {(amt / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCustomPayment}
              >
                <Text style={styles.confirmBtnText}>Confirm ✅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
    backgroundColor: '#7C3AED',
  },
  greeting: { color: '#DDD6FE', fontSize: 14 },
  driverName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 14 },
  notifBtn: { position: 'relative', padding: 8 },
  notifBtnText: { fontSize: 24 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  activeTripCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  activeTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTripDestination: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  activeBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  legendRow: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  legendText: { color: '#5B21B6', fontSize: 12, fontWeight: '500' },
  tripCard: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripDestination: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  tripType: { fontSize: 20 },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  studentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  studentsTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentRowSimple: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  studentAddress: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  studentPreview: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  studentPreviewText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  // Payment buttons
  payBtnsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  payAmountBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payAmountBtnDouble: { backgroundColor: '#059669' },
  payAmountBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  payCustomBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payCustomBtnText: { fontSize: 12 },
  payLaterBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payLaterBtnText: { fontSize: 12 },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  paidBadgeText: { color: '#065F46', fontSize: 12, fontWeight: '700' },
  laterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  laterBadgeText: { color: '#92400E', fontSize: 12, fontWeight: '600' },
  editPayBtn: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editPayBtnText: { fontSize: 11 },

  // Action buttons
  completeBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  completeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  startBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },

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
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickAmountBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  quickAmountBtnText: { color: '#7C3AED', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#7C3AED',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});