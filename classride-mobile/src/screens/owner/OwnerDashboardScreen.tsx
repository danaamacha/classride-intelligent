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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function OwnerDashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, unreadRes] = await Promise.all([
        api.get('/owner/dashboard'),
        api.get('/notifications/unread/count'),
      ]);
      setDashboard(dashboardRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.log('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const stats = dashboard?.stats;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.ownerName}>{user?.fullName}</Text>
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

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="🚌" label="Buses" value={stats?.totalBuses} color="#2563EB" />
        <StatCard icon="👨‍✈️" label="Drivers" value={stats?.totalDrivers} color="#7C3AED" />
        <StatCard icon="🎓" label="Students" value={stats?.totalStudents} color="#059669" />
        <StatCard icon="📥" label="Requests" value={stats?.pendingJoinRequests} color="#D97706" />
        <StatCard icon="🔔" label="Unread" value={stats?.unreadNotifications} color="#DC2626" />
        <StatCard icon="🗓️" label="Today" value={stats?.todayTrips} color="#0891B2" />
      </View>

      {/* Today's Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Trips</Text>
        {dashboard?.todayTrips?.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No trips scheduled for today</Text>
          </View>
        ) : (
          dashboard?.todayTrips?.map((trip: any) => (
            <View key={trip.tripId} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripDestination}>📍 {trip.destination?.name}</Text>
                <View style={[styles.statusBadge,
                  { backgroundColor: trip.status === 'active' ? '#DEF7EC' : trip.status === 'completed' ? '#E5E7EB' : '#DBEAFE' }
                ]}>
                  <Text style={[styles.statusText,
                    { color: trip.status === 'active' ? '#065F46' : trip.status === 'completed' ? '#374151' : '#1D4ED8' }
                  ]}>{trip.status}</Text>
                </View>
              </View>
              <Text style={styles.tripInfo}>🚌 {trip.bus?.busName} • ⏰ {trip.pickupTime}</Text>
              <Text style={styles.tripInfo}>👨‍✈️ {trip.driver?.fullName}</Text>
              <Text style={styles.tripInfo}>🎓 {trip.assignments?.length} students</Text>
            </View>
          ))
        )}
      </View>

      {/* Trip Price Settings */}
      <PriceSettingCard />

    </ScrollView>
  );
}

// ─── Stat Card ───────────────────────────────
function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Price Setting Card ───────────────────────
function PriceSettingCard() {
  const [pricePerTrip, setPricePerTrip] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrice();
  }, []);

  const fetchPrice = async () => {
    try {
      const res = await api.get('/payments/price');
      setCurrentPrice(res.data.pricePerTrip ?? 0);
      setPricePerTrip(String(res.data.pricePerTrip ?? ''));
    } catch (error) {
      console.log('Error fetching price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const amount = parseFloat(pricePerTrip);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    setSaving(true);
    try {
      await api.put('/payments/price', { pricePerTrip: amount });
      setCurrentPrice(amount);
      Alert.alert('✅ Saved!', `Price per trip set to ${amount.toLocaleString()} LBP`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.priceCard}>
      <Text style={styles.priceCardTitle}>💰 Trip Pricing</Text>
      <Text style={styles.priceCardSubtitle}>
        Set the price per trip for your students
      </Text>
      {loading ? (
        <ActivityIndicator color="#2563EB" />
      ) : (
        <>
          <View style={styles.currentPriceRow}>
            <Text style={styles.currentPriceLabel}>Current price per trip:</Text>
            <Text style={styles.currentPriceValue}>
              {currentPrice.toLocaleString()} LBP
            </Text>
          </View>
          <View style={styles.priceInputRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="e.g. 300000"
              value={pricePerTrip}
              onChangeText={setPricePerTrip}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.priceSaveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.priceSaveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.priceHint}>
            💡 Both trips = {(currentPrice * 2).toLocaleString()} LBP
          </Text>
        </>
      )}
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
  greeting: { color: '#BFDBFE', fontSize: 14 },
  ownerName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  tripCard: {
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
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tripDestination: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priceCardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  priceCardSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  currentPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  currentPriceLabel: { fontSize: 14, color: '#64748B' },
  currentPriceValue: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  priceInputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  priceSaveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  priceHint: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
});