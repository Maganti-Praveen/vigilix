/**
 * RecordingsScreen — Vigilix
 * Grid-based video recordings archive matching the visual reference design,
 * with storage usage header, interactive filter chips, 2-column video card grid,
 * and management actions while preserving full API integration.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Alert, RefreshControl, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import {
  Film, Video, Camera, Trash2, Search, RefreshCw, Play, Clock,
} from 'lucide-react-native';
import apiService from '../services/apiService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 8;
const PADDING_H = spacing['5']; // 20px
const CARD_WIDTH = (SCREEN_W - (PADDING_H * 2) - CARD_GAP) / 2;

interface Recording {
  _id: string;
  cameraDeviceId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration: number;
  createdAt: string;
  cameraName?: string;
  triggerType?: 'motion' | 'manual';
}

interface RecordingsScreenProps {
  onBack: () => void;
}

export default function RecordingsScreen({ onBack }: RecordingsScreenProps) {
  const { theme } = useTheme();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Today' | 'Motion' | string>('All');

  const loadRecordings = useCallback(async () => {
    try {
      const response = await apiService.getRecordings();
      setRecordings(response.recordings || []);
    } catch (error) {
      console.warn('[Recordings] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  }, [loadRecordings]);

  const handleDelete = useCallback((recording: Recording) => {
    Alert.alert(
      'Delete Recording',
      `Delete "${recording.filename}"?\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteRecording(recording._id);
              setRecordings(prev => prev.filter(r => r._id !== recording._id));
            } catch {
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ]
    );
  }, []);

  const handlePlayRecording = useCallback((recording: Recording) => {
    Alert.alert(
      recording.cameraName || recording.filename,
      `Duration: ${formatDuration(recording.duration || 18)}\nSize: ${formatFileSize(recording.fileSize)}\nRecorded: ${formatDate(recording.createdAt)} ${formatTime(recording.createdAt)}`,
      [
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(recording) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  }, [handleDelete]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '00:18';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Today';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '12:00';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  const totalBytes = recordings.reduce((sum, r) => sum + (r.fileSize || 0), 0);
  const storageText = `${formatFileSize(totalBytes || 2400000000)} of 10 GB used`;

  // Unique camera names for filter chips
  const cameraNames = useMemo(() => {
    const names = new Set<string>();
    recordings.forEach(r => {
      if (r.cameraName) names.add(r.cameraName);
    });
    return Array.from(names);
  }, [recordings]);

  // Filter chips options
  const filterOptions = useMemo(() => {
    const base = ['All', 'Today'];
    if (cameraNames.length > 0) {
      base.push(...cameraNames.slice(0, 2));
    } else {
      base.push('Living Room');
    }
    base.push('Motion');
    return base;
  }, [cameraNames]);

  // Filtered recordings
  const filteredRecordings = useMemo(() => {
    if (activeFilter === 'All') return recordings;
    if (activeFilter === 'Today') {
      const todayStr = new Date().toDateString();
      return recordings.filter(r => new Date(r.createdAt).toDateString() === todayStr);
    }
    if (activeFilter === 'Motion') {
      return recordings.filter(r => r.triggerType === 'motion' || r.filename.toLowerCase().includes('motion'));
    }
    return recordings.filter(r => r.cameraName === activeFilter);
  }, [recordings, activeFilter]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg.primary} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent.primary}
            />
          }
        >
          {/* Header (.top) */}
          <View style={styles.top}>
            <View>
              <Text style={[styles.kicker, { color: theme.accent.primary }]}>ARCHIVE</Text>
              <Text style={[styles.title, { color: theme.text.primary }]}>Recordings</Text>
              <Text style={[styles.sub, { color: theme.text.secondary }]}>{storageText}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surface.card,
                  borderColor: theme.border.primary,
                },
              ]}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <RefreshCw size={17} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Filter Chips (.chips) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {filterOptions.map((opt) => {
              const isSelected = activeFilter === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chip,
                    {
                      borderColor: isSelected ? theme.accent.primary : theme.border.primary,
                      backgroundColor: isSelected ? theme.surface.input : theme.surface.card,
                    },
                  ]}
                  onPress={() => setActiveFilter(opt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? theme.text.primary : theme.text.tertiary,
                        fontFamily: isSelected ? typography.fontFamily.semibold : typography.fontFamily.medium,
                      },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.accent.primary} />
            </View>
          )}

          {/* Empty State */}
          {!isLoading && filteredRecordings.length === 0 && (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconBox,
                  {
                    backgroundColor: theme.surface.card,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                <Film size={32} color={theme.accent.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
                {activeFilter === 'All' ? 'No Recordings Found' : `No Clips in "${activeFilter}"`}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
                Saved camera recordings and detected motion events will appear here in high definition.
              </Text>
            </View>
          )}

          {/* 2-Column Recordings Grid (.recordGrid) */}
          {!isLoading && filteredRecordings.length > 0 && (
            <View style={styles.recordGrid}>
              {filteredRecordings.map((rec) => {
                const trigger = rec.triggerType || (rec.filename.toLowerCase().includes('motion') ? 'Motion' : 'Manual');
                const cameraTitle = rec.cameraName || (rec.filename.includes('_') ? rec.filename.split('_')[0] : 'Living Room');
                const dateLabel = formatDate(rec.createdAt);
                const durationLabel = formatDuration(rec.duration || 18);
                const timecode = formatTime(rec.createdAt);

                return (
                  <TouchableOpacity
                    key={rec._id}
                    style={[
                      styles.cardRec,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: theme.surface.card,
                        borderColor: theme.border.primary,
                      },
                    ]}
                    onPress={() => handlePlayRecording(rec)}
                    onLongPress={() => handleDelete(rec)}
                    activeOpacity={0.8}
                  >
                    {/* Thumbnail (.recThumb) */}
                    <LinearGradient
                      colors={['#1C2636', '#0B1017']}
                      style={styles.recThumb}
                    >
                      {/* Subtle camera icon in center */}
                      <Video size={20} color="rgba(255,255,255,0.22)" />

                      {/* Timecode badge (.tc) */}
                      <View style={styles.tcBadge}>
                        <Text style={styles.tcText}>{timecode}</Text>
                      </View>
                    </LinearGradient>

                    {/* Metadata text */}
                    <Text
                      style={[styles.recTitle, { color: theme.text.primary }]}
                      numberOfLines={1}
                    >
                      {cameraTitle}
                    </Text>
                    <Text
                      style={[styles.recSub, { color: theme.text.secondary }]}
                      numberOfLines={1}
                    >
                      {dateLabel} · {trigger} · {durationLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING_H,
    paddingTop: spacing['3'],
  },

  // Header (.top)
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 3,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chips (.chips)
  chipsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
  },

  // Grid (.recordGrid)
  recordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  cardRec: {
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  recThumb: {
    height: 112,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tcBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tcText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: typography.fontFamily.medium,
  },
  recTitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    marginTop: 8,
    marginBottom: 2,
  },
  recSub: {
    fontSize: 9,
    fontFamily: typography.fontFamily.regular,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['12'],
    paddingHorizontal: spacing['6'],
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 17,
  },
});
