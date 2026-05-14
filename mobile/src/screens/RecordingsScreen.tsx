/**
 * RecordingsScreen — Vigilix
 * Gallery of recorded videos with metadata, playback, and management.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeContext';
import { spacing, radii, typography } from '../design/tokens';
import { useStaggeredEntrance, useScalePress } from '../design/animations';
import { VCard } from '../components/ui/VCard';
import { VIconButton } from '../components/ui/VIconButton';
import { VBadge } from '../components/ui/VBadge';
import apiService from '../services/apiService';

interface Recording {
  _id: string;
  cameraDeviceId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration: number;
  createdAt: string;
  cameraName?: string;
}

interface RecordingsScreenProps {
  onBack: () => void;
}

export default function RecordingsScreen({ onBack }: RecordingsScreenProps) {
  const { theme } = useTheme();
  const anims = useStaggeredEntrance(3, 100);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  // Group recordings by date
  const grouped = recordings.reduce<Record<string, Recording[]>>((acc, rec) => {
    const dateKey = formatDate(rec.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(rec);
    return acc;
  }, {});

  const totalSize = recordings.reduce((sum, r) => sum + (r.fileSize || 0), 0);
  const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg.primary} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>Recordings</Text>
            {recordings.length > 0 && (
              <VBadge label={`${recordings.length} clips`} variant="default" />
            )}
          </View>

          {/* Stats */}
          {recordings.length > 0 && (
            <VCard>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.accent.primary }]}>
                    {recordings.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>
                    Recordings
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.surface.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.accent.primary }]}>
                    {formatDuration(totalDuration)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>
                    Total Duration
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.surface.cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.accent.primary }]}>
                    {formatFileSize(totalSize)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>
                    Storage Used
                  </Text>
                </View>
              </View>
            </VCard>
          )}

          {/* Loading */}
          {isLoading && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.accent.primary} />
            </View>
          )}

          {/* Empty State */}
          {!isLoading && recordings.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎬</Text>
              <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
                No Recordings Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.text.tertiary }]}>
                Start recording from the viewer screen.{'\n'}
                Tap the 🔴 Record button while watching a camera.
              </Text>
            </View>
          )}

          {/* Recording Groups */}
          {Object.entries(grouped).map(([date, recs]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: theme.text.secondary }]}>
                {date}
              </Text>
              {recs.map((rec) => (
                <RecordingCard
                  key={rec._id}
                  recording={rec}
                  formatDuration={formatDuration}
                  formatFileSize={formatFileSize}
                  formatTime={formatTime}
                  onDelete={() => handleDelete(rec)}
                />
              ))}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Recording Card ─────────────────────────────────────────────

function RecordingCard({
  recording, formatDuration, formatFileSize, formatTime, onDelete,
}: {
  recording: Recording;
  formatDuration: (s: number) => string;
  formatFileSize: (b: number) => string;
  formatTime: (d: string) => string;
  onDelete: () => void;
}) {
  const { theme } = useTheme();
  const { style: animStyle, pressProps } = useScalePress(0.97);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onLongPress={onDelete}
      {...pressProps}
    >
      <View style={[styles.recordingCard, {
        backgroundColor: theme.surface.card,
        borderColor: theme.surface.cardBorder,
      }]}>
        {/* Thumbnail placeholder */}
        <View style={[styles.thumbnail, { backgroundColor: theme.bg.secondary }]}>
          <Text style={styles.thumbnailIcon}>🎬</Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(recording.duration)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.recordingInfo}>
          <Text style={[styles.recordingFilename, { color: theme.text.primary }]} numberOfLines={1}>
            {recording.filename}
          </Text>
          <Text style={[styles.recordingMeta, { color: theme.text.tertiary }]}>
            {formatTime(recording.createdAt)}  ·  {formatFileSize(recording.fileSize)}
          </Text>
          {recording.cameraName && (
            <Text style={[styles.recordingCamera, { color: theme.text.secondary }]}>
              📷 {recording.cameraName}
            </Text>
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing['5'],
    gap: spacing['4'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing['2'],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['16'],
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing['4'],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing['2'],
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Date group
  dateGroup: {
    gap: spacing['2'],
  },
  dateHeader: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing['1'],
  },

  // Recording card
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['3'],
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing['3'],
  },
  thumbnail: {
    width: 64,
    height: 48,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailIcon: {
    fontSize: 20,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.medium,
    color: '#FFFFFF',
  },
  recordingInfo: {
    flex: 1,
    gap: 2,
  },
  recordingFilename: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  recordingMeta: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.regular,
  },
  recordingCamera: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
  },
  deleteBtn: {
    padding: spacing['2'],
  },
});
