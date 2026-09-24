import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppData } from '@/context/AppDataContext';
import type { BloodSlideReportEntry, Village } from '@/context/AppDataContext';
import { shareOrPrintPdfOnNative } from '@/components/nativePdf';
import { useColors } from '@/hooks/useColors';

type ColorTokens = ReturnType<typeof useColors>;

const numericValue = (value: string) => {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const sumPair = (first: string, second: string) => {
  if (!first.trim() && !second.trim()) return '';
  return String(numericValue(first) + numericValue(second));
};

const sumValues = (values: string[]) => {
  const entered = values.filter((value) => value.trim());
  return entered.length ? String(entered.reduce((total, value) => total + numericValue(value), 0)) : '';
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

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

export function buildBloodSlideReportHtml({
  profile,
  reports,
  monthLabel,
}: {
  profile: { name: string; primaryHealthCenter: string; subCenter: string; bsCode: string; taluka: string; district: string };
  reports: BloodSlideReportEntry[];
  monthLabel: string;
}) {
  const rows = reports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="left">${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.firstFortnightMale)}</td>
      <td>${escapeHtml(entry.firstFortnightFemale)}</td>
      <td>${escapeHtml(entry.firstFortnightTotal || sumPair(entry.firstFortnightMale, entry.firstFortnightFemale))}</td>
      <td>${escapeHtml(entry.secondFortnightMale)}</td>
      <td>${escapeHtml(entry.secondFortnightFemale)}</td>
      <td>${escapeHtml(entry.secondFortnightTotal || sumPair(entry.secondFortnightMale, entry.secondFortnightFemale))}</td>
      <td>${escapeHtml(entry.monthlyTotal || sumPair(entry.firstFortnightTotal, entry.secondFortnightTotal))}</td>
      <td>${escapeHtml(entry.progressive)}</td>
    </tr>`).join('');
  const firstMale = sumValues(reports.map((entry) => entry.firstFortnightMale));
  const firstFemale = sumValues(reports.map((entry) => entry.firstFortnightFemale));
  const firstTotal = sumValues(reports.map((entry) => entry.firstFortnightTotal || sumPair(entry.firstFortnightMale, entry.firstFortnightFemale)));
  const secondMale = sumValues(reports.map((entry) => entry.secondFortnightMale));
  const secondFemale = sumValues(reports.map((entry) => entry.secondFortnightFemale));
  const secondTotal = sumValues(reports.map((entry) => entry.secondFortnightTotal || sumPair(entry.secondFortnightMale, entry.secondFortnightFemale)));
  const monthlyTotal = sumValues(reports.map((entry) => entry.monthlyTotal || sumPair(entry.firstFortnightTotal, entry.secondFortnightTotal)));
  const progressive = sumValues(reports.map((entry) => entry.progressive));

  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>Blood Slides Report - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 17px; font-weight: 700; }
      .meta { font-size: 11px; margin-top: 4px; }
      .month { font-size: 12px; font-weight: 700; min-width: 125px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 18px 0 5px; }
      .code { text-align: center; font-size: 12px; margin-bottom: 14px; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 10px; }
      th, td { border: 1px solid #222; padding: 6px 3px; text-align: center; vertical-align: middle; }
      th { font-weight: 700; background: #eef2ff; }
      .left { text-align: left; }
      .total-row td { font-weight: 700; background: #eef2ff; }
      .signatures { display: flex; justify-content: space-between; margin-top: 42px; font-size: 11px; line-height: 1.7; }
      .right { text-align: right; }
    </style></head><body>
      <div class="top">
        <div style="width:125px"></div>
        <div class="center">
          <div class="facility">${escapeHtml(`प्राथमिक आरोग्य केंद्र ${profile.primaryHealthCenter || '—'}`)}</div>
          <div class="meta">तालुका: ${escapeHtml(profile.taluka || '—')} &nbsp;&nbsp; जिल्हा: ${escapeHtml(profile.district || '—')}</div>
          <div class="meta">उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
        </div>
        <div class="month">मासिक रिपोर्ट: ${escapeHtml(monthLabel)}</div>
      </div>
      <h1>Blood Slides Report</h1>
      <div class="code">BS Code: ${escapeHtml(profile.bsCode || '—')} &nbsp;&nbsp; कर्मचारी: ${escapeHtml(profile.name || '—')}</div>
      <table><thead>
        <tr>
          <th rowspan="2">अनु. क्र.</th><th rowspan="2">गावाचे नाव</th>
          <th colspan="3">पहिला पंधरवडा</th><th colspan="3">दुसरा पंधरवडा</th>
          <th rowspan="2">मासिक</th><th rowspan="2">प्रगतिपर</th>
        </tr>
        <tr><th>M</th><th>F</th><th>Total</th><th>M</th><th>F</th><th>Total</th></tr>
      </thead><tbody>${rows || '<tr><td colspan="10">कोणतीही नोंद नाही</td></tr>'}</tbody>
      <tfoot><tr class="total-row"><td colspan="2">Total</td><td>${firstMale}</td><td>${firstFemale}</td><td>${firstTotal}</td><td>${secondMale}</td><td>${secondFemale}</td><td>${secondTotal}</td><td>${monthlyTotal}</td><td>${progressive}</td></tr></tfoot>
      </table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

export default function BloodSlideReport() {
  const colors = useColors();
  const {
    profile,
    reportPeriod,
    bloodSlideReports,
    addBloodSlideReport,
    updateBloodSlideReport,
    removeBloodSlideReport,
  } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [villageName, setVillageName] = useState('');
  const [firstMale, setFirstMale] = useState('');
  const [firstFemale, setFirstFemale] = useState('');
  const [secondMale, setSecondMale] = useState('');
  const [secondFemale, setSecondFemale] = useState('');
  const [progressive, setProgressive] = useState('');

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(reportPeriod.year, reportPeriod.month - 1, 1));
  const firstTotal = sumPair(firstMale, firstFemale);
  const secondTotal = sumPair(secondMale, secondFemale);
  const monthlyTotal = sumPair(firstTotal, secondTotal);

  const resetForm = () => {
    setVillageName('');
    setFirstMale('');
    setFirstFemale('');
    setSecondMale('');
    setSecondFemale('');
    setProgressive('');
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setEditingId(null);
    } else {
      const firstVillage = profile.villages.find((village) => village.name.trim());
      if (firstVillage) setVillageName(firstVillage.name.trim());
    }
    setShowForm((value) => !value);
  };

  const selectVillage = (value: string) => setVillageName(value);

  const saveReport = () => {
    if (!villageName.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'प्रोफाइलमधून गावाचे नाव निवडा.');
      return;
    }
    const report: Omit<BloodSlideReportEntry, 'id'> = {
      employeeName: profile.name.trim(),
      primaryHealthCenter: profile.primaryHealthCenter.trim(),
      subCenter: profile.subCenter.trim(),
      bsCode: profile.bsCode.trim(),
      villageName: villageName.trim(),
      firstFortnightMale: firstMale.trim(),
      firstFortnightFemale: firstFemale.trim(),
      firstFortnightTotal: firstTotal,
      secondFortnightMale: secondMale.trim(),
      secondFortnightFemale: secondFemale.trim(),
      secondFortnightTotal: secondTotal,
      monthlyTotal,
      progressive: progressive.trim(),
    };
    if (editingId) updateBloodSlideReport(editingId, report);
    else addBloodSlideReport(report);
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const editReport = (entry: BloodSlideReportEntry) => {
    setEditingId(entry.id);
    setVillageName(entry.villageName);
    setFirstMale(entry.firstFortnightMale);
    setFirstFemale(entry.firstFortnightFemale);
    setSecondMale(entry.secondFortnightMale);
    setSecondFemale(entry.secondFortnightFemale);
    setProgressive(entry.progressive);
    setShowForm(true);
  };

  const exportPdf = async () => {
    const html = buildBloodSlideReportHtml({
      profile: {
        name: profile.name,
        primaryHealthCenter: profile.primaryHealthCenter,
        subCenter: profile.subCenter,
        bsCode: profile.bsCode,
        taluka: profile.taluka,
        district: profile.district,
      },
      reports: bloodSlideReports,
      monthLabel,
    });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({ html, dialogTitle: 'Blood Slides Report शेअर करा', logLabel: 'Blood slides report' });
    } catch (error) {
      console.error('Blood slide report PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  return (
    <View>
      <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="file-text" size={18} color={colors.primary} /></View>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 8</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Blood Slides Report</Text>
        </View>
        <Pressable testID="add-blood-slide-report" accessibilityRole="button" accessibilityLabel="नवीन Blood Slides Report नोंद जोडा" onPress={toggleForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
          <Feather name={showForm ? 'x' : 'plus'} size={17} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
        <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'} · {monthLabel}</Text>
        <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>कर्मचारी: {profile.name || '—'} · BS Code: {profile.bsCode || '—'}</Text>
        <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
        <Text style={[styles.reportTitle, { color: colors.foreground }]}>Blood Slides Report</Text>
        <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{bloodSlideReports.length} गावांच्या नोंदी · पंधरवड्याचे Total आणि मासिक बेरीज आपोआप</Text>
      </View>

      {showForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.formHeading}>
          <View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingId ? 'Blood Slide नोंद बदला' : 'नवीन Blood Slide नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>M आणि F संख्या भरा; Total आणि मासिक रक्कम आपोआप मोजली जाईल.</Text></View>
          <Feather name="file-text" size={18} color={colors.primary} />
        </View>
        <ProfileValueField label="कर्मचाऱ्याचे नाव (प्रोफाइलमधून)" value={profile.name} colors={colors} />
        <View style={styles.twoColumns}>
          <View style={styles.column}><ProfileValueField label="प्राथमिक आरोग्य केंद्र (प्रोफाइलमधून)" value={profile.primaryHealthCenter} colors={colors} /></View>
          <View style={styles.column}><ProfileValueField label="उपकेंद्र (प्रोफाइलमधून)" value={profile.subCenter} colors={colors} /></View>
        </View>
        <View style={styles.twoColumns}>
          <View style={styles.column}><ProfileValueField label="BS Code (प्रोफाइलमधून)" value={profile.bsCode} colors={colors} /></View>
          <View style={styles.column}><ProfileValueField label="महिना / वर्ष" value={monthLabel} colors={colors} /></View>
        </View>
        <VillageChoiceField value={villageName} villages={profile.villages} onChange={selectVillage} colors={colors} />
        <Text style={[styles.periodLabel, { color: colors.primary }]}>पहिला पंधरवडा</Text>
        <View style={styles.twoColumns}>
          <View style={styles.column}><FormField label="M" value={firstMale} onChangeText={setFirstMale} placeholder="M संख्या" keyboardType="number-pad" colors={colors} /></View>
          <View style={styles.column}><FormField label="F" value={firstFemale} onChangeText={setFirstFemale} placeholder="F संख्या" keyboardType="number-pad" colors={colors} /></View>
        </View>
        <ProfileValueField label="Total (M + F)" value={firstTotal} colors={colors} />
        <Text style={[styles.periodLabel, { color: colors.primary }]}>दुसरा पंधरवडा</Text>
        <View style={styles.twoColumns}>
          <View style={styles.column}><FormField label="M" value={secondMale} onChangeText={setSecondMale} placeholder="M संख्या" keyboardType="number-pad" colors={colors} /></View>
          <View style={styles.column}><FormField label="F" value={secondFemale} onChangeText={setSecondFemale} placeholder="F संख्या" keyboardType="number-pad" colors={colors} /></View>
        </View>
        <ProfileValueField label="Total (M + F)" value={secondTotal} colors={colors} />
        <View style={[styles.monthlyPreview, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.monthlyLabel, { color: colors.mutedForeground }]}>मासिक Total</Text>
          <Text style={[styles.monthlyValue, { color: colors.foreground }]}>{monthlyTotal || '—'}</Text>
        </View>
        <FormField label="प्रगतिपर" value={progressive} onChangeText={setProgressive} placeholder="आकडा" keyboardType="number-pad" colors={colors} />
        <Pressable testID="save-blood-slide-report" onPress={saveReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}>
          <Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text>
        </Pressable>
      </View> : null}

      <View style={styles.entriesHeader}>
        <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>Blood Slide नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>गावनिहाय M, F, Total आणि मासिक बेरीज.</Text></View>
        <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{bloodSlideReports.length}</Text></View>
      </View>
      {bloodSlideReports.length ? bloodSlideReports.map((entry, index) => (
        <EntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.villageName} गावाची Blood Slide नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeBloodSlideReport(entry.id) }])} />
      )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="file-text" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून Blood Slide नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>वरील + बटन दाबून गावाची पहिली नोंद जोडा.</Text></View>}
      {bloodSlideReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>Blood Slides Report तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>तपासल्यानंतर landscape PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
        <Pressable testID="share-blood-slide-report-pdf" onPress={() => void exportPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
      </View> : null}
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, colors }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'number-pad'; colors: ColorTokens }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType ?? 'default'} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>;
}

function ProfileValueField({ label, value, colors }: { label: string; value: string; colors: ColorTokens }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><View style={[styles.input, styles.readOnlyField, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Text style={[styles.readOnlyText, { color: colors.foreground }]}>{value || 'प्रोफाइलमध्ये भरा'}</Text></View></View>;
}

function VillageChoiceField({ value, villages, onChange, colors }: { value: string; villages: Village[]; onChange: (value: string) => void; colors: ColorTokens }) {
  const availableVillages = villages.filter((village) => village.name.trim());
  return <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>गावाचे नाव *</Text>
    {availableVillages.length ? <View style={styles.villageChoices}>{availableVillages.map((village) => {
      const selected = value === village.name.trim();
      return <Pressable key={village.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onChange(village.name.trim())} style={({ pressed }) => [styles.villageChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background, opacity: pressed ? 0.75 : 1 }]}><Feather name={selected ? 'check-circle' : 'circle'} size={16} color={selected ? colors.primary : colors.mutedForeground} /><Text style={[styles.villageChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{village.name.trim()}</Text></Pressable>;
    })}</View> : <View style={[styles.noVillagesNotice, { backgroundColor: colors.secondary }]}><Feather name="info" size={15} color={colors.primary} /><Text style={[styles.noVillagesText, { color: colors.foreground }]}>प्रोफाइलमध्ये आधी गावांची नोंद करा.</Text></View>}
    {value ? <Text style={[styles.selectedVillageText, { color: colors.primary }]}>निवडलेले गाव: {value}</Text> : null}
  </View>;
}

function EntryCard({ entry, index, colors, onEdit, onRemove }: { entry: BloodSlideReportEntry; index: number; colors: ColorTokens; onEdit: () => void; onRemove: () => void }) {
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.villageName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>पहिला: M {entry.firstFortnightMale || '—'} · F {entry.firstFortnightFemale || '—'} · Total {entry.firstFortnightTotal || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>दुसरा: M {entry.secondFortnightMale || '—'} · F {entry.secondFortnightFemale || '—'} · Total {entry.secondFortnightTotal || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>मासिक: {entry.monthlyTotal || '—'} · प्रगतिपर: {entry.progressive || '—'}</Text>
    </View>
    <View style={styles.entryActions}><Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} ची Blood Slide नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} ची Blood Slide नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  sectionBanner: { borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  sectionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.7 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 3 },
  sectionAddButton: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportPaper: { borderRadius: 17, borderWidth: 1, padding: 16, marginBottom: 14 },
  facilityName: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  facilityMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 5 },
  reportTitleRule: { borderTopWidth: 1, marginTop: 13, paddingTop: 12 },
  reportTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  reportSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 5 },
  formCard: { borderRadius: 17, borderWidth: 1, padding: 14, marginBottom: 16 },
  formHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  formTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  formHint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4, maxWidth: 290 },
  twoColumns: { flexDirection: 'row', gap: 9 },
  column: { flex: 1, minWidth: 0 },
  field: { marginBottom: 11 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginBottom: 6 },
  input: { height: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, fontFamily: 'Inter_400Regular', fontSize: 13 },
  readOnlyField: { justifyContent: 'center' },
  readOnlyText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  villageChoices: { gap: 7, marginBottom: 5 },
  villageChoice: { minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  villageChoiceText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  noVillagesNotice: { minHeight: 42, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noVillagesText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11 },
  selectedVillageText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 3 },
  periodLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 9, marginTop: 2 },
  monthlyPreview: { borderRadius: 12, padding: 12, marginBottom: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthlyLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  monthlyValue: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  saveButton: { height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  entriesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  entriesTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  entriesSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  countPill: { minWidth: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countPillText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  entryCard: { borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9 },
  entryNumber: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  entryNumberText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  entryCopy: { flex: 1, paddingRight: 8 },
  entryName: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  entryMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  entryActions: { gap: 14, paddingTop: 2 },
  emptyCard: { borderRadius: 17, borderWidth: 1, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18, marginBottom: 14 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 9 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'center' },
  exportCard: { borderRadius: 17, borderWidth: 1, padding: 14, marginBottom: 14 },
  exportHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exportTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  exportText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  exportButton: { minHeight: 40, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13 },
  exportButtonText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
});