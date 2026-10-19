import React from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import type {LucideIcon} from 'lucide-react-native';
import {colors} from '../theme/colors';

type Props = {
  title: string;
  onBack?: () => void;
  leftIcon?: LucideIcon;
  onLeftPress?: () => void;
  leftLabel?: string;
};

export function ScreenHeader({
  title,
  onBack,
  leftIcon: LeftIcon,
  onLeftPress,
  leftLabel,
}: Props) {
  const action = onLeftPress ?? onBack;
  const Icon = LeftIcon ?? ArrowLeft;

  return (
    <View style={styles.container}>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={leftLabel ?? 'Back'}
          hitSlop={10}
          onPress={action}
          style={({pressed}) => [styles.action, pressed && styles.pressed]}>
          <Icon color={colors.green900} size={25} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#9BCB97',
    backgroundColor: 'rgba(232,247,227,0.9)',
  },
  action: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8FCB91',
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  spacer: {width: 42, height: 42},
  title: {
    flex: 1,
    color: colors.green900,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  pressed: {opacity: 0.72, transform: [{scale: 0.97}]},
});
