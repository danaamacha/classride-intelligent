import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
        <TouchableOpacity
      
          style={styles.notifBtn}
onPress={() => navigation.getParent()?.navigate('Notifications')}        >
          <Text style={styles.notifBtnText}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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

      {/* Recent Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        {dashboard?.recentNotifications?.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          dashboard?.recentNotifications?.map((notif: any) => (
            <View key={notif.notifId ?? notif.id ?? String(Math.random())} style={[styles.notifCard, !notif.isRead && styles.unreadNotif]}>
              <Text style={styles.notifTitle}>{notif.title}</Text>
              <Text style={styles.notifBody}>{notif.body}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  notifCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  unreadNotif: { borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  notifTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  notifBody: { fontSize: 14, color: '#64748B', marginTop: 4 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  notifBtn: {
    position: 'relative',
    padding: 8,
  },
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
});