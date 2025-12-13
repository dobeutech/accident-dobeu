import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';
import { ReportAudio } from '../../../types';

export function Step7Statement() {
  const { currentReport, updateCustomField, addAudio, removeAudio } = useReportStore();
  const customFields = currentReport?.customFields || {};
  const audioRecordings = currentReport?.audio || [];
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    updateCustomField(key, value);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is needed to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        const newAudio: ReportAudio = {
          id: uuidv4(),
          localUri: uri,
          durationSeconds: recordingDuration,
          description: `Voice statement ${audioRecordings.length + 1}`,
          uploadStatus: 'pending',
        };
        addAudio(newAudio);
      }

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to save recording');
      setIsRecording(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRemoveAudio = (audioId: string) => {
    Alert.alert(
      'Remove Recording',
      'Are you sure you want to remove this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeAudio(audioId) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.infoCard}>
        <Ionicons name="document-text" size={24} color={Colors.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Your Statement</Text>
          <Text style={styles.infoDescription}>
            Describe what happened in your own words. Be as detailed as possible 
            about the events leading up to, during, and after the incident.
          </Text>
        </View>
      </View>

      {/* Written Statement */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="create" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Written Statement</Text>
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what happened...

For example:
• What were you doing before the incident?
• What happened during the incident?
• What did you do after the incident?
• What were the weather and road conditions?
• Were there any injuries?"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          value={customFields.driver_statement || ''}
          onChangeText={(text) => handleFieldChange('driver_statement', text)}
        />

        <Text style={styles.charCount}>
          {(customFields.driver_statement || '').length} characters
        </Text>
      </View>

      {/* Voice Recording */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="mic" size={20} color={Colors.secondary} />
          <Text style={styles.cardTitle}>Voice Recording (Optional)</Text>
        </View>

        <Text style={styles.recordingHint}>
          Sometimes it's easier to speak than type. Record your statement 
          as a voice memo.
        </Text>

        {/* Recording Controls */}
        <View style={styles.recordingControls}>
          {isRecording ? (
            <View style={styles.recordingActive}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
              <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
              <TouchableOpacity 
                style={styles.stopButton}
                onPress={stopRecording}
              >
                <Ionicons name="stop" size={32} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={startRecording}
            >
              <Ionicons name="mic" size={32} color={Colors.white} />
              <Text style={styles.recordButtonText}>Tap to Record</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recordings List */}
        {audioRecordings.length > 0 && (
          <View style={styles.recordingsList}>
            <Text style={styles.recordingsTitle}>
              Saved Recordings ({audioRecordings.length})
            </Text>
            {audioRecordings.map((audio, index) => (
              <View key={audio.id} style={styles.recordingItem}>
                <View style={styles.recordingIcon}>
                  <Ionicons name="volume-high" size={20} color={Colors.primary} />
                </View>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingName}>Recording {index + 1}</Text>
                  {audio.durationSeconds && (
                    <Text style={styles.recordingDuration}>
                      {formatDuration(audio.durationSeconds)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => handleRemoveAudio(audio.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>📝 Statement Tips</Text>
        <Text style={styles.tipItem}>• Stick to the facts - what you saw and did</Text>
        <Text style={styles.tipItem}>• Include specific details like speeds and distances</Text>
        <Text style={styles.tipItem}>• Mention weather, lighting, and road conditions</Text>
        <Text style={styles.tipItem}>• Don't admit fault or speculate</Text>
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
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
    minHeight: 200,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  recordingHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  recordingControls: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  recordButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  recordingActive: {
    alignItems: 'center',
    gap: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  durationText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  recordingsList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recordingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recordingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  recordingDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  removeButton: {
    padding: 8,
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
