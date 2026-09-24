import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppData } from '@/context/AppDataContext';
import { useColors } from '@/hooks/useColors';

const pad = (value: number) => String(value).padStart(2, '0');

const getTodayInput = () => {
  const today = new Date();
  return `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
};

const parseDateTime = (dateInput: string, timeInput: string) => {
  const dateParts = dateInput.replace(/[^\d]/g, ' ').trim().split(/\s+/).map(Number);
  const timeParts = timeInput.replace(/[^\d]/g, ' ').trim().split(/\s+/).map(Number);
  if (dateParts.length !== 3 || dateParts.some((part) => !Number.isFinite(part)) || timeParts.length !== 2 || timeParts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  const [day, month, year] = dateParts;
  const [hour, minute] = timeParts;
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate() || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  return value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day ? value : null;
};

const parseNoteDate = (dateInput: string) => parseDateTime(dateInput, '00:00');

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

const formatAlarm = (alarmAt: string) =>
  new Intl.DateTimeFormat('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(alarmAt));

export default function DiaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, addEntry, removeEntry } = useAppData();
  const [noteDate, setNoteDate] = useState(getTodayInput);
  const [note, setNote] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmDate, setAlarmDate] = useState(getTodayInput);
  const [alarmTime, setAlarmTime] = useState('09:00');

  const history = useMemo(
    () => [...entries].sort((first, second) => second.date.localeCompare(first.date) || second.id.localeCompare(first.id)),
    [entries],
  );

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'web') return false;
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted && !permission.canAskAgain) {
      Alert.alert('Notification परवानगी बंद आहे', 'Alarm वाजण्यासाठी मोबाईलच्या Settings मध्ये notification परवानगी सुरू करा.', [
        { text: 'नंतर', style: 'cancel' },
        { text: 'Settings उघडा', onPress: () => void Linking.openSettings() },
      ]);
    }
    return permission.granted;
  };

  const saveNote = async () => {
    const trimmedNote = note.trim();
    const parsedNoteDate = parseNoteDate(noteDate);
    if (!trimmedNote) {
      Alert.alert('नोंद लिहा', 'दैनंदिन नोंदीसाठी काहीतरी लिहा.');
      return;
    }
    if (!parsedNoteDate) {
      Alert.alert('दिनांक तपासा', 'दिनांक DD/MM/YYYY या स्वरूपात लिहा.');
      return;
    }

    let alarmAt: Date | null = null;
    let notificationId: string | undefined;
    if (alarmEnabled) {
      alarmAt = parseDateTime(alarmDate, alarmTime);
      if (!alarmAt) {
        Alert.alert('Alarm तपासा', 'Alarm साठी दिनांक DD/MM/YYYY आणि वेळ HH:MM या स्वरूपात लिहा.');
        return;
      }
      if (alarmAt.getTime() <= Date.now()) {
        Alert.alert('भविष्यातील वेळ निवडा', 'Alarm ची वेळ सध्याच्या वेळेनंतरची असावी.');
        return;
      }
      try {
        const allowed = await requestNotificationPermission();
        if (!allowed) {
          Alert.alert('Notification परवानगी आवश्यक', 'Alarm साठी मोबाईलच्या notification परवानग्या सुरू करा. नोंद alarm शिवाय जतन करू शकता.');
          return;
        }
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('diary-reminders', {
            name: 'दैनंदिन नोंदीचे अलार्म',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
          });
        }
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'दैनंदिन नोंदीची आठवण',
            body: trimmedNote,
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: alarmAt,
            channelId: Platform.OS === 'android' ? 'diary-reminders' : undefined,
          },
        });
      } catch (error) {
        console.error('Diary notification scheduling failed', error);
        Alert.alert('Alarm सेट करता आला नाही', 'नोंद alarm शिवाय जतन करायची असल्यास पुन्हा Save करा.');
        return;
      }
    }

    addEntry({
      title: 'दैनंदिन नोंद',
      note: trimmedNote,
      category: 'दैनंदिन नोंद',
      done: false,
      date: `${parsedNoteDate.getFullYear()}-${pad(parsedNoteDate.getMonth() + 1)}-${pad(parsedNoteDate.getDate())}`,
      alarmAt: alarmAt?.toISOString(),
      notificationId,
    });
    setNote('');
    setAlarmEnabled(false);
    setAlarmDate(noteDate);
    setAlarmTime('09:00');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('नोंद जतन झाली', alarmAt ? 'नोंद आणि alarm दोन्ही जतन झाले.' : 'दैनंदिन नोंद जतन झाली.');
  };

  const deleteNote = (id: string, notificationId?: string) => {
    Alert.alert('नोंद हटवायची?', 'ही नोंद कायमची हटवली जाईल.', [
      { text: 'रद्द करा', style: 'cancel' },
      {
        text: 'हटवा',
        style: 'destructive',
        onPress: () => {
          if (notificationId && Platform.OS !== 'web') {
            void Notifications.cancelScheduledNotificationAsync(notificationId);
          }
          removeEntry(id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }}
      >
        <ScreenHeader
          eyebrow="दिवसाची नोंद"
          title="दैनंदिन नोंदी"
          subtitle="तारीख निवडा, नोंद लिहा आणि मागील नोंदी पुन्हा पाहा."
        />

        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>आजची नोंद</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>दिनांक</Text>
          <TextInput
            testID="diary-date"
            value={noteDate}
            onChangeText={setNoteDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            maxLength={10}
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
          />
          <TextInput
            testID="diary-note"
            value={note}
            onChangeText={setNote}
            placeholder="आजची नोंद येथे लिहा..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, styles.noteInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
          />

          <Pressable
            testID="toggle-diary-alarm"
            accessibilityRole="switch"
            accessibilityState={{ checked: alarmEnabled }}
            onPress={() => {
              setAlarmEnabled((enabled) => !enabled);
              if (!alarmEnabled) setAlarmDate(noteDate);
            }}
            style={[styles.alarmToggle, { backgroundColor: alarmEnabled ? colors.secondary : colors.background, borderColor: alarmEnabled ? colors.primary : colors.border }]}
          >
            <View style={[styles.alarmIcon, { backgroundColor: alarmEnabled ? colors.primary : colors.card }]}>
              <Feather name="bell" size={16} color={alarmEnabled ? colors.primaryForeground : colors.mutedForeground} />
            </View>
            <View style={styles.alarmCopy}>
              <Text style={[styles.alarmTitle, { color: colors.foreground }]}>Alarm लावायचा आहे</Text>
              <Text style={[styles.alarmSubtitle, { color: colors.mutedForeground }]}>निवडलेल्या वेळेला notification मिळेल</Text>
            </View>
            <View style={[styles.switch, { backgroundColor: alarmEnabled ? colors.primary : colors.border }]}>
              <View style={[styles.switchThumb, { backgroundColor: colors.card, alignSelf: alarmEnabled ? 'flex-end' : 'flex-start' }]} />
            </View>
          </Pressable>

          {alarmEnabled ? (
            <View style={styles.alarmFields}>
              <View style={styles.alarmField}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Alarm दिनांक</Text>
                <TextInput
                  testID="diary-alarm-date"
                  value={alarmDate}
                  onChangeText={setAlarmDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={10}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
                />
              </View>
              <View style={styles.alarmField}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Alarm वेळ</Text>
                <TextInput
                  testID="diary-alarm-time"
                  value={alarmTime}
                  onChangeText={setAlarmTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={5}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
                />
              </View>
            </View>
          ) : null}

          <Pressable testID="save-diary" onPress={() => void saveNote()} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
            <Feather name="save" size={17} color={colors.primaryForeground} />
            <Text style={[styles.saveText, { color: colors.primaryForeground }]}>नोंद जतन करा</Text>
          </Pressable>
        </View>

        <View style={styles.historyHeader}>
          <View>
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>मागील नोंदी</Text>
            <Text style={[styles.historySubtitle, { color: colors.mutedForeground }]}>जतन केलेल्या सर्व नोंदी तारीखेनुसार</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{history.length}</Text>
          </View>
        </View>

        {history.length ? history.map((entry) => (
          <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dateBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.dateBadgeText, { color: colors.primary }]}>{formatDate(entry.date)}</Text>
            </View>
            <Text style={[styles.entryNote, { color: colors.foreground }]}>{entry.note}</Text>
            {entry.alarmAt ? (
              <View style={styles.alarmMeta}>
                <Feather name="bell" size={13} color={colors.primary} />
                <Text style={[styles.alarmMetaText, { color: colors.primary }]}>Alarm: {formatAlarm(entry.alarmAt)}</Text>
              </View>
            ) : null}
            <Pressable
              testID={`delete-diary-${entry.id}`}
              accessibilityRole="button"
              accessibilityLabel="नोंद हटवा"
              onPress={() => deleteNote(entry.id, entry.notificationId)}
              hitSlop={10}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )) : (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="edit-3" size={24} color={colors.primary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून नोंद नाही</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>वरच्या जागेत आजची पहिली दैनंदिन नोंद लिहा.</Text>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  form: { marginHorizontal: 20, padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  formTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 14 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 7 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 11 },
  noteInput: { minHeight: 110, textAlignVertical: 'top' },
  alarmToggle: { minHeight: 62, borderRadius: 14, borderWidth: 1, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 },
  alarmIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  alarmCopy: { flex: 1 },
  alarmTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  alarmSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  switch: { width: 39, height: 23, borderRadius: 14, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 17, height: 17, borderRadius: 9 },
  alarmFields: { flexDirection: 'row', gap: 10, marginTop: 12 },
  alarmField: { flex: 1 },
  saveButton: { minHeight: 45, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  historyHeader: { marginHorizontal: 20, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  historySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  countBadge: { minWidth: 31, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  entryCard: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, position: 'relative' },
  dateBadge: { alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  entryNote: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, paddingRight: 27, marginTop: 11 },
  alarmMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  alarmMetaText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  deleteButton: { position: 'absolute', top: 15, right: 15 },
  empty: { marginHorizontal: 20, borderWidth: 1, borderRadius: 19, alignItems: 'center', padding: 28 },
  emptyIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 7 },
});