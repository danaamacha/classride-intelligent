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

export default function DriverTripsScreen({ navigation }: any) {
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
      setTrips(tripsRes.data.filter((t: any) => t.status === 'scheduled'));
      setActiveTrip(activeRes.data?.tripId ? activeRes.data : null);
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
        <ActivityIndicator size="large" color="#7C3AED" />
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
            {/* Trip Info */}
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

            {/* Students List */}
            <View style={styles.studentsSection}>
              <Text style={styles.studentsTitle}>
                👥 Students ({activeTrip.assignments?.length || 0})
              </Text>
              {activeTrip.assignments?.map((a: any) => {
                const payment = activeTrip.payments?.find(
                  (p: any) => p.studentPhone === a.studentPhone
                );
                const isPaid = payment?.paid ?? false;

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
                    </View>
                    <TouchableOpacity
                      style={[styles.payBtn, isPaid && styles.payBtnPaid]}
                      onPress={() =>
                        handlePayment(activeTrip.tripId, a.studentPhone, !isPaid)
                      }
                    >
                      <Text style={[styles.payBtnText, isPaid && styles.payBtnTextPaid]}>
                        {isPaid ? '✅ Paid' : '💰 Unpaid'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Complete Button */}
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

              {/* Students Preview */}
              <View style={styles.studentPreview}>
                <Text style={styles.studentPreviewText}>
                  👥 {trip.assignments?.length || 0} students assigned
                </Text>
              </View>

              {/* Students List */}
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
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 14 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
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
  activeTripDestination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  activeBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
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
  tripDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  tripType: { fontSize: 20 },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  studentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
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
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  studentAddress: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  studentPreview: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  studentPreviewText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  payBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  payBtnPaid: { backgroundColor: '#DEF7EC' },
  payBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  payBtnTextPaid: { color: '#065F46' },
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
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});