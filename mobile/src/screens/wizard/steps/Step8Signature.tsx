import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SignatureCanvas from 'react-native-signature-canvas';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';

export function Step8Signature() {
  const { currentReport, updateCustomField } = useReportStore();
  const customFields = currentReport?.customFields || {};
  
  const signatureRef = useRef<any>(null);
  const [signatureData, setSignatureData] = useState<string | null>(
    customFields.signature || null
  );
  const [isEditing, setIsEditing] = useState(!signatureData);

  const handleSignature = (signature: string) => {
    setSignatureData(signature);
    updateCustomField('signature', signature);
    updateCustomField('signature_timestamp', new Date().toISOString());
    setIsEditing(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
    updateCustomField('signature', null);
    updateCustomField('signature_timestamp', null);
  };

  const handleRedo = () => {
    setIsEditing(true);
    setSignatureData(null);
  };

  const webStyle = `.m-signature-pad {
    box-shadow: none;
    border: none;
    background-color: ${Colors.grayLight};
    border-radius: 8px;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body, html {
    background-color: ${Colors.grayLight};
  }`;

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.infoCard}>
        <Ionicons name="create" size={24} color={Colors.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Driver Signature</Text>
          <Text style={styles.infoDescription}>
            Your signature confirms that the information provided in this 
            report is accurate to the best of your knowledge.
          </Text>
        </View>
      </View>

      {/* Signature Card */}
      <View style={styles.signatureCard}>
        <View style={styles.signatureHeader}>
          <Text style={styles.signatureLabel}>Sign Here</Text>
          {signatureData && (
            <TouchableOpacity onPress={handleRedo} style={styles.redoButton}>
              <Ionicons name="refresh" size={18} color={Colors.primary} />
              <Text style={styles.redoText}>Redo</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.signatureContainer}>
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Error', 'Please sign before confirming')}
              webStyle={webStyle}
              autoClear={false}
              descriptionText=""
              clearText="Clear"
              confirmText="Confirm"
              backgroundColor={Colors.grayLight}
              penColor={Colors.textPrimary}
            />
          </View>
        ) : (
          <View style={styles.signedContainer}>
            <View style={styles.signaturePreview}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.signedText}>Signature Captured</Text>
              {customFields.signature_timestamp && (
                <Text style={styles.timestampText}>
                  Signed at {new Date(customFields.signature_timestamp).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {isEditing && (
          <View style={styles.signatureActions}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={() => signatureRef.current?.readSignature()}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.confirmButtonText}>Confirm Signature</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Acknowledgment */}
      <View style={styles.acknowledgmentCard}>
        <Text style={styles.acknowledgmentTitle}>Driver Acknowledgment</Text>
        <Text style={styles.acknowledgmentText}>
          By signing this report, I acknowledge that:
        </Text>
        <View style={styles.acknowledgmentList}>
          <Text style={styles.acknowledgmentItem}>
            • I was the driver of the vehicle at the time of the incident
          </Text>
          <Text style={styles.acknowledgmentItem}>
            • The information I have provided is true and accurate to the best of my knowledge
          </Text>
          <Text style={styles.acknowledgmentItem}>
            • I understand this report may be used for insurance and legal purposes
          </Text>
          <Text style={styles.acknowledgmentItem}>
            • I will cooperate with any further investigation if required
          </Text>
        </View>
      </View>

      {/* Warning */}
      <View style={styles.warningBox}>
        <Ionicons name="warning" size={20} color={Colors.warning} />
        <Text style={styles.warningText}>
          Providing false information on an accident report may have legal consequences. 
          Please ensure all information is accurate before signing.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.small,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  signatureCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  redoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  redoText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  signatureContainer: {
    height: 200,
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  signedContainer: {
    height: 150,
    backgroundColor: Colors.success + '15',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePreview: {
    alignItems: 'center',
    gap: 8,
  },
  signedText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  signatureActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  acknowledgmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  acknowledgmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  acknowledgmentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  acknowledgmentList: {
    gap: 8,
  },
  acknowledgmentItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
