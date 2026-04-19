import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';

export default function DriverHistoryScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/driver/trips/completed');
      setTrips(response.data);
    } catch (error) {
      console.log('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchHistory} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✅ Trip History</Text>
        <Text style={styles.headerSubtitle}>Your completed trips</Text>
      </View>

      <View style={styles.content}>
        {trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No completed trips yet</Text>
          </View>
        ) : (
          trips.map((trip: any) => {
            const paidCount = trip.payments?.filter((p: any) => p.paid).length || 0;
            const totalStudents = trip.assignments?.length || 0;

            return (
              <View key={trip.tripId} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripDestination}>
                    📍 {trip.destination?.name}
                  </Text>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Done</Text>
                  </View>
                </View>
                <Text style={styles.tripInfo}>
                  🗓️ {new Date(trip.date).toLocaleDateString()}
                </Text>
                <Text style={styles.tripInfo}>⏰ {trip.pickupTime}</Text>
                <Text style={styles.tripInfo}>🚌 {trip.bus?.busName}</Text>
                <Text style={styles.tripInfo}>
                  {trip.type === 'morning' ? '🌅 Morning' : '🌆 Return'}
                </Text>

                {/* Summary */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{totalStudents}</Text>
                    <Text style={styles.summaryLabel}>Students</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNumber, { color: '#059669' }]}>
                      {paidCount}
                    </Text>
                    <Text style={styles.summaryLabel}>Paid</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNumber, { color: '#DC2626' }]}>
                      {totalStudents - paidCount}
                    </Text>
                    <Text style={styles.summaryLabel}>Unpaid</Text>
                  </View>
                </View>

                {/* Students */}
                {trip.assignments?.length > 0 && (
                  <View style={styles.studentsSection}>
                    {trip.assignments.map((a: any) => {
                      const payment = trip.payments?.find(
                        (p: any) => p.studentPhone === a.studentPhone
                      );
                      const isPaid = payment?.paid ?? false;

                      return (
                        <View key={a.studentPhone} style={styles.studentRow}>
                          <Text style={styles.studentName}>
                            👤 {a.student?.user?.fullName}
                          </Text>
                          <View style={[
                            styles.payStatus,
                            { backgroundColor: isPaid ? '#DEF7EC' : '#FEE2E2' }
                          ]}>
                            <Text style={[
                              styles.payStatusText,
                              { color: isPaid ? '#065F46' : '#991B1B' }
                            ]}>
                              {isPaid ? '✅ Paid' : '❌ Unpaid'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#7C3AED',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#DDD6FE', fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
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
  completedBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: { color: '#374151', fontSize: 11, fontWeight: '600' },
  tripInfo: { fontSize: 14, color: '#64748B', marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  summaryLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0' },
  studentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentName: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  payStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payStatusText: { fontSize: 12, fontWeight: '600' },
});