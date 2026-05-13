/**
 * Vigilix — Smart Mobile Surveillance
 *
 * Root application with auth flow, theme provider, font loading, and bottom tab navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from './src/design/ThemeContext';
import {
  SplashScreen,
  HomeScreen,
  CameraScreen,
  ViewerScreen,
  SettingsScreen,
  WelcomeScreen,
  AuthScreen,
} from './src/screens';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { useAppStore } from './src/store/appStore';
import { useAuthStore } from './src/store/authStore';

type Screen = 'splash' | 'welcome' | 'login' | 'register' | 'home' | 'camera' | 'viewer' | 'settings';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const { setMode, resetState } = useAppStore();
  const { theme } = useTheme();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  const handleSplashFinish = useCallback(() => {
    if (isInitialized) {
      setCurrentScreen(isAuthenticated ? 'home' : 'welcome');
    } else {
      // Auth still loading — show welcome for now, will redirect after init
      setCurrentScreen('welcome');
    }
  }, [isAuthenticated, isInitialized]);

  // When auth state changes after splash
  useEffect(() => {
    if (isInitialized && currentScreen === 'welcome' && isAuthenticated) {
      setCurrentScreen('home');
    }
  }, [isAuthenticated, isInitialized, currentScreen]);

  const handleSelectMode = useCallback((mode: 'camera' | 'viewer') => {
    setMode(mode);
    setCurrentScreen(mode);
  }, [setMode]);

  const handleBack = useCallback(() => {
    resetState();
    setCurrentScreen('home');
  }, [resetState]);

  const handleTabPress = useCallback((key: string) => {
    if (key === 'home') {
      resetState();
      setCurrentScreen('home');
    } else if (key === 'camera') {
      setMode('camera');
      setCurrentScreen('camera');
    } else if (key === 'viewer') {
      setMode('viewer');
      setCurrentScreen('viewer');
    } else if (key === 'settings') {
      setCurrentScreen('settings');
    }
  }, [setMode, resetState]);

  // Handle logout from settings
  const handleLogout = useCallback(() => {
    resetState();
    setCurrentScreen('welcome');
  }, [resetState]);

  // Immersive screens hide the tab bar
  const showTabBar =
    currentScreen !== 'splash' &&
    currentScreen !== 'welcome' &&
    currentScreen !== 'login' &&
    currentScreen !== 'register' &&
    currentScreen !== 'camera' &&
    currentScreen !== 'viewer';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg.primary }]}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.bg.primary}
        translucent={
          currentScreen === 'camera' ||
          currentScreen === 'viewer' ||
          currentScreen === 'splash' ||
          currentScreen === 'welcome'
        }
      />

      <View style={styles.screenContainer}>
        {currentScreen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}

        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onLogin={() => setCurrentScreen('login')}
            onRegister={() => setCurrentScreen('register')}
          />
        )}

        {currentScreen === 'login' && (
          <AuthScreen
            mode="login"
            onSwitchMode={() => setCurrentScreen('register')}
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'register' && (
          <AuthScreen
            mode="register"
            onSwitchMode={() => setCurrentScreen('login')}
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'home' && <HomeScreen onSelectMode={handleSelectMode} />}
        {currentScreen === 'camera' && <CameraScreen onBack={handleBack} />}
        {currentScreen === 'viewer' && <ViewerScreen onBack={handleBack} />}
        {currentScreen === 'settings' && <SettingsScreen onBack={handleBack} onLogout={handleLogout} />}
      </View>

      {showTabBar && (
        <BottomTabBar activeTab={currentScreen} onTabPress={handleTabPress} />
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1121',
  },
});
