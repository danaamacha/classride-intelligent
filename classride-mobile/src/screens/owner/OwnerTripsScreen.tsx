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
} from 'react-native';
import api from '../../services/api';

export default function OwnerTripsScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [date, setDate] = useState('');
  const [tripType, setTripType] = useState<'morning' | 'return'>('morning');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, busesRes, driversRes, destinationsRes] = await Promise.all([
        api.get('/trips'),
        api.get('/buses'),
        api.get('/driver'),
        api.get('/destinations'),
      ]);
      setTrips(tripsRes.data);
      setBuses(busesRes.data);
      setDrivers(driversRes.data);
      setDestinations(destinationsRes.data);
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateTrip = async () => {
    if (!selectedBus || !selectedDriver || !selectedDestination || !pickupTime || !date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      await api.post('/trips', {
        busId: parseInt(selectedBus),
        driverPhone: selectedDriver,
        destinationId: parseInt(selectedDestination),
        pickupTime,
        type: tripType,
        date,
      });
      setModalVisible(false);
      fetchData();
      Alert.alert('✅ Trip Created!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    Alert.alert('Delete Trip', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/trips/${tripId}`);
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete trip');
          }
        },
      },
    ]);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗓️ Trips</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Trips List */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        contentContainerStyle={styles.list}
      >
        {trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>Tap "+ New Trip" to create one</Text>
          </View>
        ) : (
          trips.map((trip: any) => {
            const colors = getStatusColor(trip.status);
            return (
              <View key={trip.tripId} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripDestination}>
                    📍 {trip.destination?.name}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>
                      {trip.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tripInfo}>
                  🚌 {trip.bus?.busName} • 👨‍✈️ {trip.driver?.fullName}
                </Text>
                <Text style={styles.tripInfo}>
                  🗓️ {new Date(trip.date).toLocaleDateString()} • ⏰ {trip.pickupTime}
                </Text>
                <Text style={styles.tripInfo}>
                  {trip.type === 'morning' ? '🌅 Morning' : '🌆 Return'}
                </Text>
                {trip.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteTrip(trip.tripId)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Trip Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Trip</Text>

              {/* Bus Selection */}
              <Text style={styles.label}>Select Bus</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {buses.map((bus: any) => (
                  <TouchableOpacity
                    key={bus.busId}
                    style={[styles.chip, selectedBus === String(bus.busId) && styles.chipActive]}
                    onPress={() => setSelectedBus(String(bus.busId))}
                  >
                    <Text style={[styles.chipText, selectedBus === String(bus.busId) && styles.chipTextActive]}>
                      🚌 {bus.busName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Driver Selection */}
              <Text style={styles.label}>Select Driver</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {drivers.map((d: any) => (
                  <TouchableOpacity
                    key={d.phoneNumber}
                    style={[styles.chip, selectedDriver === d.phoneNumber && styles.chipActive]}
                    onPress={() => setSelectedDriver(d.phoneNumber)}
                  >
                    <Text style={[styles.chipText, selectedDriver === d.phoneNumber && styles.chipTextActive]}>
                      👨‍✈️ {d.user?.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Destination Selection */}
              <Text style={styles.label}>Select Destination</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {destinations.map((dest: any) => (
                  <TouchableOpacity
                    key={dest.destinationId}
                    style={[styles.chip, selectedDestination === String(dest.destinationId) && styles.chipActive]}
                    onPress={() => setSelectedDestination(String(dest.destinationId))}
                  >
                    <Text style={[styles.chipText, selectedDestination === String(dest.destinationId) && styles.chipTextActive]}>
                      📍 {dest.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Trip Type */}
              <Text style={styles.label}>Trip Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, tripType === 'morning' && styles.typeBtnActive]}
                  onPress={() => setTripType('morning')}
                >
                  <Text style={[styles.typeBtnText, tripType === 'morning' && styles.typeBtnTextActive]}>
                    🌅 Morning
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, tripType === 'return' && styles.typeBtnActive]}
                  onPress={() => setTripType('return')}
                >
                  <Text style={[styles.typeBtnText, tripType === 'return' && styles.typeBtnTextActive]}>
                    🌆 Return
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date */}
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-04-15"
                value={date}
                onChangeText={setDate}
              />

              {/* Pickup Time */}
              <Text style={styles.label}>Pickup Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 07:00"
                value={pickupTime}
                onChangeText={setPickupTime}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleCreateTrip}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Create Trip</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
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
    marginBottom: 8,
  },
  tripDestination: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  deleteBtn: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#DC2626', fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
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
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
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
  chipRow: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typeBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeBtnText: { color: '#64748B', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
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
});