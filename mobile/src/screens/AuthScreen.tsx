import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../design/ThemeContext';
import { VButton, VInput } from '../components/ui';
import { radii, spacing, typography } from '../design/tokens';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onBack: () => void;
}

export default function AuthScreen({ mode, onSwitchMode, onBack }: AuthScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const isLogin = mode === 'login';

  // Listen to keyboard appearance to dynamically expand bottom padding
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = useCallback((yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 120);
  }, []);

  const handleTabChange = (tab: 'login' | 'register') => {
    clearError();
    if (tab !== mode) {
      onSwitchMode(tab);
    }
  };

  const handleSubmit = async () => {
    clearError();

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (isLogin) {
      await login(email.trim(), password);
    } else {
      await register(name.trim(), email.trim(), password);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 10, 24),
              paddingBottom: Math.max(keyboardHeight + 60, insets.bottom + 60, 200),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar matching reference */}
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.kicker, { color: theme.text.secondary }]}>
                VIGILIX ACCOUNT
              </Text>
              <Text style={[styles.screenTitle, { color: theme.text.primary }]}>
                {isLogin ? 'Sign in to access' : 'Create an account'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <ArrowLeft size={16} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: 'rgba(217, 85, 94, 0.1)',
                  borderColor: 'rgba(217, 85, 94, 0.25)',
                },
              ]}
            >
              <AlertCircle size={15} color={theme.status.danger} />
              <Text style={[styles.errorText, { color: theme.status.danger }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface.card,
                borderColor: theme.border.primary,
              },
            ]}
          >
            {/* Segmented Switch */}
            <View
              style={[
                styles.segmentedControl,
                {
                  backgroundColor: theme.surface.surface2,
                  borderColor: theme.border.primary,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTabChange('login')}
                style={[
                  styles.segmentButton,
                  isLogin && [
                    styles.segmentButtonActive,
                    {
                      backgroundColor: theme.surface.card,
                      borderColor: theme.border.primary,
                    },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isLogin ? theme.text.primary : theme.text.secondary,
                      fontWeight: isLogin ? '600' : '500',
                    },
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTabChange('register')}
                style={[
                  styles.segmentButton,
                  !isLogin && [
                    styles.segmentButtonActive,
                    {
                      backgroundColor: theme.surface.card,
                      borderColor: theme.border.primary,
                    },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: !isLogin ? theme.text.primary : theme.text.secondary,
                      fontWeight: !isLogin ? '600' : '500',
                    },
                  ]}
                >
                  Create account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields with stable keys and no autocorrect issues */}
            <View style={styles.formFields}>
              {!isLogin && (
                <VInput
                  key="input_name"
                  label="Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onFocus={() => scrollToInput(40)}
                />
              )}

              <VInput
                key="input_email"
                label="Account Email"
                placeholder="name@domain.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => scrollToInput(isLogin ? 60 : 110)}
              />

              <VInput
                key="input_password"
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => scrollToInput(isLogin ? 140 : 190)}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={theme.text.tertiary} />
                    ) : (
                      <Eye size={16} color={theme.text.tertiary} />
                    )}
                  </TouchableOpacity>
                }
              />

              {!isLogin && (
                <VInput
                  key="input_confirm_password"
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => scrollToInput(270)}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} color={theme.text.tertiary} />
                      ) : (
                        <Eye size={16} color={theme.text.tertiary} />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            </View>

            {/* Forgot Password for login */}
            {isLogin && (
              <View style={styles.forgotRow}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() =>
                    Alert.alert(
                      'Reset Password',
                      'Please contact your system administrator or re-register.'
                    )
                  }
                >
                  <Text style={[styles.linkText, { color: theme.accent.primary }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Security Guarantee Row matching reference */}
            <View
              style={[
                styles.securityRow,
                { borderTopColor: theme.border.primary },
              ]}
            >
              <View style={styles.securityItem}>
                <View
                  style={[
                    styles.secureDot,
                    { backgroundColor: theme.status.success },
                  ]}
                />
                <Text style={[styles.securityText, { color: theme.text.secondary }]}>
                  Secure session
                </Text>
              </View>
              <Text style={[styles.securityText, { color: theme.text.tertiary }]}>
                AES-GCM · Direct
              </Text>
            </View>

            {/* Action CTA */}
            <VButton
              title={isLogin ? 'Sign in' : 'Create account'}
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={isLoading}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  formFields: {
    gap: 12,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 14,
    marginBottom: 16,
    borderTopWidth: 1,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
