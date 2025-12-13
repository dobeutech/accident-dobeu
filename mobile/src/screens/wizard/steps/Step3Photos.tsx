import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';

import { useReportStore } from '../../../stores/reportStore';
import { Colors, Shadows } from '../../../theme/colors';
import { ReportPhoto } from '../../../types';

const photoPrompts = [
  { id: 'damage_front', label: 'Front of Your Vehicle', icon: 'car' },
  { id: 'damage_rear', label: 'Rear of Your Vehicle', icon: 'car' },
  { id: 'damage_left', label: 'Left Side Damage', icon: 'car' },
  { id: 'damage_right', label: 'Right Side Damage', icon: 'car' },
  { id: 'other_vehicle', label: 'Other Vehicle', icon: 'car-sport' },
  { id: 'license_plate', label: 'License Plate', icon: 'card' },
  { id: 'scene_wide', label: 'Wide Scene Shot', icon: 'image' },
  { id: 'road_conditions', label: 'Road Conditions', icon: 'trail-sign' },
  { id: 'traffic_signs', label: 'Traffic Signs/Signals', icon: 'stop' },
  { id: 'other', label: 'Other Evidence', icon: 'camera' },
];

export function Step3Photos() {
  const { currentReport, addPhoto, removePhoto } = useReportStore();
  const photos = currentReport?.photos || [];

  const pickImage = async (promptId?: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: ReportPhoto = {
          id: uuidv4(),
          localUri: result.assets[0].uri,
          description: promptId,
          orderIndex: photos.length,
          uploadStatus: 'pending',
        };
        addPhoto(newPhoto);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is needed to select photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach((asset, index) => {
          const newPhoto: ReportPhoto = {
            id: uuidv4(),
            localUri: asset.uri,
            orderIndex: photos.length + index,
            uploadStatus: 'pending',
          };
          addPhoto(newPhoto);
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePhoto(photoId) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Photo Count */}
      <View style={styles.photoCountCard}>
        <Ionicons name="images" size={24} color={Colors.primary} />
        <Text style={styles.photoCountText}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => pickImage()}>
          <Ionicons name="camera" size={28} color={Colors.white} />
          <Text style={styles.actionButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]} 
          onPress={pickFromGallery}
        >
          <Ionicons name="images" size={28} color={Colors.primary} />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
            From Gallery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Captured Photos */}
      {photos.length > 0 && (
        <View style={styles.capturedSection}>
          <Text style={styles.sectionLabel}>Captured Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosRow}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.localUri }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemovePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                  {photo.uploadStatus === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="cloud-upload" size={12} color={Colors.white} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Photo Prompts */}
      <View style={styles.promptsSection}>
        <Text style={styles.sectionLabel}>Recommended Photos</Text>
        <Text style={styles.sectionHint}>
          Tap to capture specific types of evidence
        </Text>
        <View style={styles.promptsGrid}>
          {photoPrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              style={styles.promptButton}
              onPress={() => pickImage(prompt.id)}
            >
              <Ionicons name={prompt.icon as any} size={20} color={Colors.primary} />
              <Text style={styles.promptLabel}>{prompt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
        <Text style={styles.tipItem}>• Capture all visible damage from multiple angles</Text>
        <Text style={styles.tipItem}>• Include license plates of all vehicles involved</Text>
        <Text style={styles.tipItem}>• Document road conditions and traffic signs</Text>
        <Text style={styles.tipItem}>• Take wide shots showing the entire scene</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  photoCountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.small,
  },
  photoCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButtonTextSecondary: {
    color: Colors.primary,
  },
  capturedSection: {
    gap: 8,
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
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.warning,
    borderRadius: 4,
    padding: 4,
  },
  promptsSection: {
    gap: 8,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
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
