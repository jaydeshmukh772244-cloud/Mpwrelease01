import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionTitle } from '@/components/SectionTitle';
import { useAppData } from '@/context/AppDataContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, atpPlans, hydrated } = useAppData();
  const today = new Date();
  const dateLabel = new Intl.DateTimeFormat('mr-IN', { day: 'numeric', month: 'short' }).format(today);
  const weekdayLabel = new Intl.DateTimeFormat('mr-IN', { weekday: 'long' }).format(today);
  const todayDateLabel = new Intl.DateTimeFormat('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(today);
  const todayDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayAtpPlan = atpPlans.find((plan) => plan.month === today.getMonth() + 1 && plan.year === today.getFullYear());
  const todayAtpRow = todayAtpPlan?.rows.find((row) => row.date === todayDateKey);
  const todayIsSunday = today.getDay() === 0;
  const todayAtpComplete = Boolean(todayAtpRow && (todayIsSunday || (todayAtpRow.destination.trim() && todayAtpRow.workDetail.trim())));
  const profileLocation = [
    profile.primaryHealthCenter ? `प्राथमिक आरोग्य केंद्र: ${profile.primaryHealthCenter}` : '',
    profile.subCenter ? `उपकेंद्र: ${profile.subCenter}` : '',
  ].filter(Boolean).join('\n');
  const profileInitial = profile.name.trim().slice(0, 1) || 'आ';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 102 }}>
        <View style={[styles.appHeader, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 14 }]}>
          <View style={styles.brandBlock}>
            <Text style={[styles.brandName, { color: colors.foreground }]}>आरोग्य सेवक <Text style={{ color: colors.primary }}>(MPW)</Text></Text>
            <Text style={[styles.brandCaption, { color: colors.mutedForeground }]}>दैनंदिन कामकाज</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateText, { color: colors.foreground }]}>{dateLabel}</Text>
            <Text style={[styles.weekdayText, { color: colors.primary }]}>{weekdayLabel}</Text>
          </View>
          <Pressable accessibilityRole="button" testID="home-notifications" onPress={() => router.push('/notifications')} style={({ pressed }) => [styles.bellButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="bell" size={19} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={[styles.profileWelcome, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.homeAvatar, { backgroundColor: colors.secondary }]}>
            {profile.avatarUri ? <Image source={{ uri: profile.avatarUri }} style={styles.homeAvatarImage} accessibilityLabel="प्रोफाइल फोटो" /> : <Text style={[styles.homeAvatarText, { color: colors.primary }]}>{profileInitial}</Text>}
          </View>
          <View style={styles.profileWelcomeCopy}>
            <Text style={[styles.profileWelcomeEyebrow, { color: colors.primary }]}>माझी माहिती</Text>
            <Text style={[styles.profileWelcomeName, { color: colors.foreground }]}>{profile.name.trim() || 'तुमचे पूर्ण नाव'}</Text>
            <Text style={[styles.profileWelcomeMeta, { color: colors.mutedForeground }]}>{profileLocation || 'प्राथमिक आरोग्य केंद्र आणि उपकेंद्र भरा'}</Text>
          </View>
          <Pressable testID="home-profile-edit" accessibilityRole="button" accessibilityLabel="प्रोफाइल संपादित करा" onPress={() => router.push('/people')} style={({ pressed }) => [styles.profileEditButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="edit-2" size={16} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.content}>
          <SectionTitle title="आजचा आढावा" />
          <Pressable
            testID="today-atp-summary"
            accessibilityRole="button"
            onPress={() => router.push('/atp')}
            style={({ pressed }) => [
              styles.atpTodayCard,
              {
                backgroundColor: colors.card,
                borderColor: todayAtpComplete ? colors.border : colors.destructive,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <View style={[styles.atpTodayIcon, { backgroundColor: todayAtpComplete ? colors.secondary : colors.destructive + '18' }]}>
              <Feather name={todayAtpComplete ? 'calendar' : 'alert-circle'} size={18} color={todayAtpComplete ? colors.primary : colors.destructive} />
            </View>
            <View style={styles.atpTodayCopy}>
              {!hydrated ? (
                <Text style={[styles.atpTodayMessage, { color: colors.mutedForeground }]}>ATP तपासत आहे…</Text>
              ) : todayAtpComplete ? (
                <>
                  <Text style={[styles.atpTodayDate, { color: colors.foreground }]}>{todayDateLabel}</Text>
                  <Text style={[styles.atpTodayDetail, { color: colors.foreground }]}>
                    {todayIsSunday ? 'रविवार' : todayAtpRow?.destination}
                  </Text>
                  <Text style={[styles.atpTodayWork, { color: colors.primary }]}>
                    {todayIsSunday ? '•••••••••' : todayAtpRow?.workDetail}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.atpTodayDate, { color: colors.foreground }]}>{todayDateLabel}</Text>
                  <Text style={[styles.atpTodayMessage, { color: colors.destructive }]}>ATP योग्य आणि पूर्ण भरा</Text>
                </>
              )}
            </View>
            <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </Pressable>
          <View style={styles.metrics}>
            <DashboardReportCard number="१" icon="activity" title="HI / CI / BI Index Calculator" onPress={() => router.push('/tools')} colors={colors} />
            <DashboardReportCard number="२" icon="grid" title="सहा राष्ट्रीय कार्यक्रमाचा आढावा" onPress={() => router.push('/reports')} colors={colors} />
            <DashboardReportCard number="३" icon="sunrise" title="किटकशास्त्रीय अहवाल" onPress={() => router.push({ pathname: '/reports', params: { report: 'entomological' } })} colors={colors} />
             <DashboardReportCard number="४" icon="file-text" title="Blood Slides Report" onPress={() => router.push({ pathname: '/reports', params: { report: 'bloodSlide' } })} colors={colors} />
            <DashboardReportCard number="५" icon="book-open" title="ATP आणि डायरी" onPress={() => router.push('/atp')} colors={colors} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DashboardReportCard({ number, icon, title, onPress, colors }: { number: string; icon: keyof typeof Feather.glyphMap; title: string; onPress?: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${number} ${title}`} onPress={onPress} style={({ pressed }) => [styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed && onPress ? 0.72 : 1 }]}>
      <View style={[styles.reportCardIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={18} color={colors.primary} /></View>
      <Text style={[styles.reportCardNumber, { color: colors.primary }]}>{number}</Text>
      <Text style={[styles.reportCardTitle, { color: colors.foreground }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appHeader: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandBlock: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.2 },
  brandCaption: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  dateBlock: { alignItems: 'flex-end', paddingRight: 2 },
  dateText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  weekdayText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 3 },
  bellButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileWelcome: { marginHorizontal: 20, minHeight: 136, borderRadius: 22, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  homeAvatar: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' },
  homeAvatarImage: { width: '100%', height: '100%' },
  homeAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  profileWelcomeCopy: { flex: 1, minWidth: 0 },
  profileWelcomeEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  profileWelcomeName: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 25, marginTop: 6 },
  profileWelcomeMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 5 },
  profileEditButton: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  content: { paddingHorizontal: 20 },
  atpTodayCard: { minHeight: 76, borderRadius: 17, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  atpTodayIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  atpTodayCopy: { flex: 1, minWidth: 0 },
  atpTodayDate: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  atpTodayDetail: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 3 },
  atpTodayWork: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  atpTodayMessage: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  reportCard: { width: '31.5%', minHeight: 130, borderRadius: 16, borderWidth: 1, padding: 11, marginBottom: 10 },
  reportCardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  reportCardNumber: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  reportCardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15, marginTop: 4 },
});
