/**
 * SplashScreen — Vigilix
 * Plays the official first concept video animation on app launch,
 * with smooth fade transitions, skip control, and fallback timer.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [hasFinished, setHasFinished] = useState(false);

  const handleFinish = useCallback(() => {
    if (hasFinished) return;
    setHasFinished(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [hasFinished, onFinish, fadeAnim]);

  // Safety fallback timer — ensure user is never stuck if video fails to load
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 11000); // video is ~10s

    return () => clearTimeout(safetyTimer);
  }, [handleFinish]);

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        if (status.didJustFinish) {
          handleFinish();
        }
      } else if (status.error) {
        console.warn('[SplashScreen Video Error]:', status.error);
        handleFinish();
      }
    },
    [handleFinish]
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* Splash Video Player */}
      <Video
        ref={videoRef}
        source={require('../../assets/splash-video.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(err) => {
          console.warn('[SplashScreen Error]:', err);
          handleFinish();
        }}
      />

      {/* Skip Button */}
      <View style={[styles.topControls, { top: Math.max(insets.top + 10, 24) }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleFinish}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
          <ChevronRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_W,
    height: SCREEN_H,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topControls: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
