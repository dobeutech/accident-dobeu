import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/authStore';
import { useI18n, languageLabels, Language } from '../../lib/i18n';
import { Colors, Shadows } from '../../theme/colors';

export function LoginScreen() {
  const { t, language, setLanguage } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages: Language[] = ['en', 'es', 'fr'];
  const languageFlags: Record<Language, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
            accessibilityRole="button"
            accessibilityLabel={`Current language: ${languageLabels[language]}. Tap to change.`}
          >
            <Text style={styles.languageFlag}>{languageFlags[language]}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {showLanguageMenu && (
            <View style={styles.languageMenu}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    language === lang && styles.languageOptionActive,
                  ]}
                  onPress={() => {
                    setLanguage(lang);
                    setShowLanguageMenu(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={languageLabels[lang]}
                >
                  <Text style={styles.languageFlag}>{languageFlags[lang]}</Text>
                  <Text style={[
                    styles.languageLabel,
                    language === lang && styles.languageLabelActive,
                  ]}>
                    {languageLabels[lang]}
                  </Text>
                  {language === lang && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.header}>
          <View style={styles.logoContainer} accessibilityRole="image">
            <Ionicons name="car" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {t('app.name')}
          </Text>
          <Text style={styles.subtitle}>
            {t('app.tagline')}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              accessibilityLabel={t('auth.email')}
              accessibilityHint="Enter your email address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isSubmitting}
              accessibilityLabel={t('auth.password')}
              accessibilityHint="Enter your password"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={Colors.gray} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={t('auth.signInButton')}
            accessibilityState={{ disabled: isSubmitting }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} accessibilityLabel="Signing in" />
            ) : (
              <Text style={styles.loginButtonText}>{t('auth.signInButton')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPassword}
            accessibilityRole="link"
            accessibilityLabel={t('auth.forgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Contact your fleet administrator for account access
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  languageContainer: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    ...Shadows.small,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    ...Shadows.medium,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: Colors.grayLight,
  },
  languageLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  languageLabelActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Shadows.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    ...Shadows.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56, // Accessibility - minimum touch target
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  eyeButton: {
    padding: 8,
    minWidth: 44, // Accessibility - minimum touch target
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56, // Accessibility - minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
    minHeight: 44, // Accessibility - minimum touch target
    justifyContent: 'center',
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
