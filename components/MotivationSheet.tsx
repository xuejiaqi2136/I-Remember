import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Theme } from '@/constants/Theme';

type Props = {
  visible: boolean;
  message: string;
  onClose: () => void;
  onFirstStep?: () => void;
  hasSteps?: boolean;
};

export function MotivationSheet({
  visible,
  message,
  onClose,
  onFirstStep,
  hasSteps,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeInDown.duration(280)} style={styles.sheet}>
          <Text style={styles.eyebrow}>慢慢来</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            {hasSteps && onFirstStep ? (
              <Pressable
                style={styles.primary}
                onPress={() => {
                  onFirstStep();
                  onClose();
                }}>
                <Text style={styles.primaryText}>先做第一步</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>先看一眼</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Theme.colors.overlay,
  },
  sheet: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.space.lg,
    paddingTop: Theme.space.lg,
    paddingBottom: Theme.space.xl,
    borderTopLeftRadius: Theme.radius.lg,
    borderTopRightRadius: Theme.radius.lg,
  },
  eyebrow: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.muted,
    fontSize: 13,
    marginBottom: Theme.space.sm,
  },
  message: {
    fontFamily: Theme.fonts.displayRegular,
    fontSize: 22,
    lineHeight: 32,
    color: Theme.colors.ink,
    marginBottom: Theme.space.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.space.sm,
    flexWrap: 'wrap',
  },
  primary: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
  },
  primaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.white,
    fontSize: 15,
  },
  secondary: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.accentSoft,
  },
  secondaryText: {
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.accent,
    fontSize: 15,
  },
});
