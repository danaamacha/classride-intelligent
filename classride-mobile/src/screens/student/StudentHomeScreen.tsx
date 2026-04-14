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

export default function StudentHomeScreen({ navigation }: any) {  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const [tripsRes, activeRes, scheduleRes] = await Promise.all([
      api.get('/students/my/trips'),
      api.get('/students/my/trips/active'),
      api.get('/students/my/schedule'),
    ]);

    setTrips(tripsRes.data);
    setActiveTrip(activeRes.data?.tripId ? activeRes.data : null);

    // Redirect to profile setup if no schedule set
    if (scheduleRes.data.length === 0) {
      navigation.replace('ProfileSetup');
      return;
    }
  } catch (error) {
    console.log('Error fetching student data:', error);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleMarkAbsent = async (date: string) => {
    Alert.alert(
      'Mark Absent',
      `Are you sure you want to mark yourself absent for ${date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Absent',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put('/students/my/attendance', {
                date,
                attendanceMorning: false,
                attendanceReturn: false,
              });
              Alert.alert('✅ Done', 'You have been marked absent for this day.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update attendance');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
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
          <Text style={styles.greeting}>Student Dashboard 🎓</Text>
          <Text style={styles.studentName}>{user?.fullName}</Text>
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
            <Text style={styles.tripInfo}>🚌 {activeTrip.bus?.busName}</Text>
            <Text style={styles.tripInfo}>👨‍✈️ {activeTrip.driver?.fullName}</Text>
            <Text style={styles.tripInfo}>⏰ Pickup: {activeTrip.pickupTime}</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>🚀 Trip is on the way!</Text>
            </View>
          </View>
        </View>
      )}

      {/* Assigned Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 My Trips</Text>
        {trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyText}>No trips assigned yet</Text>
<Text style={styles.emptySubtext}>Send a join request to a bus owner</Text>
<TouchableOpacity
  style={styles.findBusBtn}
  onPress={() => navigation.navigate('JoinRequest')}
>
  <Text style={styles.findBusBtnText}>🔍 Find a Bus</Text>
</TouchableOpacity>          </View>
        ) : (
          trips.map((assignment: any) => {
            const trip = assignment.trip;
            return (
              <View key={assignment.id} style={styles.tripCard}>
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
                <Text style={styles.tripInfo}>🚌 {trip.bus?.busName}</Text>
                <Text style={styles.tripInfo}>👨‍✈️ {trip.driver?.fullName}</Text>
                <Text style={styles.tripInfo}>
                  🗓️ {new Date(trip.date).toLocaleDateString()} • ⏰ {trip.pickupTime}
                </Text>
                <Text style={styles.tripInfo}>
                  {trip.type === 'morning' ? '🌅 Morning Trip' : '🌆 Return Trip'}
                </Text>

                {trip.status === 'scheduled' && (
                  <TouchableOpacity
                    style={styles.absentBtn}
                    onPress={() => handleMarkAbsent(trip.date.split('T')[0])}
                  >
                    <Text style={styles.absentBtnText}>Mark Absent 🙅</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
    backgroundColor: '#059669',
  },
  greeting: { color: '#A7F3D0', fontSize: 14 },
  studentName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
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
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  tripDestination: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  activeBadge: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  activeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  absentBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  absentBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#1E293B', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#94A3B8', fontSize: 14, marginTop: 4, textAlign: 'center' },
  findBusBtn: {
  backgroundColor: '#059669',
  borderRadius: 10,
  padding: 14,
  alignItems: 'center',
  marginTop: 16,
  width: '100%',
},
findBusBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});