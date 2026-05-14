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
import DeviceSetupScreen from './src/screens/DeviceSetupScreen';
import RecordingsScreen from './src/screens/RecordingsScreen';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { useAppStore } from './src/store/appStore';
import { useAuthStore } from './src/store/authStore';

type Screen = 'splash' | 'welcome' | 'login' | 'register' | 'device-setup' | 'home' | 'camera' | 'viewer' | 'settings' | 'recordings';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const { setMode, resetState } = useAppStore();
  const { theme } = useTheme();
  const { isAuthenticated, isInitialized, initialize, devices } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  const handleSplashFinish = useCallback(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        // Check if user has set up a device yet
        setCurrentScreen(devices.length === 0 ? 'device-setup' : 'home');
      } else {
        setCurrentScreen('welcome');
      }
    } else {
      setCurrentScreen('welcome');
    }
  }, [isAuthenticated, isInitialized, devices]);

  // When auth state changes after splash
  useEffect(() => {
    if (isInitialized && currentScreen === 'welcome' && isAuthenticated) {
      setCurrentScreen(devices.length === 0 ? 'device-setup' : 'home');
    }
  }, [isAuthenticated, isInitialized, currentScreen, devices]);

  const handleSelectMode = useCallback((mode: 'camera' | 'viewer') => {
    setMode(mode);
    setCurrentScreen(mode);
  }, [setMode]);

  // Auto-connect to a saved camera's room
  const handleConnectCamera = useCallback((roomCode: string) => {
    setMode('viewer');
    // Store the room code so ViewerScreen can auto-join
    useAppStore.getState().setRoomCode(roomCode);
    setCurrentScreen('viewer');
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
    } else if (key === 'recordings') {
      setCurrentScreen('recordings');
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
    currentScreen !== 'device-setup' &&
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

        {currentScreen === 'device-setup' && (
          <DeviceSetupScreen onComplete={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onSelectMode={handleSelectMode}
            onConnectCamera={handleConnectCamera}
          />
        )}
        {currentScreen === 'camera' && <CameraScreen onBack={handleBack} />}
        {currentScreen === 'viewer' && <ViewerScreen onBack={handleBack} />}
        {currentScreen === 'recordings' && <RecordingsScreen onBack={handleBack} />}
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
