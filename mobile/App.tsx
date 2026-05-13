/**
 * Vigilix — Smart Mobile Surveillance
 *
 * Root application with theme provider, font loading, and bottom tab navigation.
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
import { SplashScreen, HomeScreen, CameraScreen, ViewerScreen, SettingsScreen } from './src/screens';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { useAppStore } from './src/store/appStore';

type Screen = 'splash' | 'home' | 'camera' | 'viewer' | 'settings';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const { setMode, resetState } = useAppStore();
  const { theme } = useTheme();

  const handleSplashFinish = useCallback(() => {
    setCurrentScreen('home');
  }, []);

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

  // Immersive screens hide the tab bar
  const showTabBar =
    currentScreen !== 'splash' &&
    currentScreen !== 'camera' &&
    currentScreen !== 'viewer';

  return (
    <View style={[styles.root, { backgroundColor: theme.bg.primary }]}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.bg.primary}
        translucent={currentScreen === 'camera' || currentScreen === 'viewer'}
      />

      <View style={styles.screenContainer}>
        {currentScreen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
        {currentScreen === 'home' && <HomeScreen onSelectMode={handleSelectMode} />}
        {currentScreen === 'camera' && <CameraScreen onBack={handleBack} />}
        {currentScreen === 'viewer' && <ViewerScreen onBack={handleBack} />}
        {currentScreen === 'settings' && <SettingsScreen onBack={handleBack} />}
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
