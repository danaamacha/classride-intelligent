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
} from 'react-native';
import api from '../../services/api';

export default function StudentJoinRequestScreen({ navigation }: any) {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      // Get all approved owners
      const response = await api.get('/owners/list');
      setOwners(response.data);
    } catch (error) {
      console.log('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (ownerPhone: string) => {
    setSending(ownerPhone);
    try {
      await api.post('/students/join-request', { ownerPhone });
      Alert.alert(
        '✅ Request Sent!',
        'Your join request has been sent. The owner will review it shortly.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send request'
      );
    } finally {
      setSending(null);
    }
  };

  const filteredOwners = owners.filter((o: any) =>
    o.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    o.phoneNumber?.includes(search)
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
        <Text style={styles.headerTitle}>Find a Bus</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by name or phone..."
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
            <View key={owner.phoneNumber} style={styles.ownerCard}>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.fullName}</Text>
                <Text style={styles.ownerPhone}>📱 {owner.phoneNumber}</Text>
                {owner.homeTown && (
                  <Text style={styles.ownerTown}>📍 {owner.homeTown}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.requestBtn}
                onPress={() => handleSendRequest(owner.phoneNumber)}
                disabled={sending === owner.phoneNumber}
              >
                {sending === owner.phoneNumber ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.requestBtnText}>Request</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
  requestBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
});