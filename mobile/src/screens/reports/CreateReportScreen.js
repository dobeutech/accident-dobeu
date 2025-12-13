import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { reportStorage } from '../../storage/database';
import { reportService, formConfigService } from '../../services/api';
import { v4 as uuidv4 } from 'uuid';
import DynamicForm from '../../components/DynamicForm';

export default function CreateReportScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formConfigs, setFormConfigs] = useState([]);
  const [formData, setFormData] = useState({});
  const [location, setLocation] = useState(null);
  const { user } = useAuth();
  const { isOnline, queueForSync } = useSync();

  useEffect(() => {
    loadFormConfigs();
    getLocation();
  }, []);

  const loadFormConfigs = async () => {
    try {
      if (isOnline) {
        const response = await formConfigService.getAll();
        setFormConfigs(response.data.form_configs || []);
      }
    } catch (error) {
      console.error('Error loading form configs:', error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      if (address) {
        const addressString = `${address.street || ''} ${address.city || ''}, ${address.region || ''}`.trim();
        setFormData(prev => ({ ...prev, address: addressString }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.incident_type) {
      Alert.alert('Error', 'Please select an incident type');
      return;
    }

    setLoading(true);
    try {
      const reportId = uuidv4();
      const reportNumber = `RPT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      const report = {
        id: reportId,
        fleet_id: user.fleet_id,
        driver_id: user.id,
        report_number: reportNumber,
        incident_type: formData.incident_type,
        incident_date: new Date().toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: formData.address,
        custom_fields: formData,
        status: 'draft',
        is_offline: isOnline ? 0 : 1
      };

      // Save locally
      await reportStorage.save(report);

      // Try to sync if online
      if (isOnline) {
        try {
          await reportService.create(report);
          await reportStorage.update(reportId, { is_offline: 0, synced_at: new Date().toISOString() });
        } catch (error) {
          // Queue for sync if it fails
          await queueForSync('report', reportId, 'create', report);
        }
      } else {
        // Queue for offline sync
        await queueForSync('report', reportId, 'create', report);
      }

      Alert.alert('Success', 'Report created successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Reports') }
      ]);
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Error', 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Report</Text>

        <DynamicForm
          configs={formConfigs}
          data={formData}
          onChange={setFormData}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

