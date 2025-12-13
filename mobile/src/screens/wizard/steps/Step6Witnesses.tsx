import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';

interface Witness {
  id: string;
  name: string;
  phone: string;
  email: string;
  statement: string;
}

export function Step6Witnesses() {
  const { currentReport, updateCustomField } = useReportStore();
  const customFields = currentReport?.customFields || {};
  
  const [witnesses, setWitnesses] = useState<Witness[]>(
    customFields.witnesses || []
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addWitness = () => {
    const newWitness: Witness = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      email: '',
      statement: '',
    };
    const updated = [...witnesses, newWitness];
    setWitnesses(updated);
    updateCustomField('witnesses', updated);
    setExpandedId(newWitness.id);
  };

  const removeWitness = (id: string) => {
    Alert.alert(
      'Remove Witness',
      'Are you sure you want to remove this witness?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const updated = witnesses.filter(w => w.id !== id);
            setWitnesses(updated);
            updateCustomField('witnesses', updated);
          }
        },
      ]
    );
  };

  const updateWitness = (id: string, field: keyof Witness, value: string) => {
    const updated = witnesses.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    );
    setWitnesses(updated);
    updateCustomField('witnesses', updated);
  };

  return (
    <View style={styles.container}>
      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="people" size={24} color={Colors.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Witness Information</Text>
          <Text style={styles.infoDescription}>
            Witnesses can provide valuable accounts of the incident. 
            Collect their contact information if possible.
          </Text>
        </View>
      </View>

      {/* Witness Count */}
      <View style={styles.countCard}>
        <Text style={styles.countText}>
          {witnesses.length} witness{witnesses.length !== 1 ? 'es' : ''} added
        </Text>
      </View>

      {/* Witnesses List */}
      {witnesses.map((witness, index) => (
        <View key={witness.id} style={styles.witnessCard}>
          <TouchableOpacity 
            style={styles.witnessHeader}
            onPress={() => setExpandedId(
              expandedId === witness.id ? null : witness.id
            )}
          >
            <View style={styles.witnessNumber}>
              <Text style={styles.witnessNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.witnessName}>
              {witness.name || `Witness ${index + 1}`}
            </Text>
            <View style={styles.witnessActions}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => removeWitness(witness.id)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
              <Ionicons 
                name={expandedId === witness.id ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={Colors.gray} 
              />
            </View>
          </TouchableOpacity>

          {expandedId === witness.id && (
            <View style={styles.witnessForm}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Witness name"
                  placeholderTextColor={Colors.textMuted}
                  value={witness.name}
                  onChangeText={(text) => updateWitness(witness.id, 'name', text)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  value={witness.phone}
                  onChangeText={(text) => updateWitness(witness.id, 'phone', text)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={witness.email}
                  onChangeText={(text) => updateWitness(witness.id, 'email', text)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Brief Statement (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What did they see?"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={witness.statement}
                  onChangeText={(text) => updateWitness(witness.id, 'statement', text)}
                />
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Add Witness Button */}
      <TouchableOpacity style={styles.addButton} onPress={addWitness}>
        <Ionicons name="add-circle" size={24} color={Colors.primary} />
        <Text style={styles.addButtonText}>Add Witness</Text>
      </TouchableOpacity>

      {/* Tips */}
      {witnesses.length === 0 && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Tips for Collecting Witness Info</Text>
          <Text style={styles.tipItem}>
            • Ask bystanders if they saw what happened
          </Text>
          <Text style={styles.tipItem}>
            • Get their contact information for insurance follow-up
          </Text>
          <Text style={styles.tipItem}>
            • A brief written statement can be helpful
          </Text>
          <Text style={styles.tipItem}>
            • If no witnesses, you can skip this step
          </Text>
        </View>
      )}
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
  countCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  witnessCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadows.small,
  },
  witnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  witnessNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  witnessNumberText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  witnessName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  witnessActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  witnessForm: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fieldGroup: {
    marginBottom: 16,
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
    minHeight: 80,
    paddingTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  tipsBox: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
