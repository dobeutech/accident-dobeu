import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../stores/authStore';
import { useReportStore } from '../../stores/reportStore';
import { useSyncStore } from '../../stores/syncStore';
import { useI18n } from '../../lib/i18n';
import { Colors, Shadows } from '../../theme/colors';
import { IncidentType } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { reports, fetchReports, isLoading, fetchFormFields } = useReportStore();
  const { queue, isOnline } = useSyncStore();
  const { t } = useI18n();

  const incidentTypes: { type: IncidentType; labelKey: string; icon: keyof typeof Ionicons.glyphMap; color: string; descriptionKey: string }[] = [
    { 
      type: 'accident', 
      labelKey: 'incident.accident', 
      icon: 'car',
      color: Colors.incidentAccident,
      descriptionKey: 'step1.accident.desc'
    },
    { 
      type: 'incident', 
      labelKey: 'incident.incident', 
      icon: 'medical',
      color: Colors.incidentIncident,
      descriptionKey: 'step1.incident.desc'
    },
    { 
      type: 'near_miss', 
      labelKey: 'incident.nearMiss', 
      icon: 'warning',
      color: Colors.incidentNearMiss,
      descriptionKey: 'step1.nearMiss.desc'
    },
  ];

  const pendingSyncCount = queue.filter(q => q.status === 'pending').length;
  const recentReports = reports.slice(0, 3);

  useEffect(() => {
    fetchReports();
    fetchFormFields();
  }, []);

  const handleStartReport = (incidentType: IncidentType) => {
    navigation.navigate('ReportWizard', { incidentType });
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

  const getStatusLabel = (status: string) => {
    const statusKey = status === 'under_review' ? 'underReview' : status;
    return t(`status.${statusKey}`);
  };

  const getIncidentTypeLabel = (type: string) => {
    const typeKey = type === 'near_miss' ? 'nearMiss' : type;
    return t(`incident.${typeKey}`);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchReports} />
      }
      accessibilityRole="scrollbar"
    >
      {/* Connection Status Banner */}
      {!isOnline && (
        <View 
          style={styles.offlineBanner}
          accessibilityRole="alert"
          accessibilityLabel={t('home.offlineMode')}
        >
          <Ionicons name="cloud-offline" size={16} color={Colors.white} />
          <Text style={styles.offlineBannerText}>
            {t('home.offlineMode')}
          </Text>
        </View>
      )}

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText} accessibilityRole="header">
          {t('home.welcome')}, {user?.firstName || 'Driver'}
        </Text>
        <Text style={styles.welcomeSubtext}>
          Report any incidents immediately for your safety
        </Text>
      </View>

      {/* Quick Report Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('home.quickReport')}
        </Text>
        <View style={styles.incidentButtonsContainer}>
          {incidentTypes.map((incident) => (
            <TouchableOpacity
              key={incident.type}
              style={[styles.incidentButton, { borderLeftColor: incident.color }]}
              onPress={() => handleStartReport(incident.type)}
              accessibilityRole="button"
              accessibilityLabel={`${t(incident.labelKey)}. ${t(incident.descriptionKey)}`}
              accessibilityHint="Double tap to start a new report"
            >
              <View style={[styles.incidentIconContainer, { backgroundColor: incident.color }]}>
                <Ionicons name={incident.icon} size={28} color={Colors.white} />
              </View>
              <View style={styles.incidentTextContainer}>
                <Text style={styles.incidentLabel}>{t(incident.labelKey)}</Text>
                <Text style={styles.incidentDescription}>{t(incident.descriptionKey)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.gray} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sync Status */}
      {pendingSyncCount > 0 && (
        <View style={styles.syncSection}>
          <View 
            style={styles.syncCard}
            accessibilityRole="alert"
            accessibilityLabel={`${pendingSyncCount} ${t('profile.pendingUploads')}`}
          >
            <Ionicons name="sync" size={24} color={Colors.warning} />
            <View style={styles.syncTextContainer}>
              <Text style={styles.syncTitle}>{t('profile.pendingUploads')}</Text>
              <Text style={styles.syncSubtext}>
                {pendingSyncCount} item{pendingSyncCount > 1 ? 's' : ''} waiting to sync
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {t('home.recentReports')}
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main', { screen: 'Reports' } as any)}
            accessibilityRole="button"
            accessibilityLabel="See all reports"
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentReports.length === 0 ? (
          <View style={styles.emptyState} accessibilityRole="text">
            <Ionicons name="document-text-outline" size={48} color={Colors.grayMedium} />
            <Text style={styles.emptyStateText}>{t('home.noReports')}</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap a button above to create your first report
            </Text>
          </View>
        ) : (
          recentReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
              accessibilityRole="button"
              accessibilityLabel={`${getStatusLabel(report.status)} report from ${new Date(report.incidentDate).toLocaleDateString()}`}
            >
              <View style={styles.reportCardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusLabel(report.status).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.reportDate}>
                  {new Date(report.incidentDate).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.reportNumber}>{report.reportNumber || report.id.slice(0, 8)}</Text>
              <Text style={styles.reportType}>
                {getIncidentTypeLabel(report.incidentType)}
              </Text>
              {report.address && (
                <View style={styles.reportLocation}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.reportLocationText} numberOfLines={1}>
                    {report.address}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Safety Reminder */}
      <View style={styles.safetySection}>
        <View 
          style={styles.safetyCard}
          accessibilityRole="text"
          accessibilityLabel="Safety reminder: Ensure you're in a safe location before documenting any incident"
        >
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyTitle}>Safety First</Text>
            <Text style={styles.safetyText}>
              Ensure you're in a safe location before documenting any incident
            </Text>
          </View>
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
  offlineBanner: {
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBannerText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  welcomeSection: {
    padding: 20,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  section: {
    padding: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  incidentButtonsContainer: {
    gap: 12,
  },
  incidentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    minHeight: 80, // Minimum touch target
    ...Shadows.small,
  },
  incidentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incidentTextContainer: {
    flex: 1,
  },
  incidentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  incidentDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  syncSection: {
    paddingHorizontal: 20,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
    minHeight: 64,
  },
  syncTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  syncSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    ...Shadows.small,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 88, // Minimum touch target
    ...Shadows.small,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  reportDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  reportNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reportType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  reportLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportLocationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  safetySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success,
    minHeight: 64,
  },
  safetyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  safetyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomPadding: {
    height: 20,
  },
});
