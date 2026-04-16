import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
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

export default function StudentJoinRequestScreen({ navigation }: any) {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [homeAddress, setHomeAddress] = useState('');
  const [university, setUniversity] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [morningTime, setMorningTime] = useState('07:00');
  const [returnTime, setReturnTime] = useState('17:00');

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await api.get('/owner/list');
      setOwners(response.data);
    } catch (error) {
      console.log('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleOwnerTap = (owner: any) => {
    setSelectedOwner(owner);
    setModalVisible(true);
  };

  const handleSendRequest = async () => {
    if (!homeAddress.trim()) {
      Alert.alert('Error', 'Please enter your home address');
      return;
    }
    if (!university.trim()) {
      Alert.alert('Error', 'Please enter your university');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setSending(true);
    try {
      await api.post('/students/join-request', {
        ownerPhone: selectedOwner.phoneNumber,
        homeAddress,
        university,
        schedule: selectedDays.map(day => ({
          day_of_week: day,
          morning_time: morningTime,
          return_time: returnTime,
        })),
      });

      setModalVisible(false);
      Alert.alert(
        '✅ Request Sent!',
        `Your join request has been sent to ${selectedOwner.user?.fullName}. They will review your details shortly.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const filteredOwners = owners.filter((o: any) =>
    o.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    o.phoneNumber?.includes(search) ||
    o.homeTown?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Bus 🚌</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by name, phone or area..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Owners List */}
      <ScrollView contentContainerStyle={styles.list}>
        {filteredOwners.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyText}>No bus owners found</Text>
          </View>
        ) : (
          filteredOwners.map((owner: any) => (
            <TouchableOpacity
              key={owner.phoneNumber}
              style={styles.ownerCard}
              onPress={() => handleOwnerTap(owner)}
            >
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.user?.fullName}</Text>
                <Text style={styles.ownerPhone}>📱 {owner.phoneNumber}</Text>
                {owner.homeTown && (
                  <Text style={styles.ownerTown}>📍 {owner.homeTown}</Text>
                )}
              </View>
              <View style={styles.requestBtnSmall}>
                <Text style={styles.requestBtnSmallText}>Request →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Join Request Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <ScrollView>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Join {selectedOwner?.user?.fullName}'s Bus
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Fill in your details so the owner can review your request
                  </Text>

                  {/* Home Address */}
                  <Text style={styles.label}>📍 Home Address</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="e.g. Hamra Street, near ABC building"
                    value={homeAddress}
                    onChangeText={setHomeAddress}
                    multiline
                    numberOfLines={2}
                  />

                  {/* University */}
                  <Text style={styles.label}>🎓 University / Destination</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. AUB, LAU, USJ..."
                    value={university}
                    onChangeText={setUniversity}
                  />

                  {/* Days */}
                  <Text style={styles.label}>📅 Days You Need the Bus</Text>
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
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  {/* Buttons */}
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
                      style={styles.sendBtn}
                      onPress={handleSendRequest}
                      disabled={sending}
                    >
                      {sending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.sendBtnText}>Send Request 🚀</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
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
    backgroundColor: '#059669',
  },
  backBtn: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchContainer: { padding: 16 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  list: { padding: 16, paddingTop: 0 },
  ownerCard: {
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
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  ownerPhone: { fontSize: 14, color: '#64748B', marginTop: 4 },
  ownerTown: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  requestBtnSmall: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestBtnSmallText: { color: '#059669', fontWeight: '700', fontSize: 13 },
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
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
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
  multilineInput: { height: 70, textAlignVertical: 'top' },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  dayBtnActive: { backgroundColor: '#059669', borderColor: '#059669' },
  dayBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  dayBtnTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  sendBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  sendBtnText: { color: '#fff', fontWeight: '700' },
});