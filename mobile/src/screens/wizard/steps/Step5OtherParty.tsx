import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';

export function Step5OtherParty() {
  const { currentReport, updateCustomField } = useReportStore();
  const customFields = currentReport?.customFields || {};
  const [hasOtherParty, setHasOtherParty] = useState(customFields.has_other_party || false);

  const handleFieldChange = (key: string, value: any) => {
    updateCustomField(key, value);
  };

  const handleToggleOtherParty = (value: boolean) => {
    setHasOtherParty(value);
    handleFieldChange('has_other_party', value);
  };

  return (
    <View style={styles.container}>
      {/* Was there another party? */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleInfo}>
          <Ionicons name="people" size={24} color={Colors.primary} />
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>Was another party involved?</Text>
            <Text style={styles.toggleHint}>
              Other vehicle, pedestrian, or property owner
            </Text>
          </View>
        </View>
        <Switch
          value={hasOtherParty}
          onValueChange={handleToggleOtherParty}
          trackColor={{ false: Colors.grayMedium, true: Colors.primaryLight }}
          thumbColor={hasOtherParty ? Colors.primary : Colors.grayLight}
        />
      </View>

      {hasOtherParty && (
        <>
          {/* Other Driver Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Other Driver</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First"
                  placeholderTextColor={Colors.textMuted}
                  value={customFields.other_driver_first_name || ''}
                  onChangeText={(text) => handleFieldChange('other_driver_first_name', text)}
                />
              </View>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last"
                  placeholderTextColor={Colors.textMuted}
                  value={customFields.other_driver_last_name || ''}
                  onChangeText={(text) => handleFieldChange('other_driver_last_name', text)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={customFields.other_driver_phone || ''}
                onChangeText={(text) => handleFieldChange('other_driver_phone', text)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Driver's License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="License number"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                value={customFields.other_driver_license || ''}
                onChangeText={(text) => handleFieldChange('other_driver_license', text)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>License State</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., TX, CA, NY"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                maxLength={2}
                value={customFields.other_driver_license_state || ''}
                onChangeText={(text) => handleFieldChange('other_driver_license_state', text)}
              />
            </View>
          </View>

          {/* Other Vehicle Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="car-sport" size={20} color={Colors.secondary} />
              <Text style={styles.cardTitle}>Other Vehicle</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2023"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={customFields.other_vehicle_year || ''}
                  onChangeText={(text) => handleFieldChange('other_vehicle_year', text)}
                />
              </View>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.label}>Make</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Toyota"
                  placeholderTextColor={Colors.textMuted}
                  value={customFields.other_vehicle_make || ''}
                  onChangeText={(text) => handleFieldChange('other_vehicle_make', text)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Camry"
                placeholderTextColor={Colors.textMuted}
                value={customFields.other_vehicle_model || ''}
                onChangeText={(text) => handleFieldChange('other_vehicle_model', text)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Color"
                  placeholderTextColor={Colors.textMuted}
                  value={customFields.other_vehicle_color || ''}
                  onChangeText={(text) => handleFieldChange('other_vehicle_color', text)}
                />
              </View>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.label}>License Plate</Text>
                <TextInput
                  style={styles.input}
                  placeholder="XYZ-5678"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  value={customFields.other_vehicle_plate || ''}
                  onChangeText={(text) => handleFieldChange('other_vehicle_plate', text)}
                />
              </View>
            </View>
          </View>

          {/* Insurance Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.cardTitle}>Other Party's Insurance</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Insurance Company</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., State Farm, Geico"
                placeholderTextColor={Colors.textMuted}
                value={customFields.other_insurance_company || ''}
                onChangeText={(text) => handleFieldChange('other_insurance_company', text)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Policy Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Policy number"
                placeholderTextColor={Colors.textMuted}
                value={customFields.other_insurance_policy || ''}
                onChangeText={(text) => handleFieldChange('other_insurance_policy', text)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Insurance Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Claims phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={customFields.other_insurance_phone || ''}
                onChangeText={(text) => handleFieldChange('other_insurance_phone', text)}
              />
            </View>
          </View>
        </>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="camera" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Tip: Take photos of the other driver's license, insurance card, and 
          license plate for accurate information.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '15',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
