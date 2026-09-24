import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="arrow-left" size={19} color={colors.foreground} /></Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>सूचना</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.notification, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="calendar" size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.notificationTitle, { color: colors.foreground }]}>आजची डायरी अपडेट करा</Text><Text style={[styles.notificationText, { color: colors.mutedForeground }]}>दिवसाच्या शेवटी महत्त्वाच्या नोंदी जतन करा.</Text></View></View>
        <View style={[styles.notification, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.accent }]}><Feather name="bar-chart-2" size={18} color={colors.accentForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.notificationTitle, { color: colors.foreground }]}>महिन्याचा रिपोर्ट तयार आहे</Text><Text style={[styles.notificationText, { color: colors.mutedForeground }]}>तुमच्या कामाच्या नोंदींचा आढावा पहा.</Text></View></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  content: { paddingHorizontal: 20, gap: 10 },
  notification: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  notificationTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  notificationText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 4 },
});