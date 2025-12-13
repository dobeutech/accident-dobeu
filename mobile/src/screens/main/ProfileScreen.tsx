import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { Colors, Shadows } from '../../theme/colors';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { queue, isOnline, lastSyncTime } = useSyncStore();

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Any unsaved drafts will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrator';
      case 'fleet_admin': return 'Fleet Administrator';
      case 'fleet_manager': return 'Fleet Manager';
      case 'fleet_viewer': return 'Fleet Viewer';
      case 'driver': return 'Driver';
      default: return role;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleName(user?.role || '')}</Text>
        </View>
      </View>

      {/* Sync Status Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.syncCard}>
          <View style={styles.syncRow}>
            <View style={styles.syncItem}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isOnline ? Colors.success : Colors.error }
              ]} />
              <Text style={styles.syncLabel}>Connection</Text>
              <Text style={styles.syncValue}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.syncItem}>
              <Ionicons 
                name="cloud-upload-outline" 
                size={20} 
                color={pendingCount > 0 ? Colors.warning : Colors.success} 
              />
              <Text style={styles.syncLabel}>Pending</Text>
              <Text style={styles.syncValue}>{pendingCount} items</Text>
            </View>
          </View>
          
          {failedCount > 0 && (
            <View style={styles.failedRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.failedText}>
                {failedCount} item{failedCount > 1 ? 's' : ''} failed to sync
              </Text>
            </View>
          )}
          
          {lastSyncTime && (
            <Text style={styles.lastSyncText}>
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="language-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Language</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>English</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Fleet Accident Reporter v1.0.0</Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.small,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  syncItem: {
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  syncLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  syncValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  failedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  failedText: {
    fontSize: 13,
    color: Colors.error,
  },
  lastSyncText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuItemValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    ...Shadows.small,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottomPadding: {
    height: 32,
  },
});
