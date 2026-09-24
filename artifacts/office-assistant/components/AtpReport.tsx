import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { shareOrPrintPdfOnNative } from '@/components/nativePdf';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppData } from '@/context/AppDataContext';
import type { AtpRow, AtpWorkDetail, Profile } from '@/context/AppDataContext';
import { useColors } from '@/hooks/useColors';

const workDetailOptions: AtpWorkDetail[] = [
  'साथरोग / कंटेनर सर्वेक्षण',
  'नियोजित लसीकरण सत्र (RI)',
];

const monthNames = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

const isSunday = (date: string) => new Date(`${date}T12:00:00`).getDay() === 0;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('mr-IN', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));

const formatPdfDate = (date: string) =>
  new Intl.DateTimeFormat('mr-IN', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

const createRows = (month: number, year: number): AtpRow[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => ({
    id: `atp-${year}-${pad(month)}-${pad(index + 1)}`,
    date: toDateKey(year, month, index + 1),
    destination: '',
    workDetail: '',
  }));
};

const printHtmlDocument = (html: string) => {
  if (typeof window === 'undefined') return false;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return true;
  }
  return false;
};

export function buildAtpReportHtml({
  profile,
  month,
  year,
  rows,
}: {
  profile: Profile;
  month: number;
  year: number;
  rows: AtpRow[];
}) {
  const tableRows = rows
    .map((row, index) => {
      const sunday = isSunday(row.date);
      return `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(formatPdfDate(row.date))}</td>
        <td>${escapeHtml(profile.subCenter || '—')}</td>
        <td class="${sunday ? 'sunday' : ''}">${sunday ? 'रविवार' : escapeHtml(row.destination || '')}</td>
        <td>${sunday ? '•••••••••' : escapeHtml(row.workDetail)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>आगाऊ फिरती कार्यक्रम (ATP) - ${escapeHtml(monthNames[month - 1])} ${year}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
        .center { text-align: center; }
        .facility { font-size: 14px; font-weight: 700; }
        .meta { font-size: 11px; margin-top: 3px; }
        h1 { font-size: 18px; margin: 13px 0 5px; }
        .employee { font-size: 11px; font-weight: 700; margin-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 9px; }
        th, td { border: 1px solid #222; padding: 4px 3px; text-align: center; vertical-align: middle; height: 20px; }
        th { background: #eef2ff; font-weight: 700; }
        th:nth-child(1), td:nth-child(1) { width: 8%; }
        th:nth-child(2), td:nth-child(2) { width: 19%; }
        th:nth-child(3), td:nth-child(3) { width: 21%; }
        th:nth-child(4), td:nth-child(4) { width: 20%; }
        th:nth-child(5), td:nth-child(5) { width: 32%; }
        .sunday { color: #b42318; font-weight: 700; }
        .note { color: #b42318; font-size: 10px; font-weight: 700; margin-top: 11px; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="facility">प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="meta">उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
        <h1>आगाऊ फिरती कार्यक्रम (ATP)</h1>
        <div class="meta">महिना व वर्ष: ${escapeHtml(monthNames[month - 1])} ${year}</div>
        <div class="employee">कर्मचाऱ्याचे नाव: ${escapeHtml(profile.name || '—')}</div>
      </div>
      <table>
        <thead><tr>
          <th>अ.क्र.</th>
          <th>दिनांक</th>
          <th>निघण्याचे ठिकाण</th>
          <th>कोठे</th>
          <th>कामाचा तपशील</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="note">टिप - वरिष्ठांच्या सुचनेनुसार ATP मध्ये बदल होऊ शकतो</div>
    </body>
  </html>`;
}

export default function AtpReport() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, atpPlans, updateAtpPlan } = useAppData();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [draftRows, setDraftRows] = useState<AtpRow[] | null>(null);
  const [periodPickerVisible, setPeriodPickerVisible] = useState(false);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [customDetail, setCustomDetail] = useState('');

  const savedRows = useMemo(
    () => atpPlans.find((plan) => plan.month === month && plan.year === year)?.rows ?? createRows(month, year),
    [atpPlans, month, year],
  );
  const rows = draftRows ?? savedRows;
  const monthLabel = `${monthNames[month - 1]} ${year}`;

  const changePeriod = (nextMonth: number, nextYear: number) => {
    setMonth(nextMonth);
    setYear(nextYear);
    setDraftRows(null);
  };

  const updateRow = (id: string, changes: Partial<AtpRow>) => {
    setDraftRows((current) => (current ?? rows).map((row) => (row.id === id ? { ...row, ...changes } : row)));
  };

  const openDetailPicker = (date: string) => {
    const existingDetail = rows.find((row) => row.date === date)?.workDetail || '';
    setCustomDetail(workDetailOptions.includes(existingDetail) ? '' : existingDetail);
    setDetailDate(date);
  };

  const savePlan = () => {
    updateAtpPlan({ month, year, rows });
    setDraftRows(rows);
    Alert.alert('ATP जतन झाला', `${monthLabel} साठीचा कार्यक्रम जतन झाला.`);
  };

  const exportPdf = async () => {
    const html = buildAtpReportHtml({ profile, month, year, rows });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'आगाऊ फिरती कार्यक्रम (ATP) शेअर करा',
        logLabel: 'ATP report',
      });
    } catch (error) {
      console.error('ATP PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const pickerYears = [year - 1, year, year + 1, year + 2];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }}
      >
        <ScreenHeader
          eyebrow="ATP आणि डायरी"
          title="आगाऊ फिरती कार्यक्रम (ATP)"
          subtitle="महिना निवडा, रोजचे ठिकाण आणि कामाचा तपशील भरा."
          actionIcon="share-2"
          onAction={() => void exportPdf()}
        />
        <View style={styles.body}>
          <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoBlock}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{profile.primaryHealthCenter || 'प्रोफाइलमध्ये नाही'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>उपकेंद्र</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{profile.subCenter || 'प्रोफाइलमध्ये नाही'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoBlock}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>कर्मचाऱ्याचे नाव</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{profile.name || 'प्रोफाइलमध्ये नाही'}</Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>निवडलेला कालावधी</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]}>{monthLabel}</Text>
              </View>
            </View>
            <Pressable
              testID="open-atp-period-picker"
              accessibilityRole="button"
              onPress={() => setPeriodPickerVisible(true)}
              style={({ pressed }) => [styles.periodButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.periodButtonText, { color: colors.primary }]}>महिना / वर्ष बदला</Text>
              <Feather name="chevron-down" size={15} color={colors.primary} />
            </Pressable>
            <Pressable
              testID="save-atp-plan"
              accessibilityRole="button"
              onPress={savePlan}
              style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
            >
              <Feather name="save" size={16} color={colors.primaryForeground} />
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>ATP जतन करा</Text>
            </Pressable>
          </View>

          <View style={[styles.paper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.paperFacility, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text>
            <Text style={[styles.paperMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
            <Text style={[styles.paperTitle, { color: colors.foreground }]}>आगाऊ फिरती कार्यक्रम (ATP)</Text>
            <Text style={[styles.paperMeta, { color: colors.mutedForeground }]}>महिना व वर्ष: {monthLabel}</Text>
            <Text style={[styles.paperEmployee, { color: colors.foreground }]}>कर्मचाऱ्याचे नाव: {profile.name || '—'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.cell, styles.numberCell, styles.headerText, { color: colors.foreground }]}>अ.क्र.</Text>
                  <Text style={[styles.cell, styles.dateCell, styles.headerText, { color: colors.foreground }]}>दिनांक</Text>
                  <Text style={[styles.cell, styles.departureCell, styles.headerText, { color: colors.foreground }]}>निघण्याचे ठिकाण</Text>
                  <Text style={[styles.cell, styles.destinationCell, styles.headerText, { color: colors.foreground }]}>कोठे</Text>
                  <Text style={[styles.cell, styles.detailCell, styles.headerText, { color: colors.foreground }]}>कामाचा तपशील</Text>
                </View>
                {rows.map((row, index) => {
                  const sunday = isSunday(row.date);
                  return (
                    <View key={row.id} style={[styles.tableRow, { borderColor: colors.border }]}>
                      <Text style={[styles.cell, styles.numberCell, { color: colors.mutedForeground }]}>{index + 1}</Text>
                      <Text style={[styles.cell, styles.dateCell, { color: colors.foreground }]}>{formatDate(row.date)}</Text>
                      <Text style={[styles.cell, styles.departureCell, { color: colors.foreground }]}>{profile.subCenter || '—'}</Text>
                      {sunday ? (
                        <Text style={[styles.cell, styles.destinationCell, styles.sundayText, { color: colors.destructive }]}>रविवार</Text>
                      ) : (
                        <TextInput
                          testID={`atp-destination-${row.date}`}
                          value={row.destination}
                          onChangeText={(value) => updateRow(row.id, { destination: value })}
                          placeholder="कोठे लिहा"
                          placeholderTextColor={colors.mutedForeground}
                          style={[styles.cellInput, styles.destinationCell, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
                        />
                      )}
                      {sunday ? (
                        <Text style={[styles.cell, styles.detailCell, { color: colors.foreground }]}>•••••••••</Text>
                      ) : (
                        <Pressable
                          testID={`atp-detail-${row.date}`}
                          accessibilityRole="button"
                          onPress={() => openDetailPicker(row.date)}
                          style={[styles.detailPicker, styles.detailCell, { backgroundColor: colors.background, borderColor: colors.input }]}
                        >
                          <Text style={[styles.detailPickerText, { color: row.workDetail ? colors.foreground : colors.mutedForeground }]} numberOfLines={3}>
                            {row.workDetail || 'काम निवडा'}
                          </Text>
                          <Feather name="chevron-down" size={14} color={colors.primary} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <Text style={[styles.note, { color: colors.destructive }]}>टिप - वरिष्ठांच्या सुचनेनुसार ATP मध्ये बदल होऊ शकतो</Text>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>

      <Modal visible={periodPickerVisible} transparent animationType="slide" onRequestClose={() => setPeriodPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>महिना आणि वर्ष निवडा</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>ATP कोणत्या कालावधीसाठी आहे?</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setPeriodPickerVisible(false)} hitSlop={10}>
                <Feather name="x" size={21} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>महिना</Text>
            <View style={styles.monthGrid}>
              {monthNames.map((name, index) => (
                <Pressable
                  key={name}
                  onPress={() => changePeriod(index + 1, year)}
                  style={[styles.monthOption, { backgroundColor: month === index + 1 ? colors.primary : colors.background, borderColor: month === index + 1 ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.optionText, { color: month === index + 1 ? colors.primaryForeground : colors.foreground }]}>{name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>वर्ष</Text>
            <View style={styles.yearRow}>
              {pickerYears.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => changePeriod(month, option)}
                  style={[styles.yearOption, { backgroundColor: year === option ? colors.primary : colors.background, borderColor: year === option ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.optionText, { color: year === option ? colors.primaryForeground : colors.foreground }]}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setPeriodPickerVisible(false)} style={[styles.modalDoneButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>पूर्ण झाले</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={detailDate !== null} transparent animationType="slide" onRequestClose={() => setDetailDate(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.detailModalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>कामाचा तपशील निवडा</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>{detailDate ? formatDate(detailDate) : ''}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setDetailDate(null)} hitSlop={10}>
                <Feather name="x" size={21} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {workDetailOptions.map((option) => {
              const selected = detailDate ? rows.find((row) => row.date === detailDate)?.workDetail === option : false;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    if (detailDate) updateRow(rows.find((row) => row.date === detailDate)?.id || '', { workDetail: option });
                    setDetailDate(null);
                    setCustomDetail('');
                  }}
                  style={[styles.detailOption, { backgroundColor: selected ? colors.secondary : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.detailOptionText, { color: colors.foreground }]}>{option}</Text>
                  {selected ? <Feather name="check" size={17} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
            <Text style={[styles.customDetailLabel, { color: colors.mutedForeground }]}>इतर कामाचा तपशील</Text>
            <TextInput
              testID="atp-custom-work-detail"
              value={customDetail}
              onChangeText={setCustomDetail}
              placeholder="उदा. गृहभेटी / आरोग्य तपासणी"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.customDetailInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
            />
            <Pressable
              testID="save-atp-custom-work-detail"
              accessibilityRole="button"
              onPress={() => {
                const value = customDetail.trim();
                if (!detailDate || !value) {
                  Alert.alert('तपशील लिहा', 'नवीन कामाचा तपशील लिहून जतन करा.');
                  return;
                }
                updateRow(rows.find((row) => row.date === detailDate)?.id || '', { workDetail: value });
                setDetailDate(null);
                setCustomDetail('');
              }}
              style={[styles.customDetailButton, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
            >
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <Text style={[styles.customDetailButtonText, { color: colors.primary }]}>हा नवीन तपशील वापरा</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20 },
  controlCard: { borderRadius: 19, borderWidth: 1, padding: 15, marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoBlock: { flex: 1, minWidth: 0 },
  infoLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, marginBottom: 4 },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  periodButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 2 },
  periodButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  saveButton: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  saveButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  paper: { borderRadius: 19, borderWidth: 1, padding: 14, marginBottom: 18 },
  paperFacility: { fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center' },
  paperMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginTop: 4 },
  paperTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center', marginTop: 12 },
  paperEmployee: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center', marginTop: 7, marginBottom: 12 },
  table: { minWidth: 700 },
  tableRow: { flexDirection: 'row', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, minHeight: 45, alignItems: 'stretch' },
  tableHeader: { minHeight: 44, borderTopWidth: 1 },
  cell: { paddingHorizontal: 6, paddingVertical: 7, borderRightWidth: 1, textAlign: 'center', textAlignVertical: 'center', fontFamily: 'Inter_400Regular', fontSize: 11 },
  headerText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  numberCell: { width: 48 },
  dateCell: { width: 105 },
  departureCell: { width: 165 },
  destinationCell: { width: 145 },
  detailCell: { width: 237, borderRightWidth: 0 },
  cellInput: { minHeight: 43, borderWidth: 1, borderRadius: 7, margin: 2, paddingHorizontal: 7, paddingVertical: 5, fontFamily: 'Inter_400Regular', fontSize: 11 },
  detailPicker: { minHeight: 43, borderWidth: 1, borderRadius: 7, margin: 2, paddingHorizontal: 7, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  detailPickerText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15 },
  sundayText: { fontFamily: 'Inter_700Bold' },
  note: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(23, 32, 51, 0.38)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 23, borderTopRightRadius: 23, padding: 20, paddingBottom: 30 },
  detailModalCard: { borderTopLeftRadius: 23, borderTopRightRadius: 23, padding: 20, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 19 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  modalSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  modalLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginBottom: 8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 17 },
  monthOption: { width: '31.8%', minHeight: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  yearRow: { flexDirection: 'row', gap: 7, marginBottom: 19 },
  yearOption: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  modalDoneButton: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailOption: { minHeight: 54, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 },
  detailOptionText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
  customDetailLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 8, marginBottom: 7 },
  customDetailInput: { minHeight: 70, borderRadius: 11, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9, fontFamily: 'Inter_400Regular', fontSize: 13, textAlignVertical: 'top' },
  customDetailButton: { minHeight: 44, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 9 },
  customDetailButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});