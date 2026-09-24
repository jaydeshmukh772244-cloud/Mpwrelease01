import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppData } from '@/context/AppDataContext';
import type { GuppyFishReleasePlacesReportEntry, Village } from '@/context/AppDataContext';
import { shareOrPrintPdfOnNative } from '@/components/nativePdf';
import { useColors } from '@/hooks/useColors';

type ColorTokens = ReturnType<typeof useColors>;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const releaseTypeLabel = (value: GuppyFishReleasePlacesReportEntry['releaseType']) =>
  value === 'seasonal' ? 'हंगामी' : value === 'permanent' ? 'कायम' : '';

function printHtmlDocument(html: string) {
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

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const frameDocument = iframe.contentDocument;
  if (!frameDocument) {
    iframe.remove();
    return false;
  }
  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 1000);
  };
  return true;
}

export function buildGuppyFishReleasePlacesReportHtml({
  profile,
  reports,
  monthLabel,
}: {
  profile: {
    name: string;
    district: string;
    taluka: string;
    primaryHealthCenter: string;
    subCenter: string;
  };
  reports: GuppyFishReleasePlacesReportEntry[];
  monthLabel: string;
}) {
  const rows = reports
    .map(
      (entry, index) => `
        <tr>
          <td>${index + 1}</td>
          <td class="left">${escapeHtml(entry.villageName)}</td>
          <td class="left">${escapeHtml(entry.releasePlace)}</td>
          <td>${escapeHtml(releaseTypeLabel(entry.releaseType))}</td>
          <td>${escapeHtml(entry.releaseDate)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>गप्पी मासे सोडलेली ठिकाणे - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 24px 0 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 11px; }
      th, td { border: 1px solid #6f7785; padding: 9px 7px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      .left { text-align: left; }
      .signatures { display: flex; justify-content: space-between; margin-top: 55px; font-size: 12px; line-height: 1.7; }
      .right { text-align: right; }
    </style></head><body>
      <div class="top">
        <div style="width:130px"></div>
        <div class="center">
          <div class="facility">${escapeHtml(`प्राथमिक आरोग्य केंद्र ${profile.primaryHealthCenter || '—'}`)}</div>
          <div class="meta">तालुका: ${escapeHtml(profile.taluka || '—')} &nbsp;&nbsp; जिल्हा: ${escapeHtml(profile.district || '—')}</div>
          <div class="meta">उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
        </div>
        <div class="month">महिना: ${escapeHtml(monthLabel)}</div>
      </div>
      <h1>गप्पी मासे सोडलेली ठिकाणे</h1>
      <table><thead><tr>
        <th>अ. क्र.</th><th>गावाचे नाव</th><th>गप्पी मासे सोडलेले ठिकाण</th><th>प्रकार</th><th>गप्पी मासे सोडलेले दिनांक</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="5">कोणतीही नोंद नाही</td></tr>'}</tbody></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

export default function GuppyFishReleasePlacesReport() {
  const colors = useColors();
  const {
    profile,
    reportPeriod,
    guppyFishReleasePlacesReports,
    addGuppyFishReleasePlacesReport,
    updateGuppyFishReleasePlacesReport,
    removeGuppyFishReleasePlacesReport,
  } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [villageName, setVillageName] = useState('');
  const [releasePlace, setReleasePlace] = useState('');
  const [releaseType, setReleaseType] = useState<GuppyFishReleasePlacesReportEntry['releaseType']>('');
  const [releaseDate, setReleaseDate] = useState('');
  const [newVillageName, setNewVillageName] = useState('');
  const [customVillages, setCustomVillages] = useState<string[]>([]);

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(reportPeriod.year, reportPeriod.month - 1, 1),
  );
  const availableVillages = useMemo(() => {
    const names = profile.villages.map((village) => village.name.trim()).filter(Boolean);
    return [...new Set([...names, ...customVillages])];
  }, [customVillages, profile.villages]);

  const resetForm = () => {
    setVillageName('');
    setReleasePlace('');
    setReleaseType('');
    setReleaseDate('');
    setNewVillageName('');
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setEditingId(null);
    } else if (!villageName) {
      setVillageName(availableVillages[0] || '');
    }
    setShowForm((current) => !current);
  };

  const addNewVillage = () => {
    const name = newVillageName.trim();
    if (!name) {
      Alert.alert('गावाचे नाव भरा', 'नवीन वस्ती किंवा वाडीचे नाव लिहा.');
      return;
    }
    const existing = availableVillages.find((village) => village.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) {
      setVillageName(existing);
    } else {
      setCustomVillages((current) => [...current, name]);
      setVillageName(name);
    }
    setNewVillageName('');
  };

  const saveReport = () => {
    if (!villageName.trim() || !releasePlace.trim() || !releaseType || !releaseDate.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'गाव, ठिकाण, प्रकार आणि दिनांक ही सर्व माहिती भरा.');
      return;
    }
    const report: Omit<GuppyFishReleasePlacesReportEntry, 'id'> = {
      villageName: villageName.trim(),
      releasePlace: releasePlace.trim(),
      releaseType,
      releaseDate: releaseDate.trim(),
    };
    if (editingId) {
      updateGuppyFishReleasePlacesReport(editingId, report);
    } else {
      addGuppyFishReleasePlacesReport(report);
    }
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const editReport = (entry: GuppyFishReleasePlacesReportEntry) => {
    if (!availableVillages.includes(entry.villageName)) {
      setCustomVillages((current) => [...current, entry.villageName]);
    }
    setEditingId(entry.id);
    setVillageName(entry.villageName);
    setReleasePlace(entry.releasePlace);
    setReleaseType(entry.releaseType);
    setReleaseDate(entry.releaseDate);
    setShowForm(true);
  };

  const exportPdf = async () => {
    const html = buildGuppyFishReleasePlacesReportHtml({
      profile,
      reports: guppyFishReleasePlacesReports,
      monthLabel,
    });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'गप्पी मासे सोडलेली ठिकाणे PDF शेअर करा',
        logLabel: 'Guppy fish release places',
      });
    } catch (error) {
      console.error('Guppy fish release places PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  return (
    <View>
      <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}>
          <Feather name="map-pin" size={18} color={colors.primary} />
        </View>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT 3 OF 3</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>गप्पी मासे सोडलेली ठिकाणे</Text>
        </View>
        <Pressable
          testID="add-guppy-fish-release-places-report"
          accessibilityRole="button"
          accessibilityLabel="नवीन गप्पी मासे सोडलेली ठिकाणे नोंद जोडा"
          onPress={toggleForm}
          style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name={showForm ? 'x' : 'plus'} size={17} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.facilityName, { color: colors.foreground }]}>
          प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}
        </Text>
        <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>
          उपकेंद्र: {profile.subCenter || '—'}  ·  {monthLabel}
        </Text>
        <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
        <Text style={[styles.reportTitle, { color: colors.foreground }]}>गप्पी मासे सोडलेली ठिकाणे</Text>
        <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>
          {guppyFishReleasePlacesReports.length} नोंदी · गाव, ठिकाण, प्रकार आणि दिनांक
        </Text>
      </View>

      {showForm ? (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.formHeading}>
            <View>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>
                {editingId ? 'गप्पी मासे नोंद बदला' : 'नवीन गप्पी मासे नोंद'}
              </Text>
              <Text style={[styles.formHint, { color: colors.mutedForeground }]}>
                प्रोफाइलमधील गाव निवडा किंवा नवीन वस्ती / वाडी जोडा.
              </Text>
            </View>
            <Feather name="map-pin" size={18} color={colors.primary} />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>१. गावाचे नाव *</Text>
          {availableVillages.length ? (
            <View style={styles.villageChoices}>
              {availableVillages.map((village) => {
                const selected = villageName === village;
                return (
                  <Pressable
                    key={village}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${village} गाव निवडा`}
                    onPress={() => setVillageName(village)}
                    style={({ pressed }) => [
                      styles.villageChoice,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.secondary : colors.background,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Feather name={selected ? 'check-circle' : 'circle'} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.villageChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{village}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={[styles.noVillagesNotice, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={15} color={colors.primary} />
              <Text style={[styles.noVillagesText, { color: colors.foreground }]}>प्रोफाइलमध्ये अजून गावे नाहीत. खाली नवीन वस्ती / वाडी जोडा.</Text>
            </View>
          )}
          <View style={styles.addVillageRow}>
            <TextInput
              value={newVillageName}
              onChangeText={setNewVillageName}
              placeholder="नवीन वस्ती / वाडीचे नाव"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.addVillageInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
            />
            <Pressable
              testID="add-guppy-fish-custom-village"
              accessibilityRole="button"
              accessibilityLabel="नवीन वस्ती किंवा वाडी जोडा"
              onPress={addNewVillage}
              style={({ pressed }) => [styles.addVillageButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
            >
              <Feather name="plus" size={15} color={colors.primaryForeground} />
              <Text style={[styles.addVillageButtonText, { color: colors.primaryForeground }]}>जोडा</Text>
            </Pressable>
          </View>
          {villageName ? <Text style={[styles.selectedVillageText, { color: colors.primary }]}>निवडलेले गाव: {villageName}</Text> : null}

          <TextInputField label="२. गप्पी मासे सोडलेले ठिकाण *" value={releasePlace} onChangeText={setReleasePlace} placeholder="उदा. विहीर / नाला / पाणवठा" colors={colors} />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>३. प्रकार *</Text>
          <View style={styles.typeChoices}>
            <TypeChoice label="हंगामी" selected={releaseType === 'seasonal'} onPress={() => setReleaseType('seasonal')} colors={colors} />
            <TypeChoice label="कायम" selected={releaseType === 'permanent'} onPress={() => setReleaseType('permanent')} colors={colors} />
          </View>
          <TextInputField label="४. गप्पी मासे सोडलेले दिनांक *" value={releaseDate} onChangeText={setReleaseDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} />
          <Pressable
            testID="save-guppy-fish-release-places-report"
            onPress={saveReport}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
          >
            <Feather name="check" size={17} color={colors.primaryForeground} />
            <Text style={[styles.saveText, { color: colors.primaryForeground }]}>{editingId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.entriesHeader}>
        <View>
          <Text style={[styles.entriesTitle, { color: colors.foreground }]}>गप्पी मासे नोंदी</Text>
          <Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>सोडलेले ठिकाण, प्रकार आणि दिनांक तपासा.</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.countPillText, { color: colors.primary }]}>{guppyFishReleasePlacesReports.length}</Text>
        </View>
      </View>

      {guppyFishReleasePlacesReports.length ? (
        guppyFishReleasePlacesReports.map((entry, index) => (
          <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text>
            </View>
            <View style={styles.entryCopy}>
              <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.villageName}</Text>
              <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.releasePlace}</Text>
              <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
                {releaseTypeLabel(entry.releaseType)}  ·  {entry.releaseDate}
              </Text>
            </View>
            <View style={styles.entryActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गप्पी मासे नोंद बदला`} onPress={() => editReport(entry)} hitSlop={10}>
                <Feather name="edit-2" size={16} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${entry.villageName} गप्पी मासे नोंद हटवा`}
                onPress={() =>
                  Alert.alert('नोंद हटवायची?', `${entry.villageName} गावाची नोंद हटवायची आहे का?`, [
                    { text: 'रद्द करा', style: 'cancel' },
                    { text: 'हटवा', style: 'destructive', onPress: () => removeGuppyFishReleasePlacesReport(entry.id) },
                  ])
                }
                hitSlop={10}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map-pin" size={24} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून गप्पी मासे नोंद नाही</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>वरील + बटन दाबून पहिली नोंद जोडा.</Text>
        </View>
      )}

      {guppyFishReleasePlacesReports.length ? (
        <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.exportHeading}>
            <View>
              <Text style={[styles.exportTitle, { color: colors.foreground }]}>रिपोर्ट तयार आहे?</Text>
              <Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text>
            </View>
            <Feather name="file-text" size={20} color={colors.primary} />
          </View>
          <Pressable
            testID="share-guppy-fish-release-places-report-pdf"
            onPress={() => void exportPdf()}
            style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
          >
            <Feather name="share-2" size={15} color={colors.primaryForeground} />
            <Text style={[styles.exportButtonText, { color: colors.primaryForeground }]}>PDF शेअर करा</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  colors: ColorTokens;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]}
      />
    </View>
  );
}

function TypeChoice({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: ColorTokens }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeChoice,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.secondary : colors.background,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Feather name={selected ? 'check-circle' : 'circle'} size={16} color={selected ? colors.primary : colors.mutedForeground} />
      <Text style={[styles.typeChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionBanner: { borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionCopy: { flex: 1 },
  sectionEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 3 },
  sectionAddButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reportPaper: { borderRadius: 19, borderWidth: 1, padding: 16, marginBottom: 18 },
  facilityName: { fontSize: 13, fontWeight: '700' },
  facilityMeta: { fontSize: 10, marginTop: 4 },
  reportTitleRule: { borderTopWidth: 1, marginTop: 13 },
  reportTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  reportSubtitle: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  formCard: { borderRadius: 19, borderWidth: 1, padding: 16, marginBottom: 18 },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 },
  formTitle: { fontSize: 17, fontWeight: '700' },
  formHint: { fontSize: 11, marginTop: 4 },
  field: { marginBottom: 11 },
  fieldLabel: { fontSize: 10, fontWeight: '600', marginBottom: 6 },
  input: { height: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, fontSize: 13 },
  villageChoices: { gap: 7, marginBottom: 8 },
  villageChoice: { minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  villageChoiceText: { flex: 1, fontSize: 12, fontWeight: '600' },
  addVillageRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  addVillageInput: { flex: 1 },
  addVillageButton: { minHeight: 42, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addVillageButtonText: { fontSize: 11, fontWeight: '700' },
  noVillagesNotice: { minHeight: 42, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  noVillagesText: { flex: 1, fontSize: 11, lineHeight: 16 },
  selectedVillageText: { fontSize: 10, fontWeight: '600', marginTop: 3, marginBottom: 8 },
  typeChoices: { flexDirection: 'row', gap: 9, marginBottom: 11 },
  typeChoice: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  typeChoiceText: { fontSize: 12, fontWeight: '600' },
  saveButton: { height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
  saveText: { fontSize: 13, fontWeight: '600' },
  entriesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  entriesTitle: { fontSize: 16, fontWeight: '700' },
  entriesSubtitle: { fontSize: 10, marginTop: 4 },
  countPill: { minWidth: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countPillText: { fontSize: 13, fontWeight: '700' },
  entryCard: { borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9 },
  entryNumber: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  entryNumberText: { fontSize: 12, fontWeight: '700' },
  entryCopy: { flex: 1, paddingRight: 8 },
  entryName: { fontSize: 13, fontWeight: '700' },
  entryMeta: { fontSize: 10, marginTop: 4 },
  entryActions: { gap: 14, paddingTop: 2 },
  emptyCard: { borderRadius: 17, borderWidth: 1, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18, marginBottom: 14 },
  emptyTitle: { fontSize: 13, fontWeight: '600', marginTop: 9 },
  emptyText: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  exportCard: { borderRadius: 17, borderWidth: 1, padding: 14, marginBottom: 14 },
  exportHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exportTitle: { fontSize: 13, fontWeight: '700' },
  exportText: { fontSize: 10, marginTop: 4 },
  exportButton: { minHeight: 40, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6, marginTop: 13 },
  exportButtonText: { fontSize: 10, fontWeight: '600' },
});