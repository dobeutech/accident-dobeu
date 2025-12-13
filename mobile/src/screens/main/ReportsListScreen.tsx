import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useReportStore } from '../../stores/reportStore';
import { Colors, Shadows } from '../../theme/colors';
import { AccidentReport } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'closed', label: 'Closed' },
];

export function ReportsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { reports, fetchReports, isLoading, loadDraftReports } = useReportStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchReports();
    loadDraftReports();
  }, []);

  const filteredReports = reports.filter(report => {
    // Status filter
    if (activeFilter !== 'all' && report.status !== activeFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.reportNumber?.toLowerCase().includes(query) ||
        report.address?.toLowerCase().includes(query) ||
        report.incidentType.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return Colors.statusDraft;
      case 'submitted': return Colors.statusSubmitted;
      case 'under_review': return Colors.statusUnderReview;
      case 'closed': return Colors.statusClosed;
      default: return Colors.gray;
    }
  };

  const getIncidentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'accident': return 'car';
      case 'incident': return 'medical';
      case 'near_miss': return 'warning';
      default: return 'document';
    }
  };

  const renderReport = ({ item: report }: { item: AccidentReport }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
    >
      <View style={styles.reportCardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor(report.status) }]}>
          <Ionicons name={getIncidentIcon(report.incidentType)} size={20} color={Colors.white} />
        </View>
      </View>
      
      <View style={styles.reportCardContent}>
        <View style={styles.reportCardHeader}>
          <Text style={styles.reportNumber}>
            {report.reportNumber || `Draft-${report.id.slice(0, 8)}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusBadgeText}>
              {report.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.reportType}>
          {report.incidentType.replace('_', ' ').charAt(0).toUpperCase() + 
           report.incidentType.replace('_', ' ').slice(1)}
        </Text>
        
        <View style={styles.reportMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(report.incidentDate).toLocaleDateString()}
            </Text>
          </View>
          
          {report.address && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {report.address}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.reportStats}>
          {report.photos && report.photos.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="camera-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>{report.photos.length}</Text>
            </View>
          )}
          {report.audio && report.audio.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="mic-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>{report.audio.length}</Text>
            </View>
          )}
          {report.isOffline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline-outline" size={14} color={Colors.warning} />
              <Text style={[styles.statText, { color: Colors.warning }]}>Pending sync</Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.key && styles.filterChipActive
              ]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === item.key && styles.filterChipTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchReports} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={Colors.grayMedium} />
            <Text style={styles.emptyStateTitle}>No Reports Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || activeFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Create your first report from the Dashboard'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    ...Shadows.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  filterContainer: {
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Shadows.small,
  },
  reportCardLeft: {
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  reportType: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  reportMeta: {
    gap: 4,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  reportStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
