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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DriverHomeScreen() {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, activeRes] = await Promise.all([
        api.get('/driver/trips'),
        api.get('/driver/trips/active'),
      ]);
      setTrips(tripsRes.data);
      setActiveTrip(activeRes.data?.tripId ? activeRes.data : null);
    } catch (error) {
      console.log('Error fetching driver data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleActivate = async (tripId: number) => {
    try {
      await api.put(`/driver/trips/${tripId}/activate`);
      Alert.alert('✅ Trip Started!', 'Trip is now active.');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to activate trip');
    }
  };

  const handleComplete = async (tripId: number) => {
    Alert.alert('Complete Trip', 'Are you sure you want to complete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
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

  const handlePayment = async (tripId: number, studentPhone: string, paid: boolean) => {
    try {
      await api.put('/driver/payments', { tripId, studentPhone, paid });
      fetchData();
    } catch (error) {
      console.log('Payment error:', error);
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
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Active Trip */}
      {activeTrip && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🟢 Active Trip</Text>
          <View style={styles.activeTripCard}>
            <Text style={styles.tripDestination}>📍 {activeTrip.destination?.name}</Text>
            <Text style={styles.tripInfo}>🚌 {activeTrip.bus?.busName} • ⏰ {activeTrip.pickupTime}</Text>

            {/* Students list */}
            <Text style={styles.studentsTitle}>Students:</Text>
            {activeTrip.assignments?.map((a: any) => {
              const isPaid = activeTrip.payments?.find(
                (p: any) => p.studentPhone === a.studentPhone
              )?.paid;

              return (
                <View key={a.studentPhone} style={styles.studentRow}>
                  <Text style={styles.studentName}>👤 {a.student?.user?.fullName}</Text>
                  <TouchableOpacity
                    style={[styles.payBtn, isPaid && styles.payBtnPaid]}
                    onPress={() => handlePayment(activeTrip.tripId, a.studentPhone, !isPaid)}
                  >
                    <Text style={styles.payBtnText}>{isPaid ? '✅ Paid' : '💰 Mark Paid'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

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
        {trips.filter(t => t.status === 'scheduled').length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No scheduled trips</Text>
          </View>
        ) : (
          trips
            .filter(t => t.status === 'scheduled')
            .map((trip: any) => (
              <View key={trip.tripId} style={styles.tripCard}>
                <Text style={styles.tripDestination}>📍 {trip.destination?.name}</Text>
                <Text style={styles.tripInfo}>
                  🗓️ {new Date(trip.date).toLocaleDateString()} • ⏰ {trip.pickupTime}
                </Text>
                <Text style={styles.tripInfo}>🎓 {trip.assignments?.length} students</Text>
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
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 14 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  activeTripCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
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
  tripDestination: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  studentsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 8 },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  studentName: { fontSize: 14, color: '#1E293B' },
  payBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payBtnPaid: { backgroundColor: '#DEF7EC' },
  payBtnText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  completeBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  completeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  startBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#94A3B8', fontSize: 14 },
});