import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionIcon?: keyof typeof Feather.glyphMap;
  onAction?: () => void;
  compact?: boolean;
}

export function ScreenHeader({ eyebrow, title, subtitle, actionIcon, onAction, compact = false }: ScreenHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: compact ? 0 : Platform.OS === 'web' ? 67 : insets.top + 14 }]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {actionIcon && onAction ? (
        <Pressable
          accessibilityRole="button"
          testID="header-action"
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name={actionIcon} size={20} color={colors.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  copy: { flex: 1, paddingRight: 12 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 6 },
  action: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});