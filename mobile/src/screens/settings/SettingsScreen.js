import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { isOnline, pendingSyncs, syncPendingItems } = useSync();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleSync = async () => {
    try {
      await syncPendingItems();
      Alert.alert('Success', 'Sync completed');
    } catch (error) {
      Alert.alert('Error', 'Sync failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role:</Text>
          <Text style={styles.infoValue}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: isOnline ? '#34C759' : '#FF3B30' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pending Syncs:</Text>
          <Text style={styles.infoValue}>{pendingSyncs}</Text>
        </View>
        {pendingSyncs > 0 && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333'
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 120
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  syncButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

