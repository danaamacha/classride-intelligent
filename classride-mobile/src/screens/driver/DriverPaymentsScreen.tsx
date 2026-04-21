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
import api from '../../services/api';

export default function DriverPaymentsScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pricePerTrip, setPricePerTrip] = useState(0);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paying, setPaying] = useState(false);

  // History modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [history, setHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, priceRes] = await Promise.all([
        api.get('/payments/students'),
        api.get('/payments/price'),
      ]);
      setStudents(studentsRes.data);
      setPricePerTrip(priceRes.data.pricePerTrip ?? 300000);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openPaymentModal = (student: any) => {
    setSelectedStudent(student);
    setCustomAmount('');
    setModalVisible(true);
  };

  const handlePayment = async (amount: number) => {
    if (!selectedStudent) return;
    setPaying(true);
    try {
      const res = await api.post('/payments/record', {
        tripId: null,
        studentPhone: selectedStudent.phoneNumber,
        amountPaid: amount,
        note: 'Payment added from Payments tab',
      });
      setModalVisible(false);
      const balance = res.data.balance;
      const balanceText = balance >= 0
        ? `New balance: +${balance.toLocaleString()} LBP 🟡`
        : `New balance: ${balance.toLocaleString()} LBP 🔴`;
      Alert.alert('✅ Payment Recorded!', balanceText);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record');
    } finally {
      setPaying(false);
    }
  };

  const handleCustomPayment = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    await handlePayment(amount);
  };

  const openHistory = async (student: any) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    setHistoryModalVisible(true);
    try {
      const res = await api.get(`/payments/student/${student.phoneNumber}`);
      setHistory(res.data);
    } catch (error) {
      console.log('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getBalanceStyle = (balance: number) => {
    if (balance > 0) return { color: '#D97706', bg: '#FEF3C7' }; // credit
    if (balance < 0) return { color: '#DC2626', bg: '#FEE2E2' }; // owes
    return { color: '#059669', bg: '#DCFCE7' }; // settled
  };

  const getBalanceLabel = (balance: number) => {
    if (balance > 0) return `+${balance.toLocaleString()} 🟡`;
    if (balance < 0) return `${balance.toLocaleString()} 🔴`;
    return '0 ✅';
  };

  // Split students into owes + settled
  const owesStudents = students.filter(s => s.balance < 0);
  const settledStudents = students.filter(s => s.balance >= 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const renderStudent = (student: any) => {
    const { color, bg } = getBalanceStyle(student.balance);
    return (
      <View key={student.phoneNumber} style={styles.studentCard}>
        <TouchableOpacity
          style={styles.studentMain}
          onPress={() => openHistory(student)}
        >
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>👤 {student.fullName}</Text>
            {student.homeAddress && (
              <Text style={styles.studentAddress}>🏠 {student.homeAddress}</Text>
            )}
            {student.destination && (
              <Text style={styles.studentDest}>🎓 {student.destination}</Text>
            )}
          </View>
          <View style={[styles.balanceBadge, { backgroundColor: bg }]}>
            <Text style={[styles.balanceText, { color }]}>
              {getBalanceLabel(student.balance)}
            </Text>
            <Text style={styles.balanceCurrency}>LBP</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addPayBtn}
          onPress={() => openPaymentModal(student)}
        >
          <Text style={styles.addPayBtnText}>+ Add Payment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💰 Student Payments</Text>
          <Text style={styles.headerSubtitle}>
            Tap a student to view history • Tap + to add payment
          </Text>
        </View>

        <View style={styles.content}>
          {/* Owes section */}
          {owesStudents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                ⚠️ Owes Payment ({owesStudents.length})
              </Text>
              {owesStudents.map(renderStudent)}
            </>
          )}

          {/* Settled section */}
          {settledStudents.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                ✅ Settled ({settledStudents.length})
              </Text>
              {settledStudents.map(renderStudent)}
            </>
          )}

          {students.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No students yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              💰 {selectedStudent?.fullName}
            </Text>
            <View style={[
              styles.modalBalance,
              { backgroundColor: getBalanceStyle(selectedStudent?.balance ?? 0).bg }
            ]}>
              <Text style={[
                styles.modalBalanceText,
                { color: getBalanceStyle(selectedStudent?.balance ?? 0).color }
              ]}>
                Current Balance: {getBalanceLabel(selectedStudent?.balance ?? 0)} LBP
              </Text>
            </View>

            <Text style={styles.label}>Amount Received (LBP)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 600000"
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
              autoFocus
            />

            {/* Quick amounts */}
            <Text style={styles.quickLabel}>Quick amounts:</Text>
            <View style={styles.quickAmounts}>
              {[
                pricePerTrip,
                pricePerTrip * 2,
                pricePerTrip * 3,
                pricePerTrip * 4,
              ].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickBtn}
                  onPress={() => setCustomAmount(String(amt))}
                >
                  <Text style={styles.quickBtnText}>
                    {(amt / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCustomPayment}
                disabled={paying}
              >
                {paying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm ✅</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.historyHeader}>
              <Text style={styles.modalTitle}>
                📋 {selectedStudent?.fullName}
              </Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <ActivityIndicator color="#7C3AED" style={{ marginVertical: 24 }} />
            ) : (
              <>
                {/* Balance summary */}
                <View style={[
                  styles.modalBalance,
                  { backgroundColor: getBalanceStyle(history?.balance ?? 0).bg }
                ]}>
                  <Text style={[
                    styles.modalBalanceText,
                    { color: getBalanceStyle(history?.balance ?? 0).color }
                  ]}>
                    Balance: {getBalanceLabel(history?.balance ?? 0)} LBP
                  </Text>
                </View>

                {/* Transactions */}
                <ScrollView style={styles.transactionsList}>
                  {history?.transactions?.length === 0 && (
                    <Text style={styles.noTransactions}>No transactions yet</Text>
                  )}
                  {history?.transactions?.map((tx: any, i: number) => (
                    <View key={i} style={styles.txRow}>
                      <View style={styles.txLeft}>
                        <Text style={styles.txType}>
                          {tx.type === 'PAYMENT' ? '💵 Payment' : '🚌 Trip Deduction'}
                        </Text>
                        {tx.trip && (
                          <Text style={styles.txTrip}>
                            {tx.trip.type === 'morning' ? '🌅' : '🌆'} {tx.trip.destination?.name} •
                            {new Date(tx.trip.date).toLocaleDateString()}
                          </Text>
                        )}
                        <Text style={styles.txDate}>
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {tx.note && (
                          <Text style={styles.txNote}>{tx.note}</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.txAmount,
                        { color: tx.amount >= 0 ? '#059669' : '#DC2626' }
                      ]}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Add payment from history */}
                <TouchableOpacity
                  style={styles.addFromHistoryBtn}
                  onPress={() => {
                    setHistoryModalVisible(false);
                    setTimeout(() => openPaymentModal(selectedStudent), 300);
                  }}
                >
                  <Text style={styles.addFromHistoryBtnText}>+ Add Payment</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#7C3AED',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#DDD6FE', fontSize: 12, marginTop: 4 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  studentAddress: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  studentDest: { fontSize: 12, color: '#64748B', marginTop: 2 },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  balanceText: { fontSize: 14, fontWeight: '700' },
  balanceCurrency: { fontSize: 10, color: '#94A3B8' },
  addPayBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  addPayBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },

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
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  modalBalance: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  modalBalanceText: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
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
  quickLabel: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  quickBtnText: { color: '#7C3AED', fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#F1F5F9',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  confirmBtn: {
    flex: 2, padding: 14, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#7C3AED',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },

  // History modal
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: { fontSize: 18, color: '#64748B', padding: 4 },
  transactionsList: { maxHeight: 300, marginBottom: 16 },
  noTransactions: { color: '#94A3B8', textAlign: 'center', padding: 24 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txLeft: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  txTrip: { fontSize: 12, color: '#64748B', marginTop: 2 },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txNote: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  addFromHistoryBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  addFromHistoryBtnText: { color: '#fff', fontWeight: '700' },
});