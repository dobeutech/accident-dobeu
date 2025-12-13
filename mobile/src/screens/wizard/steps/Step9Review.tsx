import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';

interface Step9ReviewProps {
  onSubmit: () => void;
}

export function Step9Review({ onSubmit }: Step9ReviewProps) {
  const { currentReport, setCurrentStep } = useReportStore();
  const customFields = currentReport?.customFields || {};
  const photos = currentReport?.photos || [];
  const audioRecordings = currentReport?.audio || [];

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'accident': return 'Vehicle Accident';
      case 'incident': return 'Injury/Incident';
      case 'near_miss': return 'Near Miss';
      default: return type;
    }
  };

  const getIncidentColor = (type: string) => {
    switch (type) {
      case 'accident': return Colors.incidentAccident;
      case 'incident': return Colors.incidentIncident;
      case 'near_miss': return Colors.incidentNearMiss;
      default: return Colors.gray;
    }
  };

  const renderSection = (
    title: string, 
    icon: keyof typeof Ionicons.glyphMap, 
    stepIndex: number,
    content: React.ReactNode,
    isComplete: boolean = true
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[
          styles.sectionIcon,
          { backgroundColor: isComplete ? Colors.success + '20' : Colors.warning + '20' }
        ]}>
          <Ionicons 
            name={icon} 
            size={18} 
            color={isComplete ? Colors.success : Colors.warning} 
          />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setCurrentStep(stepIndex)}
        >
          <Ionicons name="pencil" size={16} color={Colors.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContent}>
        {content}
      </View>
    </View>
  );

  const hasRequiredFields = 
    currentReport?.incidentType &&
    (currentReport?.latitude || currentReport?.address) &&
    customFields.driver_statement &&
    customFields.signature;

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      <View style={[
        styles.statusBanner,
        { backgroundColor: hasRequiredFields ? Colors.success + '15' : Colors.warning + '15' }
      ]}>
        <Ionicons 
          name={hasRequiredFields ? 'checkmark-circle' : 'alert-circle'} 
          size={24} 
          color={hasRequiredFields ? Colors.success : Colors.warning} 
        />
        <View style={styles.statusText}>
          <Text style={[
            styles.statusTitle,
            { color: hasRequiredFields ? Colors.success : Colors.warning }
          ]}>
            {hasRequiredFields ? 'Ready to Submit' : 'Missing Required Fields'}
          </Text>
          <Text style={styles.statusDescription}>
            {hasRequiredFields 
              ? 'Review your report below and submit when ready'
              : 'Please complete all required fields before submitting'}
          </Text>
        </View>
      </View>

      {/* Incident Type */}
      {renderSection(
        'Incident Type',
        'alert-circle',
        0,
        <View style={styles.incidentBadge}>
          <View style={[
            styles.incidentDot,
            { backgroundColor: getIncidentColor(currentReport?.incidentType || '') }
          ]} />
          <Text style={styles.incidentText}>
            {getIncidentTypeLabel(currentReport?.incidentType || '')}
          </Text>
        </View>,
        !!currentReport?.incidentType
      )}

      {/* Location */}
      {renderSection(
        'Location',
        'location',
        1,
        <View>
          {currentReport?.address ? (
            <Text style={styles.value}>{currentReport.address}</Text>
          ) : currentReport?.latitude ? (
            <Text style={styles.value}>
              {currentReport.latitude.toFixed(6)}, {currentReport.longitude?.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.missingText}>No location captured</Text>
          )}
        </View>,
        !!(currentReport?.latitude || currentReport?.address)
      )}

      {/* Photos */}
      {renderSection(
        'Photos',
        'camera',
        2,
        <View>
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosRow}>
                {photos.slice(0, 5).map((photo) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.localUri }}
                    style={styles.photoThumbnail}
                  />
                ))}
                {photos.length > 5 && (
                  <View style={styles.morePhotos}>
                    <Text style={styles.morePhotosText}>+{photos.length - 5}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.missingText}>No photos captured</Text>
          )}
        </View>,
        true // Optional field
      )}

      {/* Vehicle Info */}
      {renderSection(
        'Your Vehicle',
        'car',
        3,
        <View style={styles.detailsList}>
          {customFields.vehicle_number && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Unit #:</Text>
              <Text style={styles.value}>{customFields.vehicle_number}</Text>
            </View>
          )}
          {(customFields.vehicle_year || customFields.vehicle_make || customFields.vehicle_model) && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Vehicle:</Text>
              <Text style={styles.value}>
                {[customFields.vehicle_year, customFields.vehicle_make, customFields.vehicle_model]
                  .filter(Boolean).join(' ')}
              </Text>
            </View>
          )}
          {customFields.vehicle_plate && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Plate:</Text>
              <Text style={styles.value}>{customFields.vehicle_plate}</Text>
            </View>
          )}
          {customFields.damage_description && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Damage:</Text>
              <Text style={styles.value} numberOfLines={2}>{customFields.damage_description}</Text>
            </View>
          )}
        </View>,
        true
      )}

      {/* Other Party */}
      {customFields.has_other_party && renderSection(
        'Other Party',
        'people',
        4,
        <View style={styles.detailsList}>
          {(customFields.other_driver_first_name || customFields.other_driver_last_name) && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Driver:</Text>
              <Text style={styles.value}>
                {[customFields.other_driver_first_name, customFields.other_driver_last_name]
                  .filter(Boolean).join(' ')}
              </Text>
            </View>
          )}
          {customFields.other_vehicle_make && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Vehicle:</Text>
              <Text style={styles.value}>
                {[customFields.other_vehicle_year, customFields.other_vehicle_make, customFields.other_vehicle_model]
                  .filter(Boolean).join(' ')}
              </Text>
            </View>
          )}
          {customFields.other_insurance_company && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Insurance:</Text>
              <Text style={styles.value}>{customFields.other_insurance_company}</Text>
            </View>
          )}
        </View>,
        true
      )}

      {/* Witnesses */}
      {customFields.witnesses && customFields.witnesses.length > 0 && renderSection(
        'Witnesses',
        'person-add',
        5,
        <Text style={styles.value}>
          {customFields.witnesses.length} witness{customFields.witnesses.length > 1 ? 'es' : ''} recorded
        </Text>,
        true
      )}

      {/* Statement */}
      {renderSection(
        'Your Statement',
        'document-text',
        6,
        <View>
          {customFields.driver_statement ? (
            <Text style={styles.statementPreview} numberOfLines={4}>
              {customFields.driver_statement}
            </Text>
          ) : (
            <Text style={styles.missingText}>No statement provided</Text>
          )}
          {audioRecordings.length > 0 && (
            <View style={styles.audioCount}>
              <Ionicons name="mic" size={14} color={Colors.secondary} />
              <Text style={styles.audioCountText}>
                {audioRecordings.length} voice recording{audioRecordings.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>,
        !!customFields.driver_statement
      )}

      {/* Signature */}
      {renderSection(
        'Signature',
        'create',
        7,
        <View>
          {customFields.signature ? (
            <View style={styles.signatureComplete}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.signatureText}>Signed</Text>
              {customFields.signature_timestamp && (
                <Text style={styles.signatureTime}>
                  {new Date(customFields.signature_timestamp).toLocaleString()}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.missingText}>Signature required</Text>
          )}
        </View>,
        !!customFields.signature
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !hasRequiredFields && styles.submitButtonDisabled
        ]}
        onPress={onSubmit}
        disabled={!hasRequiredFields}
      >
        <Ionicons name="cloud-upload" size={22} color={Colors.white} />
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight + '20',
  },
  editText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  sectionContent: {
    paddingLeft: 42,
  },
  incidentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incidentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  incidentText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  detailsList: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
  },
  label: {
    width: 70,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  missingText: {
    fontSize: 14,
    color: Colors.warning,
    fontStyle: 'italic',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.grayLight,
  },
  morePhotos: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statementPreview: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  audioCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  audioCountText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  signatureComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signatureText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
  },
  signatureTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    marginTop: 8,
    ...Shadows.medium,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.grayMedium,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});
