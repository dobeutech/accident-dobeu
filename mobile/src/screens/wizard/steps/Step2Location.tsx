import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';

interface Step2LocationProps {
  onRefreshLocation: () => Promise<void>;
}

export function Step2Location({ onRefreshLocation }: Step2LocationProps) {
  const { currentReport, updateCurrentReport } = useReportStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualAddress, setManualAddress] = useState(currentReport?.address || '');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshLocation();
    setIsRefreshing(false);
  };

  const handleAddressChange = (text: string) => {
    setManualAddress(text);
    updateCurrentReport({ address: text });
  };

  const hasLocation = currentReport?.latitude && currentReport?.longitude;

  return (
    <View style={styles.container}>
      {/* GPS Location Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={styles.locationIconContainer}>
            <Ionicons 
              name={hasLocation ? 'location' : 'location-outline'} 
              size={24} 
              color={hasLocation ? Colors.success : Colors.gray} 
            />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>GPS Location</Text>
            {hasLocation ? (
              <>
                <Text style={styles.locationStatus}>Location captured</Text>
                <Text style={styles.coordinates}>
                  {currentReport.latitude?.toFixed(6)}, {currentReport.longitude?.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.locationStatusPending}>
                Waiting for GPS signal...
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto-detected Address */}
      {currentReport?.address && (
        <View style={styles.detectedAddress}>
          <Ionicons name="navigate" size={18} color={Colors.success} />
          <Text style={styles.detectedAddressText}>{currentReport.address}</Text>
        </View>
      )}

      {/* Manual Address Entry */}
      <View style={styles.manualSection}>
        <Text style={styles.sectionLabel}>Street Address</Text>
        <Text style={styles.sectionHint}>
          Enter or edit the location address if needed
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="123 Main Street, City, State ZIP"
          placeholderTextColor={Colors.textMuted}
          value={manualAddress}
          onChangeText={handleAddressChange}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Intersection Fields */}
      <View style={styles.intersectionSection}>
        <Text style={styles.sectionLabel}>Nearest Intersection (Optional)</Text>
        <View style={styles.intersectionRow}>
          <TextInput
            style={[styles.textInput, styles.streetInput]}
            placeholder="Street 1"
            placeholderTextColor={Colors.textMuted}
            onChangeText={(text) => updateCurrentReport({ 
              customFields: { ...currentReport?.customFields, intersection_street1: text }
            })}
          />
          <Text style={styles.andText}>&</Text>
          <TextInput
            style={[styles.textInput, styles.streetInput]}
            placeholder="Street 2"
            placeholderTextColor={Colors.textMuted}
            onChangeText={(text) => updateCurrentReport({ 
              customFields: { ...currentReport?.customFields, intersection_street2: text }
            })}
          />
        </View>
      </View>

      {/* Landmark */}
      <View style={styles.landmarkSection}>
        <Text style={styles.sectionLabel}>Nearby Landmark (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Near gas station, in parking lot of..."
          placeholderTextColor={Colors.textMuted}
          onChangeText={(text) => updateCurrentReport({ 
            customFields: { ...currentReport?.customFields, landmark: text }
          })}
        />
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Accurate location information helps with insurance claims and 
          official reports. GPS coordinates are captured automatically.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  locationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  locationStatus: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 2,
  },
  locationStatusPending: {
    fontSize: 13,
    color: Colors.warning,
    marginTop: 2,
  },
  coordinates: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectedAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.success + '15',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detectedAddressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  manualSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  intersectionSection: {
    gap: 8,
  },
  intersectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streetInput: {
    flex: 1,
  },
  andText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  landmarkSection: {
    gap: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '15',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
