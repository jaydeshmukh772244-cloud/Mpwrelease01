import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';

const numberValue = (value: string) => Number(value.replace(',', '.')) || 0;

const parseDate = (value: string) => {
  const parts = value.trim().split(/[./-]/).map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  const [day, month, inputYear] = parts;
  const year = inputYear < 100 ? 2000 + inputYear : inputYear;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date | null) =>
  date ? new Intl.DateTimeFormat('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date) : '';

const ageText = (date: Date | null) => {
  if (!date) return '';
  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  let months = today.getMonth() - date.getMonth();
  let days = today.getDate() - date.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} वर्षे ${months} महिने ${days} दिवस`;
};

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<'indices' | 'age' | 'lmpEdd'>('indices');
  const [housesInspected, setHousesInspected] = useState('');
  const [positiveHouses, setPositiveHouses] = useState('');
  const [containersInspected, setContainersInspected] = useState('');
  const [positiveContainers, setPositiveContainers] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [lmpDate, setLmpDate] = useState('');
  const [eddDate, setEddDate] = useState('');
  const result = useMemo(() => {
    const houses = numberValue(housesInspected);
    const positiveHouseCount = numberValue(positiveHouses);
    const containers = numberValue(containersInspected);
    const positiveContainerCount = numberValue(positiveContainers);
    const birthDate = parseDate(dateOfBirth);
    const lastMenstrualPeriod = parseDate(lmpDate);
    const expectedDueDate = parseDate(eddDate);
    return {
      hi: houses > 0 ? (positiveHouseCount / houses) * 100 : 0,
      ci: containers > 0 ? (positiveContainerCount / containers) * 100 : 0,
      bi: houses > 0 ? (positiveContainerCount / houses) * 100 : 0,
      invalidIndices: positiveHouseCount > houses || positiveContainerCount > containers,
      age: ageText(birthDate),
      invalidBirthDate: dateOfBirth.trim().length > 0 && !birthDate,
      invalidLmpDate: lmpDate.trim().length > 0 && !lastMenstrualPeriod,
      calculatedEdd: formatDate(lastMenstrualPeriod ? addDays(lastMenstrualPeriod, 280) : null),
      invalidEddDate: eddDate.trim().length > 0 && !expectedDueDate,
      calculatedLmp: formatDate(expectedDueDate ? addDays(expectedDueDate, -280) : null),
    };
  }, [housesInspected, positiveHouses, containersInspected, positiveContainers, dateOfBirth, lmpDate, eddDate]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat bottomOffset={20} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }}>
        <ScreenHeader eyebrow="ऑफिस टूल्स" title="कॅल्क्युलेटर" subtitle="नेहमी लागणाऱ्या गणना काही सेकंदांत करा." />
        <View style={styles.body}>
          <View style={styles.toolTabs}>
            {[
              { key: 'indices' as const, icon: 'activity' as const, label: 'HI/CI/BI' },
              { key: 'age' as const, icon: 'user' as const, label: 'Age' },
              { key: 'lmpEdd' as const, icon: 'calendar' as const, label: 'LMP / EDD' },
            ].map((item) => (
              <Pressable key={item.key} onPress={() => setActive(item.key)} style={[styles.toolTab, { backgroundColor: active === item.key ? colors.primary : colors.card, borderColor: active === item.key ? colors.primary : colors.border }]}>
                <Feather name={item.icon} size={17} color={active === item.key ? '#FFFFFF' : colors.mutedForeground} />
                <Text style={[styles.toolTabText, { color: active === item.key ? '#FFFFFF' : colors.mutedForeground }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {active === 'indices' ? (
            <CalculatorCard title="HI / CI / BI Index" description="डास अळ्यांच्या सर्वेक्षणाचे तीन महत्त्वाचे निर्देशांक काढा." colors={colors}>
              <InputRow label="तपासलेली घरे" value={housesInspected} onChangeText={setHousesInspected} suffix="घरे" colors={colors} />
              <InputRow label="अळ्या असलेली घरे" value={positiveHouses} onChangeText={setPositiveHouses} suffix="घरे" colors={colors} />
              <InputRow label="तपासलेले कंटेनर" value={containersInspected} onChangeText={setContainersInspected} suffix="कंटेनर" colors={colors} />
              <InputRow label="अळ्या असलेले कंटेनर" value={positiveContainers} onChangeText={setPositiveContainers} suffix="कंटेनर" colors={colors} />
              {result.invalidIndices ? <Text style={[styles.validationText, { color: colors.destructive }]}>अळ्या असलेली संख्या तपासलेल्या संख्येपेक्षा जास्त असू शकत नाही.</Text> : null}
              <ResultRow label="HI Index" value={result.invalidIndices ? '—' : `${result.hi.toFixed(2)}%`} primary colors={colors} />
              <ResultRow label="CI Index" value={result.invalidIndices ? '—' : `${result.ci.toFixed(2)}%`} colors={colors} />
              <ResultRow label="BI Index" value={result.invalidIndices ? '—' : result.bi.toFixed(2)} colors={colors} />
              <View style={[styles.formulaNote, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.formulaText, { color: colors.foreground }]}>HI = अळ्या असलेली घरे ÷ तपासलेली घरे × 100</Text>
                <Text style={[styles.formulaText, { color: colors.foreground }]}>CI = अळ्या असलेले कंटेनर ÷ तपासलेले कंटेनर × 100</Text>
                <Text style={[styles.formulaText, { color: colors.foreground }]}>BI = अळ्या असलेले कंटेनर ÷ तपासलेली घरे × 100</Text>
              </View>
            </CalculatorCard>
          ) : active === 'age' ? (
            <CalculatorCard title="Age कॅल्क्युलेटर" description="जन्मतारखेवरून वय वर्षे, महिने आणि दिवसांत काढा." colors={colors}>
              <DateInputRow label="जन्मतारीख" value={dateOfBirth} onChangeText={setDateOfBirth} colors={colors} />
              {result.invalidBirthDate ? <Text style={[styles.validationText, { color: colors.destructive }]}>तारीख DD/MM/YYYY स्वरूपात भरा.</Text> : null}
              <ResultRow label="वय" value={result.age || '—'} primary colors={colors} />
            </CalculatorCard>
          ) : (
            <CalculatorCard title="LMP / EDD कॅल्क्युलेटर" description="LMP तारीख भरल्यावर अंदाजे प्रसूती तारीख काढा." colors={colors}>
              <DateInputRow label="LMP तारीख" value={lmpDate} onChangeText={setLmpDate} colors={colors} />
              {result.invalidLmpDate ? <Text style={[styles.validationText, { color: colors.destructive }]}>तारीख DD/MM/YYYY स्वरूपात भरा.</Text> : null}
              <ResultRow label="अंदाजे प्रसूती तारीख (EDD)" value={result.calculatedEdd || '—'} primary colors={colors} />
              <View style={[styles.formulaNote, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.formulaText, { color: colors.foreground }]}>EDD = LMP + 280 दिवस</Text>
              </View>
              <DateInputRow label="EDD तारीख" value={eddDate} onChangeText={setEddDate} colors={colors} />
              {result.invalidEddDate ? <Text style={[styles.validationText, { color: colors.destructive }]}>तारीख DD/MM/YYYY स्वरूपात भरा.</Text> : null}
              <ResultRow label="शेवटची पाळीची तारीख (LMP)" value={result.calculatedLmp || '—'} colors={colors} />
              <View style={[styles.formulaNote, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.formulaText, { color: colors.foreground }]}>LMP = EDD − 280 दिवस</Text>
              </View>
            </CalculatorCard>
          )}
          <View style={[styles.tip, { backgroundColor: colors.accent }]}>
            <Feather name="info" size={17} color={colors.accentForeground} />
            <Text style={[styles.tipText, { color: colors.accentForeground }]}>{active === 'indices' ? 'संख्या बदलली की HI, CI आणि BI Index आपोआप अपडेट होतात.' : active === 'age' ? 'जन्मतारीख भरल्यावर वय आपोआप अपडेट होते.' : 'तारीख भरल्यावर calculator चा निकाल आपोआप अपडेट होतो.'}</Text>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function CalculatorCard({ title, description, children, colors }: { title: string; description: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.calcCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.calcTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.calcDescription, { color: colors.mutedForeground }]}>{description}</Text><View style={styles.calcBody}>{children}</View></View>;
}

function InputRow({ label, value, onChangeText, prefix, suffix, colors }: { label: string; value: string; onChangeText: (value: string) => void; prefix?: string; suffix?: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.inputRow}><Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text><View style={[styles.numberInput, { backgroundColor: colors.background, borderColor: colors.input }]}>{prefix ? <Text style={[styles.affix, { color: colors.mutedForeground }]}>{prefix}</Text> : null}<TextInput keyboardType="decimal-pad" value={value} onChangeText={onChangeText} style={[styles.numberText, { color: colors.foreground }]} />{suffix ? <Text style={[styles.affix, { color: colors.mutedForeground }]}>{suffix}</Text> : null}</View></View>;
}

function DateInputRow({ label, value, onChangeText, colors }: { label: string; value: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.inputRow}><Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput keyboardType="number-pad" maxLength={10} placeholder="DD/MM/YYYY" placeholderTextColor={colors.mutedForeground} value={value} onChangeText={onChangeText} style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} /></View>;
}

function ResultRow({ label, value, primary, colors }: { label: string; value: string; primary?: boolean; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.resultRow, { borderTopColor: colors.border }]}><Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.resultValue, { color: primary ? colors.primary : colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20 },
  toolTabs: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  toolTab: { flex: 1, height: 55, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  toolTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  calcCard: { borderRadius: 21, borderWidth: 1, padding: 18 },
  calcTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  calcDescription: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  calcBody: { marginTop: 17 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  inputLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  numberInput: { width: 145, height: 43, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 },
  numberText: { flex: 1, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 15, padding: 0 },
  dateInput: { width: 145, height: 43, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, textAlign: 'right', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  affix: { fontFamily: 'Inter_500Medium', fontSize: 13, marginHorizontal: 3 },
  resultRow: { borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, marginTop: 3 },
  resultLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  resultValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  validationText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginTop: 2, marginBottom: 4 },
  formulaNote: { borderRadius: 13, padding: 12, marginTop: 15, gap: 5 },
  formulaText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  tip: { borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 15 },
  tipText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 17, flex: 1 },
});