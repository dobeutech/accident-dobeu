import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useReportStore } from '../../stores/reportStore';
import { ApiService } from '../../services/ApiService';
import { Colors, Shadows } from '../../theme/colors';
import { AccidentReport } from '../../types';

type ReportDetailRouteProp = RouteProp<RootStackParamList, 'ReportDetail'>;

export function ReportDetailScreen() {
  const route = useRoute<ReportDetailRouteProp>();
  const navigation = useNavigation();
  const { reportId } = route.params;
  const { reports, formFields } = useReportStore();
  
  const [report, setReport] = useState<AccidentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    // First check local cache
    const localReport = reports.find(r => r.id === reportId);
    if (localReport) {
      setReport(localReport);
      setIsLoading(false);
    }

    // Then try to fetch fresh data
    try {
      const response = await ApiService.getReport(reportId);
      if (response.data) {
        setReport(response.data.report);
      }
    } catch (error) {
      console.error('Load report error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getFieldLabel = (key: string): string => {
    const field = formFields.find(f => f.fieldKey === key);
    if (field) return field.label;
    
    // Fallback: convert snake_case to Title Case
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Report not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={[
            styles.iconContainer, 
            { backgroundColor: getStatusColor(report.status) }
          ]}>
            <Ionicons 
              name={getIncidentIcon(report.incidentType)} 
              size={24} 
              color={Colors.white} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.reportNumber}>
              {report.reportNumber || `Draft-${report.id.slice(0, 8)}`}
            </Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(report.status) }
            ]}>
              <Text style={styles.statusBadgeText}>
                {report.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {report.incidentType.replace('_', ' ').charAt(0).toUpperCase() + 
               report.incidentType.replace('_', ' ').slice(1)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(report.incidentDate).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Location Card */}
      {(report.latitude || report.address) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            {report.address && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.addressText}>{report.address}</Text>
              </View>
            )}
            {report.latitude && report.longitude && (
              <Text style={styles.coordsText}>
                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Custom Fields */}
      {report.customFields && Object.keys(report.customFields).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            {Object.entries(report.customFields).map(([key, value]) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{getFieldLabel(key)}</Text>
                <Text style={styles.fieldValue}>
                  {typeof value === 'boolean' 
                    ? (value ? 'Yes' : 'No')
                    : String(value)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Photos */}
      {report.photos && report.photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Photos ({report.photos.length})
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosContainer}
          >
            {report.photos.map((photo, index) => (
              <TouchableOpacity key={photo.id} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo.localUri || photo.remoteUrl }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                {photo.uploadStatus === 'pending' && (
                  <View style={styles.photoOverlay}>
                    <Ionicons name="cloud-upload" size={24} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Audio Recordings */}
      {report.audio && report.audio.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Audio Recordings ({report.audio.length})
          </Text>
          <View style={styles.card}>
            {report.audio.map((audio, index) => (
              <TouchableOpacity key={audio.id} style={styles.audioRow}>
                <View style={styles.audioIcon}>
                  <Ionicons name="mic" size={20} color={Colors.primary} />
                </View>
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>Recording {index + 1}</Text>
                  {audio.durationSeconds && (
                    <Text style={styles.audioDuration}>
                      {Math.floor(audio.durationSeconds / 60)}:
                      {(audio.durationSeconds % 60).toString().padStart(2, '0')}
                    </Text>
                  )}
                </View>
                <Ionicons name="play-circle" size={32} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Timestamps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>Created</Text>
            <Text style={styles.timelineValue}>
              {new Date(report.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.timelineRow}>
            <Text style={styles.timelineLabel}>Last Updated</Text>
            <Text style={styles.timelineValue}>
              {new Date(report.updatedAt).toLocaleString()}
            </Text>
          </View>
          {report.syncedAt && (
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Synced</Text>
              <Text style={styles.timelineValue}>
                {new Date(report.syncedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 16,
    ...Shadows.small,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  reportNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  headerDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  coordsText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    marginLeft: 28,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fieldLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  photosContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  audioDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timelineValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  bottomPadding: {
    height: 32,
  },
});
