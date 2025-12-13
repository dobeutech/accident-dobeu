import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { useI18n, Language, languageLabels } from '../../lib/i18n';
import { Colors, Shadows } from '../../theme/colors';

const languages: Language[] = ['en', 'es', 'fr'];
const languageFlags: Record<Language, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
};

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { queue, isOnline, lastSyncTime } = useSyncStore();
  const { t, language, setLanguage } = useI18n();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;

  const handleLogout = () => {
    Alert.alert(
      t('profile.signOut'),
      'Are you sure you want to sign out? Any unsaved drafts will be preserved.',
      [
        { text: t('action.cancel'), style: 'cancel' },
        { text: t('profile.signOut'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const getRoleName = (role: string) => {
    const roleKey = role === 'super_admin' ? 'superAdmin' 
      : role === 'fleet_admin' ? 'fleetAdmin'
      : role === 'fleet_manager' ? 'fleetManager'
      : role === 'fleet_viewer' ? 'fleetViewer'
      : 'driver';
    return t(`role.${roleKey}`);
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  return (
    <ScrollView style={styles.container} accessibilityRole="scrollbar">
      {/* Profile Header */}
      <View style={styles.header} accessibilityRole="header">
        <View 
          style={styles.avatarContainer}
          accessibilityLabel={`Profile picture for ${user?.firstName} ${user?.lastName}`}
        >
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.userName} accessibilityRole="text">
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleName(user?.role || '')}</Text>
        </View>
      </View>

      {/* Sync Status Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('profile.syncStatus')}
        </Text>
        <View 
          style={styles.syncCard}
          accessibilityLabel={`Sync status: ${isOnline ? 'Online' : 'Offline'}, ${pendingCount} pending items`}
        >
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
              <Text style={styles.syncLabel}>{t('profile.pendingUploads')}</Text>
              <Text style={styles.syncValue}>{pendingCount} items</Text>
            </View>
          </View>
          
          {failedCount > 0 && (
            <View style={styles.failedRow} accessibilityRole="alert">
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
        <Text style={styles.sectionTitle} accessibilityRole="header">Account</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <Ionicons name="person-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            accessibilityRole="button"
            accessibilityLabel="Change Password"
          >
            <Ionicons name="lock-closed-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemLast]}
            accessibilityRole="button"
            accessibilityLabel="Notifications settings"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">App</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowLanguageModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Language: ${languageLabels[language]}. Tap to change.`}
          >
            <Ionicons name="language-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>{t('profile.language')}</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.languageFlag}>{languageFlags[language]}</Text>
              <Text style={styles.menuItemValue}>{languageLabels[language]}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            accessibilityRole="button"
            accessibilityLabel="Help and Support"
          >
            <Ionicons name="help-circle-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemLast]}
            accessibilityRole="button"
            accessibilityLabel="Terms and Privacy"
          >
            <Ionicons name="document-text-outline" size={22} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel={t('profile.signOut')}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>{t('app.name')} v1.0.0</Text>
      </View>

      <View style={styles.bottomPadding} />

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
          accessibilityLabel="Close language selection"
        >
          <View 
            style={styles.modalContent}
            accessibilityRole="menu"
            accessibilityLabel="Select language"
          >
            <Text style={styles.modalTitle}>{t('profile.language')}</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageSelect(lang)}
                accessibilityRole="menuitem"
                accessibilityLabel={languageLabels[lang]}
                accessibilityState={{ selected: language === lang }}
              >
                <Text style={styles.languageOptionFlag}>{languageFlags[lang]}</Text>
                <Text style={[
                  styles.languageOptionText,
                  language === lang && styles.languageOptionTextActive,
                ]}>
                  {languageLabels[lang]}
                </Text>
                {language === lang && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.modalCloseText}>{t('action.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    minHeight: 56, // Accessibility - minimum touch target
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
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
  languageFlag: {
    fontSize: 18,
    marginRight: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    minHeight: 56, // Accessibility - minimum touch target
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    ...Shadows.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 56, // Accessibility - minimum touch target
  },
  languageOptionActive: {
    backgroundColor: Colors.primaryLight + '15',
  },
  languageOptionFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  languageOptionTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 56, // Accessibility - minimum touch target
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
