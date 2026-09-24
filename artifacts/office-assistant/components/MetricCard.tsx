import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface MetricCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  tone?: 'blue' | 'amber' | 'green' | 'purple';
}

const toneMap = {
  blue: { bg: '#EAF0FF', icon: '#2F6BFF' },
  amber: { bg: '#FFF2D8', icon: '#B97900' },
  green: { bg: '#E4F7EF', icon: '#178A5A' },
  purple: { bg: '#F1EAFE', icon: '#7954C8' },
};

export function MetricCard({ icon, label, value, tone = 'blue' }: MetricCardProps) {
  const colors = useColors();
  const palette = toneMap[tone];
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: palette.bg }]}>
        <Feather name={icon} size={17} color={palette.icon} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', minHeight: 118, borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 12 },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 23 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 },
});