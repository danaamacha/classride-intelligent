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

export default function OwnerBusesScreen() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [busName, setBusName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await api.get('/buses');
      setBuses(response.data);
    } catch (error) {
      console.log('Error fetching buses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddBus = async () => {
    if (!busName || !capacity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      await api.post('/buses', {
        busName,
        capacity: parseInt(capacity),
      });
      setBusName('');
      setCapacity('');
      setModalVisible(false);
      fetchBuses();
      Alert.alert('✅ Success', 'Bus added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add bus');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBus = async (busId: number) => {
    Alert.alert('Delete Bus', 'Are you sure you want to delete this bus?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/buses/${busId}`);
            fetchBuses();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete bus');
          }
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>🚌 My Buses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Bus</Text>
        </TouchableOpacity>
      </View>

      {/* Buses List */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchBuses} />}
        contentContainerStyle={styles.list}
      >
        {buses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyText}>No buses yet</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add Bus" to add your first bus</Text>
          </View>
        ) : (
          buses.map((bus: any) => (
            <View key={bus.busId} style={styles.busCard}>
              <View style={styles.busInfo}>
                <Text style={styles.busName}>{bus.busName}</Text>
                <Text style={styles.busCapacity}>👥 Capacity: {bus.capacity}</Text>
                <Text style={styles.busId}>ID: #{bus.busId}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteBus(bus.busId)}
              >
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Bus Modal */}
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
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Bus</Text>

          <Text style={styles.label}>Bus Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bus 1"
            value={busName}
            onChangeText={setBusName}
            returnKeyType="next"
          />

          <Text style={styles.label}>Capacity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 20"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
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
              onPress={handleAddBus}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Add Bus</Text>
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
  list: { padding: 16 },
  busCard: {
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
  busInfo: { flex: 1 },
  busName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  busCapacity: { fontSize: 14, color: '#64748B', marginTop: 4 },
  busId: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
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
});