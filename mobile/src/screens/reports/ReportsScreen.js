import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { reportStorage } from '../../storage/database';
import { reportService } from '../../services/api';

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { isOnline, syncPendingItems } = useSync();
  const navigation = useNavigation();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Load from local storage first
      const localReports = await reportStorage.getAll();
      setReports(localReports);
      
      // Sync if online
      if (isOnline) {
        try {
          const response = await reportService.getAll();
          const serverReports = response.data.reports;
          
          // Merge with local data
          const merged = [...localReports];
          serverReports.forEach(serverReport => {
            const index = merged.findIndex(r => r.id === serverReport.id);
            if (index >= 0) {
              merged[index] = { ...merged[index], ...serverReport, is_offline: 0 };
            } else {
              merged.push({ ...serverReport, is_offline: 0 });
            }
          });
          
          setReports(merged);
          
          // Sync pending items
          await syncPendingItems();
        } catch (error) {
          console.error('Error syncing reports:', error);
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportNumber}>{item.report_number || 'Draft'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.reportType}>{item.incident_type}</Text>
      <Text style={styles.reportDate}>
        {new Date(item.incident_date || item.created_at).toLocaleDateString()}
      </Text>
      
      {item.is_offline === 1 && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>You are offline</Text>
        </View>
      )}
      
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reports yet</Text>
            <Text style={styles.emptySubtext}>Create your first report to get started</Text>
          </View>
        }
      />
    </View>
  );
}

function getStatusColor(status) {
  const colors = {
    draft: '#FFA500',
    submitted: '#007AFF',
    under_review: '#5856D6',
    closed: '#34C759'
  };
  return colors[status] || '#999';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  offlineBanner: {
    backgroundColor: '#FFA500',
    padding: 10,
    alignItems: 'center'
  },
  offlineBannerText: {
    color: '#fff',
    fontWeight: '600'
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  reportNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  reportType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize'
  },
  reportDate: {
    fontSize: 12,
    color: '#999'
  },
  offlineBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  offlineText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999'
  }
});

