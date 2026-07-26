import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useAudioStore } from '../store/useAudioStore';
import { useNourTheme } from '../theme/NourTheme';
import { Play, Pause, X, SkipForward, SkipBack } from 'lucide-react-native';

export function FloatingAudioPlayer() {
  const { currentBook, isPlaying, setIsPlaying, close } = useAudioStore();
  const { colors } = useNourTheme();
  
  // expo-audio ignores null source
  const player = useAudioPlayer(currentBook?.audioUrl ?? null, {
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);
  
  useEffect(() => {
    if (isPlaying && !status.playing) {
      player.play();
    } else if (!isPlaying && status.playing) {
      player.pause();
    }
  }, [isPlaying, player]);
  
  useEffect(() => {
    setIsPlaying(status.playing);
  }, [status.playing, setIsPlaying]);

  if (!currentBook) return null;

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleClose = () => {
    player.pause();
    close();
  };

  const skipForward = () => player.seekTo((status.currentTime || 0) + 15);
  const skipBackward = () => player.seekTo(Math.max(0, (status.currentTime || 0) - 15));

  const progress = status.duration ? ((status.currentTime || 0) / status.duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.playerBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
        </View>
        <View style={styles.content}>
          <View style={styles.controls}>
            <Pressable onPress={skipBackward} style={styles.iconBtn}>
              <SkipBack color={colors.ink} size={20} />
            </Pressable>
            <Pressable onPress={togglePlay} style={styles.playBtn}>
              {status.isBuffering ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : status.playing ? (
                <Pause color={colors.primary} size={24} />
              ) : (
                <Play color={colors.primary} size={24} />
              )}
            </Pressable>
            <Pressable onPress={skipForward} style={styles.iconBtn}>
              <SkipForward color={colors.ink} size={20} />
            </Pressable>
          </View>
          <View style={styles.info}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, textAlign: 'right' }} numberOfLines={1}>
              {currentBook.title}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'right' }} numberOfLines={1}>
              {currentBook.author}
            </Text>
          </View>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <X color={colors.muted} size={24} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  playerBar: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(215, 170, 79, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 8,
  },
  closeBtn: {
    padding: 8,
  },
});
