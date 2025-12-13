import React from 'react';
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';

export function Step4VehicleInfo() {
  const { currentReport, updateCustomField } = useReportStore();
  const customFields = currentReport?.customFields || {};

  const handleFieldChange = (key: string, value: any) => {
    updateCustomField(key, value);
  };

  return (
    <View style={styles.container}>
      {/* Vehicle Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="car" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Your Vehicle</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Vehicle Number / Unit ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Unit 123"
            placeholderTextColor={Colors.textMuted}
            value={customFields.vehicle_number || ''}
            onChangeText={(text) => handleFieldChange('vehicle_number', text)}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.flex1]}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="2023"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={customFields.vehicle_year || ''}
              onChangeText={(text) => handleFieldChange('vehicle_year', text)}
            />
          </View>
          <View style={[styles.fieldGroup, styles.flex2]}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              placeholder="Ford"
              placeholderTextColor={Colors.textMuted}
              value={customFields.vehicle_make || ''}
              onChangeText={(text) => handleFieldChange('vehicle_make', text)}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="F-150"
            placeholderTextColor={Colors.textMuted}
            value={customFields.vehicle_model || ''}
            onChangeText={(text) => handleFieldChange('vehicle_model', text)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>License Plate</Text>
          <TextInput
            style={styles.input}
            placeholder="ABC-1234"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            value={customFields.vehicle_plate || ''}
            onChangeText={(text) => handleFieldChange('vehicle_plate', text)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>VIN (if available)</Text>
          <TextInput
            style={styles.input}
            placeholder="Vehicle Identification Number"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            value={customFields.vehicle_vin || ''}
            onChangeText={(text) => handleFieldChange('vehicle_vin', text)}
          />
        </View>
      </View>

      {/* Damage Description */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="construct" size={20} color={Colors.warning} />
          <Text style={styles.cardTitle}>Damage Assessment</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Describe Damage to Your Vehicle</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the location and extent of damage..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={customFields.damage_description || ''}
            onChangeText={(text) => handleFieldChange('damage_description', text)}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Vehicle Drivable?</Text>
            <Text style={styles.toggleHint}>Can the vehicle be safely driven?</Text>
          </View>
          <Switch
            value={customFields.vehicle_drivable || false}
            onValueChange={(value) => handleFieldChange('vehicle_drivable', value)}
            trackColor={{ false: Colors.grayMedium, true: Colors.primaryLight }}
            thumbColor={customFields.vehicle_drivable ? Colors.primary : Colors.grayLight}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Tow Required?</Text>
            <Text style={styles.toggleHint}>Does the vehicle need to be towed?</Text>
          </View>
          <Switch
            value={customFields.tow_required || false}
            onValueChange={(value) => handleFieldChange('tow_required', value)}
            trackColor={{ false: Colors.grayMedium, true: Colors.primaryLight }}
            thumbColor={customFields.tow_required ? Colors.primary : Colors.grayLight}
          />
        </View>
      </View>

      {/* Cargo Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cube" size={20} color={Colors.secondary} />
          <Text style={styles.cardTitle}>Cargo (if applicable)</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Cargo Damaged?</Text>
            <Text style={styles.toggleHint}>Was any cargo affected?</Text>
          </View>
          <Switch
            value={customFields.cargo_damaged || false}
            onValueChange={(value) => handleFieldChange('cargo_damaged', value)}
            trackColor={{ false: Colors.grayMedium, true: Colors.primaryLight }}
            thumbColor={customFields.cargo_damaged ? Colors.primary : Colors.grayLight}
          />
        </View>

        {customFields.cargo_damaged && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Describe Cargo Damage</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what cargo was damaged and how..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={customFields.cargo_damage_description || ''}
              onChangeText={(text) => handleFieldChange('cargo_damage_description', text)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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
  flex2: {
    flex: 2,
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
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  toggleHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
