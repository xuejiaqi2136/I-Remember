import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Theme } from '@/constants/Theme';

type Props = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

export function Celebration({ visible, message, onClose }: Props) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220 });
      scale.value = withSequence(
        withSpring(1.04, { damping: 12 }),
        withSpring(1, { damping: 14 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      scale.value = withTiming(0.9, { duration: 160 });
    }
  }, [visible, opacity, scale]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glow = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    glow.value = withDelay(80, withTiming(1, { duration: 500 }));
  }, [visible, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.55,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.panel, panelStyle]}>
          <Text style={styles.brand}>我记着呢</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable onPress={onClose} style={styles.btn}>
            <Text style={styles.btnText}>好</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.space.lg,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Theme.colors.accentSoft,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.lg,
    paddingVertical: Theme.space.xl,
    paddingHorizontal: Theme.space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.line,
  },
  brand: {
    fontFamily: Theme.fonts.display,
    fontSize: 28,
    color: Theme.colors.accent,
    marginBottom: Theme.space.sm,
  },
  message: {
    fontFamily: Theme.fonts.body,
    fontSize: 17,
    lineHeight: 26,
    color: Theme.colors.ink,
    marginBottom: Theme.space.lg,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: Theme.radius.sm,
  },
  btnText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
    fontSize: 16,
  },
});
