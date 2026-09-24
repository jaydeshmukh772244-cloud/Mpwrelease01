import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppData } from '@/context/AppDataContext';
import type { BloodSampleMonthlyReportEntry, Village } from '@/context/AppDataContext';
import { shareOrPrintPdfOnNative } from '@/components/nativePdf';
import { useColors } from '@/hooks/useColors';

type ColorTokens = ReturnType<typeof useColors>;

const numberValue = (value: string) => {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const totalValue = (first: string, second: string) =>
  String(numberValue(first) + numberValue(second));

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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

export function buildBloodSampleMonthlyReportHtml({
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
  reports: BloodSampleMonthlyReportEntry[];
  monthLabel: string;
}) {
  const rows = reports
    .map(
      (entry, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(entry.employeeName)}</td>
          <td>${escapeHtml(entry.villageName)}</td>
          <td>${escapeHtml(entry.population)}</td>
          <td>${escapeHtml(entry.firstFortnightFeverPatients)}</td>
          <td>${escapeHtml(entry.firstFortnightBloodSamples)}</td>
          <td>${escapeHtml(entry.secondFortnightFeverPatients)}</td>
          <td>${escapeHtml(entry.secondFortnightBloodSamples)}</td>
          <td>${totalValue(entry.firstFortnightFeverPatients, entry.secondFortnightFeverPatients)}</td>
          <td>${totalValue(entry.firstFortnightBloodSamples, entry.secondFortnightBloodSamples)}</td>
          <td>${escapeHtml(entry.annualFeverPatients)}</td>
          <td>${escapeHtml(entry.annualBloodSamples)}</td>
          <td>${escapeHtml(entry.remark)}</td>
        </tr>`,
    )
    .join('');

  const sum = (getValue: (entry: BloodSampleMonthlyReportEntry) => string) =>
    reports.reduce((total, entry) => total + numberValue(getValue(entry)), 0);
  const firstFever = sum((entry) => entry.firstFortnightFeverPatients);
  const firstBlood = sum((entry) => entry.firstFortnightBloodSamples);
  const secondFever = sum((entry) => entry.secondFortnightFeverPatients);
  const secondBlood = sum((entry) => entry.secondFortnightBloodSamples);
  const annualFever = sum((entry) => entry.annualFeverPatients);
  const annualBlood = sum((entry) => entry.annualBloodSamples);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>गावनिहाय रक्तनमुने मासिक अहवाल - ${escapeHtml(monthLabel)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #17231f; margin: 0; }
          .top { text-align: center; border: 1.5px solid #17231f; border-bottom: 0; padding: 8px 8px 5px; }
          h1 { font-size: 18px; margin: 0 0 7px; }
          .meta { display: flex; justify-content: space-between; font-size: 11px; }
          .meta span { min-width: 30%; text-align: left; }
          .meta span:last-child { text-align: right; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8.5px; }
          th, td { border: 1px solid #17231f; padding: 4px 2px; text-align: center; vertical-align: middle; word-break: break-word; }
          thead th { font-weight: 700; background: #e6f1ed; }
          .left { text-align: left; }
          .totals td { font-weight: 700; background: #f2f6f4; }
          .signatures { display: flex; justify-content: space-between; margin-top: 36px; font-size: 11px; }
          .signature { width: 33%; line-height: 1.8; }
          .signature:last-child { text-align: right; }
          .empty { text-align: center; padding: 22px; border: 1px solid #17231f; }
        </style>
      </head>
      <body>
        <div class="top">
          <h1>गावनिहाय रक्तनमुने मासिक अहवाल</h1>
          <div class="meta">
            <span>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</span>
            <span>माह: ${escapeHtml(monthLabel)}</span>
            <span>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</span>
          </div>
        </div>
        ${
          reports.length
            ? `<table>
                <thead>
                  <tr>
                    <th rowspan="2">अ. क्र.</th>
                    <th rowspan="2">कर्मचाऱ्याचे नाव</th>
                    <th rowspan="2">गावाचे नाव</th>
                    <th rowspan="2">एकूण<br />लोकसंख्या</th>
                    <th colspan="2">पहिला पंधरवडा</th>
                    <th colspan="2">दुसरा पंधरवडा</th>
                    <th colspan="2">एकूण मासिक</th>
                    <th colspan="2">प्रतिवर्ष</th>
                    <th rowspan="2">शेरा</th>
                  </tr>
                  <tr>
                    <th>तापाचे<br />रुग्ण</th>
                    <th>रक्त<br />नमुने</th>
                    <th>तापाचे<br />रुग्ण</th>
                    <th>रक्त<br />नमुने</th>
                    <th>तापाचे<br />रुग्ण</th>
                    <th>रक्त<br />नमुने</th>
                    <th>तापाचे<br />रुग्ण</th>
                    <th>रक्त<br />नमुने</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <tr class="totals">
                    <td colspan="3">एकूण</td>
                    <td>${sum((entry) => entry.population)}</td>
                    <td>${firstFever}</td>
                    <td>${firstBlood}</td>
                    <td>${secondFever}</td>
                    <td>${secondBlood}</td>
                    <td>${firstFever + secondFever}</td>
                    <td>${firstBlood + secondBlood}</td>
                    <td>${annualFever}</td>
                    <td>${annualBlood}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>`
            : '<div class="empty">या महिन्यासाठी कोणतीही नोंद नाही.</div>'
        }
        <div class="signatures">
          <div class="signature">सविनय सादर,<br />वैद्यकीय अधिकारी<br />प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
          <div class="signature">आरोग्य सेवक: ${escapeHtml(profile.name || '—')}<br />उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
        </div>
      </body>
    </html>`;
}

export default function BloodSampleMonthlyReport() {
  const colors = useColors();
  const {
    profile,
    reportPeriod,
    bloodSampleMonthlyReports,
    addBloodSampleMonthlyReport,
    updateBloodSampleMonthlyReport,
    removeBloodSampleMonthlyReport,
  } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [villageName, setVillageName] = useState('');
  const [population, setPopulation] = useState('');
  const [firstFortnightFeverPatients, setFirstFortnightFeverPatients] = useState('');
  const [firstFortnightBloodSamples, setFirstFortnightBloodSamples] = useState('');
  const [secondFortnightFeverPatients, setSecondFortnightFeverPatients] = useState('');
  const [secondFortnightBloodSamples, setSecondFortnightBloodSamples] = useState('');
  const [annualFeverPatients, setAnnualFeverPatients] = useState('');
  const [annualBloodSamples, setAnnualBloodSamples] = useState('');
  const [remark, setRemark] = useState('');

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(reportPeriod.year, reportPeriod.month - 1, 1));
  const monthlyFeverPatients = totalValue(firstFortnightFeverPatients, secondFortnightFeverPatients);
  const monthlyBloodSamples = totalValue(firstFortnightBloodSamples, secondFortnightBloodSamples);

  const resetForm = () => {
    setVillageName('');
    setPopulation('');
    setFirstFortnightFeverPatients('');
    setFirstFortnightBloodSamples('');
    setSecondFortnightFeverPatients('');
    setSecondFortnightBloodSamples('');
    setAnnualFeverPatients('');
    setAnnualBloodSamples('');
    setRemark('');
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setEditingId(null);
    } else {
      const firstVillage = profile.villages.find((village) => village.name.trim());
      if (firstVillage) {
        setVillageName(firstVillage.name);
        setPopulation(firstVillage.population);
      }
    }
    setShowForm((current) => !current);
  };

  const selectVillage = (value: string) => {
    setVillageName(value);
    const village = profile.villages.find((item) => item.name.trim() === value.trim());
    if (village) setPopulation(village.population);
  };

  const saveReport = () => {
    if (!profile.name.trim() || !villageName.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'प्रोफाइलमध्ये कर्मचाऱ्याचे नाव आणि किमान एक गाव भरा.');
      return;
    }
    const report: Omit<BloodSampleMonthlyReportEntry, 'id'> = {
      employeeName: profile.name.trim(),
      villageName: villageName.trim(),
      population: population.trim(),
      firstFortnightFeverPatients: firstFortnightFeverPatients.trim(),
      firstFortnightBloodSamples: firstFortnightBloodSamples.trim(),
      secondFortnightFeverPatients: secondFortnightFeverPatients.trim(),
      secondFortnightBloodSamples: secondFortnightBloodSamples.trim(),
      annualFeverPatients: annualFeverPatients.trim(),
      annualBloodSamples: annualBloodSamples.trim(),
      remark: remark.trim(),
    };
    if (editingId) {
      updateBloodSampleMonthlyReport(editingId, report);
    } else {
      addBloodSampleMonthlyReport(report);
    }
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const editReport = (entry: BloodSampleMonthlyReportEntry) => {
    setEditingId(entry.id);
    setVillageName(entry.villageName);
    setPopulation(entry.population);
    setFirstFortnightFeverPatients(entry.firstFortnightFeverPatients);
    setFirstFortnightBloodSamples(entry.firstFortnightBloodSamples);
    setSecondFortnightFeverPatients(entry.secondFortnightFeverPatients);
    setSecondFortnightBloodSamples(entry.secondFortnightBloodSamples);
    setAnnualFeverPatients(entry.annualFeverPatients);
    setAnnualBloodSamples(entry.annualBloodSamples);
    setRemark(entry.remark);
    setShowForm(true);
  };

  const exportPdf = async () => {
    const html = buildBloodSampleMonthlyReportHtml({
      profile,
      reports: bloodSampleMonthlyReports,
      monthLabel,
    });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'गावनिहाय रक्तनमुने मासिक अहवाल शेअर करा',
        logLabel: 'Blood sample monthly report',
      });
    } catch (error) {
      console.error('Blood sample monthly report PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  return (
    <View>
      <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionIconText, { color: colors.primary }]}>र</Text>
        </View>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT 1 OF 2</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>गावनिहाय रक्तनमुने मासिक अहवाल</Text>
        </View>
        <Pressable
          testID="add-blood-sample-monthly-report"
          accessibilityRole="button"
          accessibilityLabel="नवीन गावनिहाय रक्तनमुना नोंद जोडा"
          onPress={toggleForm}
          style={({ pressed }) => [
            styles.sectionAddButton,
            { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.addIcon, { color: colors.primary }]}>{showForm ? '×' : '+'}</Text>
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
        <Text style={[styles.reportTitle, { color: colors.foreground }]}>गावनिहाय रक्तनमुने मासिक अहवाल</Text>
        <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>
          {bloodSampleMonthlyReports.length} गावांच्या नोंदी · मासिक एकूण आपोआप मोजले जाते
        </Text>
      </View>

      {showForm ? (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {editingId ? 'रक्तनमुना नोंद बदला' : 'नवीन रक्तनमुना नोंद'}
          </Text>
          <Text style={[styles.formHint, { color: colors.mutedForeground }]}>
            नमुन्यातील प्रत्येक गावासाठी पहिला आणि दुसरा पंधरवडा भरा.
          </Text>
          <ProfileValueField label="कर्मचाऱ्याचे नाव (प्रोफाइलमधून)" value={profile.name} colors={colors} />
          <VillageChoiceField value={villageName} villages={profile.villages} onChange={selectVillage} colors={colors} />
          <ProfileValueField label="लोकसंख्या (गावाच्या प्रोफाइलमधून)" value={population} colors={colors} />
          <View style={styles.periodHeading}>
            <Text style={[styles.periodHeadingText, { color: colors.primary }]}>पहिला पंधरवडा</Text>
            <Text style={[styles.periodHeadingText, { color: colors.primary }]}>दुसरा पंधरवडा</Text>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <FormField label="तापाचे रुग्ण" value={firstFortnightFeverPatients} onChangeText={setFirstFortnightFeverPatients} placeholder="संख्या" keyboardType="number-pad" colors={colors} />
              <FormField label="रक्त नमुने" value={firstFortnightBloodSamples} onChangeText={setFirstFortnightBloodSamples} placeholder="संख्या" keyboardType="number-pad" colors={colors} />
            </View>
            <View style={styles.column}>
              <FormField label="तापाचे रुग्ण" value={secondFortnightFeverPatients} onChangeText={setSecondFortnightFeverPatients} placeholder="संख्या" keyboardType="number-pad" colors={colors} />
              <FormField label="रक्त नमुने" value={secondFortnightBloodSamples} onChangeText={setSecondFortnightBloodSamples} placeholder="संख्या" keyboardType="number-pad" colors={colors} />
            </View>
          </View>
          <View style={[styles.totalPreview, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.totalPreviewLabel, { color: colors.mutedForeground }]}>एकूण मासिक</Text>
            <Text style={[styles.totalPreviewValue, { color: colors.foreground }]}>
              तापाचे रुग्ण {monthlyFeverPatients}  ·  रक्त नमुने {monthlyBloodSamples}
            </Text>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.column}><FormField label="प्रतिवर्ष तापाचे रुग्ण" value={annualFeverPatients} onChangeText={setAnnualFeverPatients} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
            <View style={styles.column}><FormField label="प्रतिवर्ष रक्त नमुने" value={annualBloodSamples} onChangeText={setAnnualBloodSamples} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
          </View>
          <FormField label="शेरा" value={remark} onChangeText={setRemark} placeholder="अतिरिक्त माहिती" colors={colors} />
          <Pressable
            testID="save-blood-sample-monthly-report"
            onPress={saveReport}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
          >
            <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>
              {editingId ? 'बदल जतन करा' : 'रक्तनमुना नोंद जतन करा'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.entriesHeader}>
        <View>
          <Text style={[styles.entriesTitle, { color: colors.foreground }]}>रक्तनमुना report नोंदी</Text>
          <Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>गावनिहाय माहिती तपासा, बदला किंवा हटवा.</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.countPillText, { color: colors.primary }]}>{bloodSampleMonthlyReports.length}</Text>
        </View>
      </View>

      {bloodSampleMonthlyReports.length ? (
        bloodSampleMonthlyReports.map((entry, index) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={index}
            colors={colors}
            onEdit={() => editReport(entry)}
            onRemove={() =>
              Alert.alert('नोंद हटवायची?', `${entry.villageName} गावाची रक्तनमुना नोंद हटवायची आहे का?`, [
                { text: 'रद्द करा', style: 'cancel' },
                { text: 'हटवा', style: 'destructive', onPress: () => removeBloodSampleMonthlyReport(entry.id) },
              ])
            }
          />
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>र</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून रक्तनमुना नोंद नाही</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>वरील + बटन दाबून पहिली गावनिहाय नोंद जोडा.</Text>
        </View>
      )}

      {bloodSampleMonthlyReports.length ? (
        <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.exportTitle, { color: colors.foreground }]}>रिपोर्ट तयार आहे?</Text>
            <Text style={[styles.exportText, { color: colors.mutedForeground }]}>नमुना तपासल्यानंतर PDF share करा.</Text>
          </View>
          <Pressable
            testID="share-blood-sample-monthly-report-pdf"
            onPress={() => void exportPdf()}
            style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
          >
            <Text style={[styles.exportButtonText, { color: colors.primaryForeground }]}>PDF शेअर करा</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function FormField({
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
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
      />
    </View>
  );
}

function ProfileValueField({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ColorTokens;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.readOnlyField, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
        <Text style={[styles.readOnlyText, { color: colors.foreground }]}>{value || 'प्रोफाइलमध्ये भरा'}</Text>
      </View>
    </View>
  );
}

function VillageChoiceField({
  value,
  villages,
  onChange,
  colors,
}: {
  value: string;
  villages: Village[];
  onChange: (value: string) => void;
  colors: ColorTokens;
}) {
  const availableVillages = villages.filter((village) => village.name.trim());
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>गावाचे नाव (प्रोफाइलमधून) *</Text>
      {availableVillages.length ? (
        <View style={styles.villageChoices}>
          {availableVillages.map((village) => {
            const selected = value === village.name.trim();
            return (
              <Pressable
                key={village.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${village.name} गाव निवडा`}
                onPress={() => onChange(village.name.trim())}
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
                <Text style={[styles.villageChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{village.name}</Text>
                <Text style={[styles.villagePopulation, { color: colors.mutedForeground }]}>{village.population || '—'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={[styles.noVillagesNotice, { backgroundColor: colors.secondary }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.noVillagesText, { color: colors.foreground }]}>प्रोफाइलमध्ये अजून गावे जोडलेली नाहीत.</Text>
        </View>
      )}
    </View>
  );
}

function EntryCard({
  entry,
  index,
  colors,
  onEdit,
  onRemove,
}: {
  entry: BloodSampleMonthlyReportEntry;
  index: number;
  colors: ColorTokens;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const monthlyFever = useMemo(
    () => totalValue(entry.firstFortnightFeverPatients, entry.secondFortnightFeverPatients),
    [entry.firstFortnightFeverPatients, entry.secondFortnightFeverPatients],
  );
  const monthlyBlood = useMemo(
    () => totalValue(entry.firstFortnightBloodSamples, entry.secondFortnightBloodSamples),
    [entry.firstFortnightBloodSamples, entry.secondFortnightBloodSamples],
  );
  return (
    <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.entryTop}>
        <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <View style={styles.entryMain}>
          <Text style={[styles.entryVillage, { color: colors.foreground }]}>{entry.villageName}</Text>
          <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
            {entry.employeeName}  ·  लोकसंख्या {entry.population || '—'}
          </Text>
        </View>
        <View style={styles.entryActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} नोंद बदला`} onPress={onEdit} hitSlop={10}>
            <Text style={[styles.actionText, { color: colors.primary }]}>बदल</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} नोंद हटवा`} onPress={onRemove} hitSlop={10}>
            <Text style={[styles.actionText, { color: colors.destructive }]}>हटवा</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.entryStats, { borderTopColor: colors.border }]}>
        <Text style={[styles.entryStat, { color: colors.mutedForeground }]}>१ला पंधरवडा: {entry.firstFortnightFeverPatients || '0'} / {entry.firstFortnightBloodSamples || '0'}</Text>
        <Text style={[styles.entryStat, { color: colors.mutedForeground }]}>२रा पंधरवडा: {entry.secondFortnightFeverPatients || '0'} / {entry.secondFortnightBloodSamples || '0'}</Text>
        <Text style={[styles.entryStatStrong, { color: colors.foreground }]}>मासिक: {monthlyFever} / {monthlyBlood}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBanner: { borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionIconText: { fontSize: 19, fontWeight: '700' },
  sectionCopy: { flex: 1 },
  sectionEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 3 },
  sectionAddButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 25, lineHeight: 27, fontWeight: '400' },
  reportPaper: { borderRadius: 17, borderWidth: 1, padding: 15, marginBottom: 14 },
  facilityName: { fontSize: 13, fontWeight: '700' },
  facilityMeta: { fontSize: 10, marginTop: 4 },
  reportTitleRule: { borderTopWidth: 1, marginVertical: 12 },
  reportTitle: { fontSize: 16, fontWeight: '700' },
  reportSubtitle: { fontSize: 10, marginTop: 5 },
  formCard: { borderRadius: 17, borderWidth: 1, padding: 15, marginBottom: 17 },
  formTitle: { fontSize: 15, fontWeight: '700' },
  formHint: { fontSize: 10, marginTop: 4, marginBottom: 12 },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 10, fontWeight: '600', marginBottom: 5 },
  input: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, fontSize: 13 },
  readOnlyField: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, justifyContent: 'center' },
  readOnlyText: { fontSize: 13 },
  villageChoices: { gap: 7, marginBottom: 2 },
  villageChoice: { minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  villageChoiceText: { flex: 1, fontSize: 12, fontWeight: '600' },
  villagePopulation: { fontSize: 10, fontWeight: '600' },
  noVillagesNotice: { minHeight: 42, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noVillagesText: { flex: 1, fontSize: 11 },
  periodHeading: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, marginBottom: 3 },
  periodHeadingText: { width: '48%', fontSize: 10, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  totalPreview: { borderRadius: 11, padding: 10, marginBottom: 11 },
  totalPreviewLabel: { fontSize: 9, fontWeight: '600' },
  totalPreviewValue: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  saveButton: { minHeight: 43, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  saveButtonText: { fontSize: 12, fontWeight: '700' },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  entriesTitle: { fontSize: 14, fontWeight: '700' },
  entriesSubtitle: { fontSize: 10, marginTop: 3 },
  countPill: { minWidth: 29, height: 29, paddingHorizontal: 8, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  countPillText: { fontSize: 12, fontWeight: '700' },
  entryCard: { borderRadius: 15, borderWidth: 1, padding: 13, marginBottom: 9 },
  entryTop: { flexDirection: 'row', alignItems: 'center' },
  entryNumber: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  entryNumberText: { fontSize: 12, fontWeight: '700' },
  entryMain: { flex: 1 },
  entryVillage: { fontSize: 13, fontWeight: '700' },
  entryMeta: { fontSize: 10, marginTop: 3 },
  entryActions: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  actionText: { fontSize: 10, fontWeight: '700' },
  entryStats: { borderTopWidth: 1, marginTop: 11, paddingTop: 9, gap: 4 },
  entryStat: { fontSize: 10 },
  entryStatStrong: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  emptyCard: { borderRadius: 15, borderWidth: 1, padding: 22, alignItems: 'center', marginBottom: 14 },
  emptyIcon: { fontSize: 26, fontWeight: '700' },
  emptyTitle: { fontSize: 13, fontWeight: '700', marginTop: 7 },
  emptyText: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  exportCard: { borderRadius: 17, borderWidth: 1, padding: 14, marginBottom: 14 },
  exportTitle: { fontSize: 13, fontWeight: '700' },
  exportText: { fontSize: 10, marginTop: 4 },
  exportButton: { minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  exportButtonText: { fontSize: 11, fontWeight: '700' },
});