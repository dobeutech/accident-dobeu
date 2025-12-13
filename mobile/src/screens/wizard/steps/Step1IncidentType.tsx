import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';
import { IncidentType } from '../../../types';

const incidentOptions: { 
  type: IncidentType; 
  label: string; 
  icon: keyof typeof Ionicons.glyphMap; 
  color: string; 
  description: string;
}[] = [
  { 
    type: 'accident', 
    label: 'Vehicle Accident', 
    icon: 'car',
    color: Colors.incidentAccident,
    description: 'Collision with another vehicle, object, or pedestrian'
  },
  { 
    type: 'incident', 
    label: 'Injury/Incident', 
    icon: 'medical',
    color: Colors.incidentIncident,
    description: 'Personal injury, slip/fall, or workplace incident'
  },
  { 
    type: 'near_miss', 
    label: 'Near Miss', 
    icon: 'warning',
    color: Colors.incidentNearMiss,
    description: 'A close call that could have resulted in harm'
  },
];

export function Step1IncidentType() {
  const { currentReport, updateCurrentReport } = useReportStore();
  const selectedType = currentReport?.incidentType;

  const handleSelect = (type: IncidentType) => {
    updateCurrentReport({ incidentType: type });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Select the type of incident you are reporting:
      </Text>

      {incidentOptions.map((option) => (
        <TouchableOpacity
          key={option.type}
          style={[
            styles.optionCard,
            selectedType === option.type && styles.optionCardSelected,
            selectedType === option.type && { borderColor: option.color }
          ]}
          onPress={() => handleSelect(option.type)}
        >
          <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
            <Ionicons name={option.icon} size={28} color={Colors.white} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
          <View style={[
            styles.radio,
            selectedType === option.type && { borderColor: option.color }
          ]}>
            {selectedType === option.type && (
              <View style={[styles.radioInner, { backgroundColor: option.color }]} />
            )}
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Select the category that best describes what happened. You can provide 
          more details in the following steps.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  instruction: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  optionCardSelected: {
    borderWidth: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.grayMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
