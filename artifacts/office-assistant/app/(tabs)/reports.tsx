import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import BloodSampleMonthlyReport from '@/components/BloodSampleMonthlyReport';
import { buildBloodSampleMonthlyReportHtml } from '@/components/BloodSampleMonthlyReport';
import BloodSlideReport from '@/components/BloodSlideReport';
import { buildBloodSlideReportHtml } from '@/components/BloodSlideReport';
import GuppyFishReleasePlacesReport from '@/components/GuppyFishReleasePlacesReport';
import { buildGuppyFishReleasePlacesReportHtml } from '@/components/GuppyFishReleasePlacesReport';
import { shareOrPrintPdfOnNative } from '@/components/nativePdf';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppData } from '@/context/AppDataContext';
import type { BloodSampleMonthlyReportEntry, BloodSlideReportEntry, CataractReportEntry, CataractSurgeryReportEntry, DeathReportEntry, EntomologicalReportEntry, GuppyFishReleasePlacesReportEntry, LeprosyReportEntry, NationalProgramsReviewEntry, Profile, SputumSampleReportEntry, Village, WaterTclReportEntry } from '@/context/AppDataContext';
import { useColors } from '@/hooks/useColors';

type ReportKey = 'death' | 'cataract' | 'cataractSurgery' | 'sputum' | 'leprosy' | 'waterTcl' | 'nationalReview' | 'entomological' | 'bloodSampleMonthly' | 'bloodSlide' | 'guppyFishReleasePlaces';

const reportTitles: Record<ReportKey, string> = {
  death: 'मृत्यू अहवाल',
  cataract: 'संशयीत मोतीबिंदू अहवाल',
  cataractSurgery: 'मोतीबिंदू शस्त्रक्रिया अहवाल',
  sputum: 'थुकी नमुने अहवाल',
  leprosy: 'संशयीत कुष्ठरुग्ण अहवाल',
  waterTcl: 'पाणी नमुने व ओ.टी. अहवाल',
  nationalReview: 'सहा राष्ट्रीय कार्यक्रमाचा आढावा',
  entomological: 'किटकशास्त्रीय अहवाल',
  bloodSampleMonthly: 'गावनिहाय रक्तनमुने मासिक अहवाल',
  bloodSlide: 'Blood Slides Report',
  guppyFishReleasePlaces: 'गप्पी मासे सोडलेली ठिकाणे',
};

const reportKeyValues: ReportKey[] = ['death', 'cataract', 'cataractSurgery', 'sputum', 'leprosy', 'waterTcl', 'nationalReview', 'entomological', 'bloodSampleMonthly', 'bloodSlide', 'guppyFishReleasePlaces'];

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

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { report: requestedReport } = useLocalSearchParams<{ report?: string }>();
  const { profile, deathReports, addDeathReport, updateDeathReport, removeDeathReport, cataractReports, addCataractReport, updateCataractReport, removeCataractReport, cataractSurgeryReports, addCataractSurgeryReport, updateCataractSurgeryReport, removeCataractSurgeryReport, sputumSampleReports, addSputumSampleReport, updateSputumSampleReport, removeSputumSampleReport, leprosyReports, addLeprosyReport, updateLeprosyReport, removeLeprosyReport, waterTclReports, addWaterTclReport, updateWaterTclReport, removeWaterTclReport, nationalProgramsReviewReports, addNationalProgramsReviewReport, updateNationalProgramsReviewReport, removeNationalProgramsReviewReport, entomologicalReports, addEntomologicalReport, updateEntomologicalReport, removeEntomologicalReport, bloodSampleMonthlyReports, bloodSlideReports, guppyFishReleasePlacesReports, reportPeriod, updateReportPeriod } = useAppData();
  const requestedReportKey = reportKeyValues.includes(requestedReport as ReportKey) ? requestedReport as ReportKey : null;
  const [activeReport, setActiveReport] = useState<ReportKey | null>(requestedReportKey);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [villageName, setVillageName] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [cause, setCause] = useState('');
  const [remark, setRemark] = useState('');
  const [showPeriodEditor, setShowPeriodEditor] = useState(false);
  const [periodMonth, setPeriodMonth] = useState(String(reportPeriod.month));
  const [periodYear, setPeriodYear] = useState(String(reportPeriod.year));
  const [showCataractForm, setShowCataractForm] = useState(false);
  const [editingCataractId, setEditingCataractId] = useState<string | null>(null);
  const [cataractPersonName, setCataractPersonName] = useState('');
  const [cataractAge, setCataractAge] = useState('');
  const [cataractGender, setCataractGender] = useState('');
  const [cataractVillageName, setCataractVillageName] = useState('');
  const [cataractEye, setCataractEye] = useState<'right' | 'left' | ''>('');
  const [cataractSearchDate, setCataractSearchDate] = useState('');
  const [cataractRemark, setCataractRemark] = useState('');
  const [showCataractSurgeryForm, setShowCataractSurgeryForm] = useState(false);
  const [editingCataractSurgeryId, setEditingCataractSurgeryId] = useState<string | null>(null);
  const [cataractSurgeryPersonName, setCataractSurgeryPersonName] = useState('');
  const [cataractSurgeryAge, setCataractSurgeryAge] = useState('');
  const [cataractSurgeryGender, setCataractSurgeryGender] = useState('');
  const [cataractSurgeryVillageName, setCataractSurgeryVillageName] = useState('');
  const [cataractSurgeryEye, setCataractSurgeryEye] = useState<'right' | 'left' | ''>('');
  const [cataractSurgeryDate, setCataractSurgeryDate] = useState('');
  const [cataractSurgeryRemark, setCataractSurgeryRemark] = useState('');
  const [showSputumForm, setShowSputumForm] = useState(false);
  const [editingSputumId, setEditingSputumId] = useState<string | null>(null);
  const [sputumPersonName, setSputumPersonName] = useState('');
  const [sputumAge, setSputumAge] = useState('');
  const [sputumGender, setSputumGender] = useState('');
  const [sputumVillageName, setSputumVillageName] = useState('');
  const [sputumCollectedDate, setSputumCollectedDate] = useState('');
  const [sputumTestDate, setSputumTestDate] = useState('');
  const [sputumWorkerName, setSputumWorkerName] = useState('');
  const [sputumTestType, setSputumTestType] = useState<'sputum' | 'cbnaat' | ''>('');
  const [showLeprosyForm, setShowLeprosyForm] = useState(false);
  const [editingLeprosyId, setEditingLeprosyId] = useState<string | null>(null);
  const [leprosyPersonName, setLeprosyPersonName] = useState('');
  const [leprosyAge, setLeprosyAge] = useState('');
  const [leprosyGender, setLeprosyGender] = useState('');
  const [leprosyVillageName, setLeprosyVillageName] = useState('');
  const [leprosySpotCount, setLeprosySpotCount] = useState<'1-5' | 'more-than-5' | ''>('');
  const [leprosySpotLocation, setLeprosySpotLocation] = useState('');
  const [leprosySearchDate, setLeprosySearchDate] = useState('');
  const [showWaterTclForm, setShowWaterTclForm] = useState(false);
  const [editingWaterTclId, setEditingWaterTclId] = useState<string | null>(null);
  const [waterVillageName, setWaterVillageName] = useState('');
  const [waterPreviousBalance, setWaterPreviousBalance] = useState('');
  const [waterReceivedThisMonth, setWaterReceivedThisMonth] = useState('');
  const [waterTotalStock, setWaterTotalStock] = useState('');
  const [waterUsedStock, setWaterUsedStock] = useState('');
  const [waterClosingBalance, setWaterClosingBalance] = useState('');
  const [waterSamplesCollected, setWaterSamplesCollected] = useState('');
  const [waterSamplesSent, setWaterSamplesSent] = useState('');
  const [waterTclSuitable, setWaterTclSuitable] = useState('');
  const [waterTclUnsuitable, setWaterTclUnsuitable] = useState('');
  const [waterRemark, setWaterRemark] = useState('');
  const [showNationalReviewForm, setShowNationalReviewForm] = useState(false);
  const [editingNationalReviewId, setEditingNationalReviewId] = useState<string | null>(null);
  const [reviewVillageName, setReviewVillageName] = useState('');
  const [reviewPopulation, setReviewPopulation] = useState('');
  const [reviewTbMa, setReviewTbMa] = useState('');
  const [reviewTbPr, setReviewTbPr] = useState('');
  const [reviewLeprosyMa, setReviewLeprosyMa] = useState('');
  const [reviewLeprosyPr, setReviewLeprosyPr] = useState('');
  const [reviewCataractSuspectedMa, setReviewCataractSuspectedMa] = useState('');
  const [reviewCataractSuspectedPr, setReviewCataractSuspectedPr] = useState('');
  const [reviewCataractSurgeryMa, setReviewCataractSurgeryMa] = useState('');
  const [reviewCataractSurgeryPr, setReviewCataractSurgeryPr] = useState('');
  const [reviewSputumMa, setReviewSputumMa] = useState('');
  const [reviewSputumPr, setReviewSputumPr] = useState('');
  const [reviewWaterMa, setReviewWaterMa] = useState('');
  const [reviewWaterPr, setReviewWaterPr] = useState('');
  const [reviewTclMa, setReviewTclMa] = useState('');
  const [reviewTclPr, setReviewTclPr] = useState('');
  const [reviewSaltMa, setReviewSaltMa] = useState('');
  const [reviewSaltPr, setReviewSaltPr] = useState('');
  const [reviewOtMa, setReviewOtMa] = useState('');
  const [reviewOtPr, setReviewOtPr] = useState('');
  const [reviewRemark, setReviewRemark] = useState('');
  const [showEntomologicalForm, setShowEntomologicalForm] = useState(false);
  const [editingEntomologicalId, setEditingEntomologicalId] = useState<string | null>(null);
  const [entomologicalVillageName, setEntomologicalVillageName] = useState('');
  const [entomologicalPopulation, setEntomologicalPopulation] = useState('');
  const [entomologicalHouseholdCount, setEntomologicalHouseholdCount] = useState('');
  const [entomologicalLarvaeInspectedHouses, setEntomologicalLarvaeInspectedHouses] = useState('');
  const [entomologicalLarvaeInfestedHouses, setEntomologicalLarvaeInfestedHouses] = useState('');
  const [entomologicalContainersInspected, setEntomologicalContainersInspected] = useState('');
  const [entomologicalContainersInfested, setEntomologicalContainersInfested] = useState('');
  const [entomologicalContainersEmptied, setEntomologicalContainersEmptied] = useState('');
  const [entomologicalOvitrapHouses, setEntomologicalOvitrapHouses] = useState('');
  const [entomologicalHouseIndex, setEntomologicalHouseIndex] = useState('');
  const [entomologicalContainerIndex, setEntomologicalContainerIndex] = useState('');
  const [entomologicalBreteauIndex, setEntomologicalBreteauIndex] = useState('');

  useEffect(() => {
    setPeriodMonth(String(reportPeriod.month));
    setPeriodYear(String(reportPeriod.year));
  }, [reportPeriod]);

  useEffect(() => {
    if (requestedReportKey) setActiveReport(requestedReportKey);
  }, [requestedReportKey]);

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(reportPeriod.year, reportPeriod.month - 1, 1));

  const resetForm = () => {
    setPersonName('');
    setAge('');
    setGender('');
    setVillageName('');
    setDeathPlace('');
    setDeathDate('');
    setCause('');
    setRemark('');
  };

  const saveDeathReport = () => {
    if (!personName.trim() || !deathDate.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'मृत व्यक्तीचे नाव आणि मृत्यूची तारीख लिहा.');
      return;
    }
    const entry: Omit<DeathReportEntry, 'id'> = {
      personName: personName.trim(),
      age: age.trim(),
      gender: gender.trim(),
      villageName: villageName.trim(),
      deathPlace: deathPlace.trim(),
      deathDate: deathDate.trim(),
      cause: cause.trim(),
      remark: remark.trim(),
    };
    if (editingId) {
      updateDeathReport(editingId, entry);
    } else {
      addDeathReport(entry);
    }
    resetForm();
    setEditingId(null);
    setShowForm(false);
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setEditingId(null);
    }
    setShowForm((value) => !value);
  };

  const editDeathReport = (entry: DeathReportEntry) => {
    setEditingId(entry.id);
    setPersonName(entry.personName);
    setAge(entry.age);
    setGender(entry.gender);
    setVillageName(entry.villageName);
    setDeathPlace(entry.deathPlace);
    setDeathDate(entry.deathDate);
    setCause(entry.cause);
    setRemark(entry.remark);
    setShowForm(true);
  };

  const saveReportPeriod = () => {
    const month = Number(periodMonth);
    const year = Number(periodYear);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1900 || year > 2200) {
      Alert.alert('चुकीची तारीख', 'महिना 1 ते 12 आणि योग्य वर्ष भरा.');
      return;
    }
    updateReportPeriod({ month, year });
    setShowPeriodEditor(false);
  };

  const resetCataractForm = () => {
    setCataractPersonName('');
    setCataractAge('');
    setCataractGender('');
    setCataractVillageName('');
    setCataractEye('');
    setCataractSearchDate('');
    setCataractRemark('');
  };

  const saveCataractReport = () => {
    if (!cataractPersonName.trim() || !cataractEye) {
      Alert.alert('माहिती अपुरी आहे', 'रुग्णाचे नाव आणि कोणता डोळा हे निवडा.');
      return;
    }
    const entry: Omit<CataractReportEntry, 'id'> = {
      personName: cataractPersonName.trim(),
      age: cataractAge.trim(),
      gender: cataractGender.trim(),
      villageName: cataractVillageName.trim(),
      eye: cataractEye,
      searchDate: cataractSearchDate.trim(),
      remark: cataractRemark.trim(),
    };
    if (editingCataractId) {
      updateCataractReport(editingCataractId, entry);
    } else {
      addCataractReport(entry);
    }
    resetCataractForm();
    setEditingCataractId(null);
    setShowCataractForm(false);
  };

  const toggleCataractForm = () => {
    if (showCataractForm) {
      resetCataractForm();
      setEditingCataractId(null);
    }
    setShowCataractForm((value) => !value);
  };

  const editCataractReport = (entry: CataractReportEntry) => {
    setEditingCataractId(entry.id);
    setCataractPersonName(entry.personName);
    setCataractAge(entry.age);
    setCataractGender(entry.gender);
    setCataractVillageName(entry.villageName);
    setCataractEye(entry.eye);
    setCataractSearchDate(entry.searchDate);
    setCataractRemark(entry.remark);
    setShowCataractForm(true);
  };

  const resetCataractSurgeryForm = () => {
    setCataractSurgeryPersonName('');
    setCataractSurgeryAge('');
    setCataractSurgeryGender('');
    setCataractSurgeryVillageName('');
    setCataractSurgeryEye('');
    setCataractSurgeryDate('');
    setCataractSurgeryRemark('');
  };

  const saveCataractSurgeryReport = () => {
    if (!cataractSurgeryPersonName.trim() || !cataractSurgeryEye) {
      Alert.alert('माहिती अपुरी आहे', 'रुग्णाचे नाव आणि कोणता डोळा हे निवडा.');
      return;
    }
    const entry: Omit<CataractSurgeryReportEntry, 'id'> = {
      personName: cataractSurgeryPersonName.trim(),
      age: cataractSurgeryAge.trim(),
      gender: cataractSurgeryGender.trim(),
      villageName: cataractSurgeryVillageName.trim(),
      eye: cataractSurgeryEye,
      surgeryDate: cataractSurgeryDate.trim(),
      remark: cataractSurgeryRemark.trim(),
    };
    if (editingCataractSurgeryId) {
      updateCataractSurgeryReport(editingCataractSurgeryId, entry);
    } else {
      addCataractSurgeryReport(entry);
    }
    resetCataractSurgeryForm();
    setEditingCataractSurgeryId(null);
    setShowCataractSurgeryForm(false);
  };

  const toggleCataractSurgeryForm = () => {
    if (showCataractSurgeryForm) {
      resetCataractSurgeryForm();
      setEditingCataractSurgeryId(null);
    }
    setShowCataractSurgeryForm((value) => !value);
  };

  const editCataractSurgeryReport = (entry: CataractSurgeryReportEntry) => {
    setEditingCataractSurgeryId(entry.id);
    setCataractSurgeryPersonName(entry.personName);
    setCataractSurgeryAge(entry.age);
    setCataractSurgeryGender(entry.gender);
    setCataractSurgeryVillageName(entry.villageName);
    setCataractSurgeryEye(entry.eye);
    setCataractSurgeryDate(entry.surgeryDate);
    setCataractSurgeryRemark(entry.remark);
    setShowCataractSurgeryForm(true);
  };

  const resetSputumForm = () => {
    setSputumPersonName('');
    setSputumAge('');
    setSputumGender('');
    setSputumVillageName('');
    setSputumCollectedDate('');
    setSputumTestDate('');
    setSputumWorkerName('');
    setSputumTestType('');
  };

  const saveSputumReport = () => {
    if (!sputumPersonName.trim() || !sputumTestType) {
      Alert.alert('माहिती अपुरी आहे', 'रुग्णाचे नाव आणि Sputum किंवा CBNAAT निवडा.');
      return;
    }
    const entry: Omit<SputumSampleReportEntry, 'id'> = {
      personName: sputumPersonName.trim(),
      age: sputumAge.trim(),
      gender: sputumGender.trim(),
      villageName: sputumVillageName.trim(),
      sampleCollectedDate: sputumCollectedDate.trim(),
      sampleTestDate: sputumTestDate.trim(),
      workerName: sputumWorkerName.trim(),
      testType: sputumTestType,
    };
    if (editingSputumId) {
      updateSputumSampleReport(editingSputumId, entry);
    } else {
      addSputumSampleReport(entry);
    }
    resetSputumForm();
    setEditingSputumId(null);
    setShowSputumForm(false);
  };

  const toggleSputumForm = () => {
    if (showSputumForm) {
      resetSputumForm();
      setEditingSputumId(null);
    }
    setShowSputumForm((value) => !value);
  };

  const editSputumReport = (entry: SputumSampleReportEntry) => {
    setEditingSputumId(entry.id);
    setSputumPersonName(entry.personName);
    setSputumAge(entry.age);
    setSputumGender(entry.gender);
    setSputumVillageName(entry.villageName);
    setSputumCollectedDate(entry.sampleCollectedDate);
    setSputumTestDate(entry.sampleTestDate);
    setSputumWorkerName(entry.workerName);
    setSputumTestType(entry.testType);
    setShowSputumForm(true);
  };

  const resetLeprosyForm = () => {
    setLeprosyPersonName('');
    setLeprosyAge('');
    setLeprosyGender('');
    setLeprosyVillageName('');
    setLeprosySpotCount('');
    setLeprosySpotLocation('');
    setLeprosySearchDate('');
  };

  const saveLeprosyReport = () => {
    if (!leprosyPersonName.trim() || !leprosySpotCount) {
      Alert.alert('माहिती अपुरी आहे', 'रुग्णाचे नाव आणि चट्ट्यांची संख्या निवडा.');
      return;
    }
    const entry: Omit<LeprosyReportEntry, 'id'> = {
      personName: leprosyPersonName.trim(),
      age: leprosyAge.trim(),
      gender: leprosyGender.trim(),
      villageName: leprosyVillageName.trim(),
      spotCount: leprosySpotCount,
      spotLocation: leprosySpotLocation.trim(),
      searchDate: leprosySearchDate.trim(),
    };
    if (editingLeprosyId) {
      updateLeprosyReport(editingLeprosyId, entry);
    } else {
      addLeprosyReport(entry);
    }
    resetLeprosyForm();
    setEditingLeprosyId(null);
    setShowLeprosyForm(false);
  };

  const toggleLeprosyForm = () => {
    if (showLeprosyForm) {
      resetLeprosyForm();
      setEditingLeprosyId(null);
    }
    setShowLeprosyForm((value) => !value);
  };

  const editLeprosyReport = (entry: LeprosyReportEntry) => {
    setEditingLeprosyId(entry.id);
    setLeprosyPersonName(entry.personName);
    setLeprosyAge(entry.age);
    setLeprosyGender(entry.gender);
    setLeprosyVillageName(entry.villageName);
    setLeprosySpotCount(entry.spotCount);
    setLeprosySpotLocation(entry.spotLocation);
    setLeprosySearchDate(entry.searchDate);
    setShowLeprosyForm(true);
  };

  const exportLeprosyPdf = async () => {
    const html = buildLeprosyReportHtml({ profile, leprosyReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'संशयीत कुष्ठरुग्ण अहवाल शेअर करा',
        logLabel: 'Leprosy',
      });
    } catch (error) {
      console.error('Leprosy PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const resetWaterTclForm = () => {
    setWaterVillageName('');
    setWaterPreviousBalance('');
    setWaterReceivedThisMonth('');
    setWaterTotalStock('');
    setWaterUsedStock('');
    setWaterClosingBalance('');
    setWaterSamplesCollected('');
    setWaterSamplesSent('');
    setWaterTclSuitable('');
    setWaterTclUnsuitable('');
    setWaterRemark('');
  };

  const saveWaterTclReport = () => {
    if (!waterVillageName.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'गावाचे नाव भरा.');
      return;
    }
    const entry: Omit<WaterTclReportEntry, 'id'> = {
      villageName: waterVillageName.trim(),
      previousBalance: waterPreviousBalance.trim(),
      receivedThisMonth: waterReceivedThisMonth.trim(),
      totalStock: waterTotalStock.trim(),
      usedStock: waterUsedStock.trim(),
      closingBalance: waterClosingBalance.trim(),
      waterSamplesCollected: waterSamplesCollected.trim(),
      waterSamplesSent: waterSamplesSent.trim(),
      tclSuitable: waterTclSuitable.trim(),
      tclUnsuitable: waterTclUnsuitable.trim(),
      remark: waterRemark.trim(),
    };
    if (editingWaterTclId) {
      updateWaterTclReport(editingWaterTclId, entry);
    } else {
      addWaterTclReport(entry);
    }
    resetWaterTclForm();
    setEditingWaterTclId(null);
    setShowWaterTclForm(false);
  };

  const toggleWaterTclForm = () => {
    if (showWaterTclForm) {
      resetWaterTclForm();
      setEditingWaterTclId(null);
    } else {
      const firstProfileVillage = profile.villages.find((village) => village.name.trim())?.name.trim() || '';
      if (firstProfileVillage) setWaterVillageName(firstProfileVillage);
    }
    setShowWaterTclForm((value) => !value);
  };

  const editWaterTclReport = (entry: WaterTclReportEntry) => {
    setEditingWaterTclId(entry.id);
    setWaterVillageName(entry.villageName);
    setWaterPreviousBalance(entry.previousBalance);
    setWaterReceivedThisMonth(entry.receivedThisMonth);
    setWaterTotalStock(entry.totalStock);
    setWaterUsedStock(entry.usedStock);
    setWaterClosingBalance(entry.closingBalance);
    setWaterSamplesCollected(entry.waterSamplesCollected);
    setWaterSamplesSent(entry.waterSamplesSent);
    setWaterTclSuitable(entry.tclSuitable);
    setWaterTclUnsuitable(entry.tclUnsuitable);
    setWaterRemark(entry.remark);
    setShowWaterTclForm(true);
  };

  const exportWaterTclPdf = async () => {
    const html = buildWaterTclReportHtml({ profile, waterTclReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'पाणी नमुने व ओ.टी. अहवाल शेअर करा',
        logLabel: 'Water and TCL',
      });
    } catch (error) {
      console.error('Water and TCL PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const resetNationalReviewForm = () => {
    setReviewVillageName('');
    setReviewPopulation('');
    setReviewTbMa('');
    setReviewTbPr('');
    setReviewLeprosyMa('');
    setReviewLeprosyPr('');
    setReviewCataractSuspectedMa('');
    setReviewCataractSuspectedPr('');
    setReviewCataractSurgeryMa('');
    setReviewCataractSurgeryPr('');
    setReviewSputumMa('');
    setReviewSputumPr('');
    setReviewWaterMa('');
    setReviewWaterPr('');
    setReviewTclMa('');
    setReviewTclPr('');
    setReviewSaltMa('');
    setReviewSaltPr('');
    setReviewOtMa('');
    setReviewOtPr('');
    setReviewRemark('');
  };

  const selectNationalReviewVillage = (villageName: string) => {
    setReviewVillageName(villageName);
    const village = profile.villages.find((item) => item.name.trim() === villageName);
    if (village) setReviewPopulation(village.population);
  };

  const saveNationalReviewReport = () => {
    if (!reviewVillageName.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'गावाचे नाव निवडा.');
      return;
    }
    const entry: Omit<NationalProgramsReviewEntry, 'id'> = {
      villageName: reviewVillageName.trim(),
      population: reviewPopulation.trim(),
      tbMa: reviewTbMa.trim(),
      tbPr: reviewTbPr.trim(),
      leprosyMa: reviewLeprosyMa.trim(),
      leprosyPr: reviewLeprosyPr.trim(),
      cataractSuspectedMa: reviewCataractSuspectedMa.trim(),
      cataractSuspectedPr: reviewCataractSuspectedPr.trim(),
      cataractSurgeryMa: reviewCataractSurgeryMa.trim(),
      cataractSurgeryPr: reviewCataractSurgeryPr.trim(),
      sputumMa: reviewSputumMa.trim(),
      sputumPr: reviewSputumPr.trim(),
      waterMa: reviewWaterMa.trim(),
      waterPr: reviewWaterPr.trim(),
      tclMa: reviewTclMa.trim(),
      tclPr: reviewTclPr.trim(),
      saltMa: reviewSaltMa.trim(),
      saltPr: reviewSaltPr.trim(),
      otMa: reviewOtMa.trim(),
      otPr: reviewOtPr.trim(),
      remark: reviewRemark.trim(),
    };
    if (editingNationalReviewId) {
      updateNationalProgramsReviewReport(editingNationalReviewId, entry);
    } else {
      addNationalProgramsReviewReport(entry);
    }
    resetNationalReviewForm();
    setEditingNationalReviewId(null);
    setShowNationalReviewForm(false);
  };

  const toggleNationalReviewForm = () => {
    if (showNationalReviewForm) {
      resetNationalReviewForm();
      setEditingNationalReviewId(null);
    } else {
      const firstProfileVillage = profile.villages.find((village) => village.name.trim())?.name.trim() || '';
      if (firstProfileVillage) selectNationalReviewVillage(firstProfileVillage);
    }
    setShowNationalReviewForm((value) => !value);
  };

  const editNationalReviewReport = (entry: NationalProgramsReviewEntry) => {
    setEditingNationalReviewId(entry.id);
    setReviewVillageName(entry.villageName);
    setReviewPopulation(entry.population);
    setReviewTbMa(entry.tbMa);
    setReviewTbPr(entry.tbPr);
    setReviewLeprosyMa(entry.leprosyMa);
    setReviewLeprosyPr(entry.leprosyPr);
    setReviewCataractSuspectedMa(entry.cataractSuspectedMa);
    setReviewCataractSuspectedPr(entry.cataractSuspectedPr);
    setReviewCataractSurgeryMa(entry.cataractSurgeryMa);
    setReviewCataractSurgeryPr(entry.cataractSurgeryPr);
    setReviewSputumMa(entry.sputumMa);
    setReviewSputumPr(entry.sputumPr);
    setReviewWaterMa(entry.waterMa);
    setReviewWaterPr(entry.waterPr);
    setReviewTclMa(entry.tclMa);
    setReviewTclPr(entry.tclPr);
    setReviewSaltMa(entry.saltMa);
    setReviewSaltPr(entry.saltPr);
    setReviewOtMa(entry.otMa);
    setReviewOtPr(entry.otPr);
    setReviewRemark(entry.remark);
    setShowNationalReviewForm(true);
  };

  const exportNationalReviewPdf = async () => {
    const html = buildNationalProgramsReviewHtml({ profile, nationalProgramsReviewReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'सहा राष्ट्रीय कार्यक्रमाचा आढावा शेअर करा',
        logLabel: 'National programs review',
      });
    } catch (error) {
      console.error('National programs review PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const resetEntomologicalForm = () => {
    setEntomologicalVillageName('');
    setEntomologicalPopulation('');
    setEntomologicalHouseholdCount('');
    setEntomologicalLarvaeInspectedHouses('');
    setEntomologicalLarvaeInfestedHouses('');
    setEntomologicalContainersInspected('');
    setEntomologicalContainersInfested('');
    setEntomologicalContainersEmptied('');
    setEntomologicalOvitrapHouses('');
    setEntomologicalHouseIndex('');
    setEntomologicalContainerIndex('');
    setEntomologicalBreteauIndex('');
  };

  const selectEntomologicalVillage = (selectedVillageName: string) => {
    setEntomologicalVillageName(selectedVillageName);
    const village = profile.villages.find((item) => item.name.trim() === selectedVillageName);
    if (village) {
      setEntomologicalPopulation(village.population);
      setEntomologicalHouseholdCount(village.householdCount);
    }
  };

  const saveEntomologicalReport = () => {
    if (!entomologicalVillageName.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'गावाचे नाव निवडा.');
      return;
    }
    const entry: Omit<EntomologicalReportEntry, 'id'> = {
      villageName: entomologicalVillageName.trim(),
      population: entomologicalPopulation.trim(),
      householdCount: entomologicalHouseholdCount.trim(),
      larvaeInspectedHouses: entomologicalLarvaeInspectedHouses.trim(),
      larvaeInfestedHouses: entomologicalLarvaeInfestedHouses.trim(),
      containersInspected: entomologicalContainersInspected.trim(),
      containersInfested: entomologicalContainersInfested.trim(),
      containersEmptied: entomologicalContainersEmptied.trim(),
      ovitrapHouses: entomologicalOvitrapHouses.trim(),
      houseIndex: entomologicalHouseIndex.trim(),
      containerIndex: entomologicalContainerIndex.trim(),
      breteauIndex: entomologicalBreteauIndex.trim(),
    };
    if (editingEntomologicalId) {
      updateEntomologicalReport(editingEntomologicalId, entry);
    } else {
      addEntomologicalReport(entry);
    }
    resetEntomologicalForm();
    setEditingEntomologicalId(null);
    setShowEntomologicalForm(false);
  };

  const toggleEntomologicalForm = () => {
    if (showEntomologicalForm) {
      resetEntomologicalForm();
      setEditingEntomologicalId(null);
    } else {
      const firstProfileVillage = profile.villages.find((village) => village.name.trim())?.name.trim() || '';
      if (firstProfileVillage) selectEntomologicalVillage(firstProfileVillage);
    }
    setShowEntomologicalForm((value) => !value);
  };

  const editEntomologicalReport = (entry: EntomologicalReportEntry) => {
    setEditingEntomologicalId(entry.id);
    setEntomologicalVillageName(entry.villageName);
    setEntomologicalPopulation(entry.population);
    setEntomologicalHouseholdCount(entry.householdCount);
    setEntomologicalLarvaeInspectedHouses(entry.larvaeInspectedHouses);
    setEntomologicalLarvaeInfestedHouses(entry.larvaeInfestedHouses);
    setEntomologicalContainersInspected(entry.containersInspected);
    setEntomologicalContainersInfested(entry.containersInfested);
    setEntomologicalContainersEmptied(entry.containersEmptied);
    setEntomologicalOvitrapHouses(entry.ovitrapHouses);
    setEntomologicalHouseIndex(entry.houseIndex);
    setEntomologicalContainerIndex(entry.containerIndex);
    setEntomologicalBreteauIndex(entry.breteauIndex);
    setShowEntomologicalForm(true);
  };

  const exportEntomologicalPdf = async () => {
    const html = buildEntomologicalReportHtml({ profile, entomologicalReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'किटकशास्त्रीय अहवाल शेअर करा',
        logLabel: 'Entomological',
      });
    } catch (error) {
      console.error('Entomological report PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const exportEntomologicalSectionPdf = async () => {
    const html = buildEntomologicalSectionHtml({ profile, entomologicalReports, bloodSlideReports, guppyFishReleasePlacesReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'किटकशास्त्रीय अहवाल एकत्रित PDF शेअर करा',
        logLabel: 'Entomological section',
      });
    } catch (error) {
      console.error('Entomological section PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const exportCombinedReportsPdf = async () => {
    const html = buildCombinedReportsHtml({
      profile,
      monthLabel,
      deathReports,
      cataractReports,
      cataractSurgeryReports,
      sputumSampleReports,
      leprosyReports,
      waterTclReports,
      nationalProgramsReviewReports,
    });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'सहा राष्ट्रीय कार्यक्रमाचा आढावा PDF शेअर करा',
        logLabel: 'Combined reports',
      });
    } catch (error) {
      console.error('Combined reports PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const exportPdf = async (action: 'share' | 'save') => {
    const html = buildDeathReportHtml({ profile, deathReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: action === 'share' ? 'मृत्यू अहवाल शेअर करा' : 'मृत्यू अहवाल सेव्ह करा',
        logLabel: 'Death',
      });
    } catch (error) {
      console.error('PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const exportCataractPdf = async () => {
    const html = buildCataractReportHtml({ profile, cataractReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'संशयीत मोतीबिंदू अहवाल शेअर करा',
        logLabel: 'Cataract',
      });
    } catch (error) {
      console.error('Cataract PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const exportCataractSurgeryPdf = async () => {
    const html = buildCataractSurgeryReportHtml({ profile, cataractSurgeryReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'मोतीबिंदू शस्त्रक्रिया अहवाल शेअर करा',
        logLabel: 'Cataract surgery',
      });
    } catch (error) {
      console.error('Cataract surgery PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const exportSputumPdf = async () => {
    const html = buildSputumReportHtml({ profile, sputumSampleReports, monthLabel });
    try {
      if (Platform.OS === 'web') {
        if (!printHtmlDocument(html)) Alert.alert('PDF तयार करता आला नाही', 'कृपया browser मध्ये print परवानगी द्या.');
        return;
      }
      await shareOrPrintPdfOnNative({
        html,
        dialogTitle: 'थुकी नमुने अहवाल शेअर करा',
        logLabel: 'Sputum',
      });
    } catch (error) {
      console.error('Sputum PDF export failed', error);
      Alert.alert('PDF तयार करता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat bottomOffset={20} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }}>
        <ScreenHeader eyebrow={activeReport ? (activeReport === 'bloodSampleMonthly' || activeReport === 'bloodSlide' || activeReport === 'entomological' ? 'किटकशास्त्रीय अहवाल' : 'सहा राष्ट्रीय कार्यक्रमाचा आढावा') : 'विशेष सेक्शन'} title={activeReport ? reportTitles[activeReport] : 'रिपोर्ट'} subtitle={activeReport ? 'माहिती भरा, जतन करा आणि PDF शेअर करा.' : 'तुमच्या आरोग्य केंद्राचा मासिक अहवाल तयार करा.'} actionIcon={activeReport ? 'arrow-left' : undefined} onAction={activeReport ? () => setActiveReport(null) : undefined} />
        <View style={styles.body}>
          {activeReport === null ? <>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="folder" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>SPECIAL SECTION</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>सहा राष्ट्रीय कार्यक्रमाचा आढावा</Text></View>
              <Pressable testID="share-combined-reports-pdf" accessibilityRole="button" accessibilityLabel="सहा राष्ट्रीय कार्यक्रमाचा आढावा PDF शेअर करा" onPress={() => void exportCombinedReportsPdf()} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name="file-text" size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>सहा राष्ट्रीय कार्यक्रमाचा आढावा</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>रिपोर्ट निवडण्यासाठी खालील नावावर touch करा</Text>
              <Pressable testID="toggle-report-period-editor" accessibilityRole="button" accessibilityLabel="अहवालाचा महिना आणि वर्ष बदला" onPress={() => setShowPeriodEditor((value) => !value)} style={({ pressed }) => [styles.periodButton, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <Feather name="calendar" size={14} color={colors.primary} />
                <Text style={[styles.periodButtonText, { color: colors.primary }]}>महिना / वर्ष बदला</Text>
              </Pressable>
               {showPeriodEditor ? <View style={[styles.periodEditor, { backgroundColor: colors.card, borderColor: colors.border }]}>
                 <View style={styles.twoColumns}>
                   <View style={styles.column}><FormField label="महिना (1-12)" value={periodMonth} onChangeText={(value) => setPeriodMonth(value.replace(/[^0-9]/g, ''))} placeholder="उदा. 8" keyboardType="number-pad" colors={colors} /></View>
                   <View style={styles.column}><FormField label="वर्ष" value={periodYear} onChangeText={(value) => setPeriodYear(value.replace(/[^0-9]/g, ''))} placeholder="उदा. 2026" keyboardType="number-pad" colors={colors} /></View>
                 </View>
                 <Pressable testID="save-report-period" accessibilityRole="button" onPress={saveReportPeriod} style={({ pressed }) => [styles.periodSaveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Text style={styles.saveText}>महिना / वर्ष जतन करा</Text></Pressable>
               </View> : null}
            </View>
            <View style={[styles.reportMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ReportMenuItem number="१" icon="file-text" title="मृत्यू अहवाल" count={deathReports.length} onPress={() => setActiveReport('death')} colors={colors} />
              <ReportMenuItem number="२" icon="eye" title="संशयीत मोतीबिंदू अहवाल" count={cataractReports.length} onPress={() => setActiveReport('cataract')} colors={colors} />
              <ReportMenuItem number="३" icon="check-circle" title="मोतीबिंदू शस्त्रक्रिया अहवाल" count={cataractSurgeryReports.length} onPress={() => setActiveReport('cataractSurgery')} colors={colors} />
              <ReportMenuItem number="४" icon="activity" title="थुकी नमुने अहवाल" count={sputumSampleReports.length} onPress={() => setActiveReport('sputum')} colors={colors} />
              <ReportMenuItem number="५" icon="heart" title="संशयीत कुष्ठरुग्ण अहवाल" count={leprosyReports.length} onPress={() => setActiveReport('leprosy')} colors={colors} />
               <ReportMenuItem number="६" icon="droplet" title="पाणी नमुने व ओ.टी. अहवाल" count={waterTclReports.length} onPress={() => setActiveReport('waterTcl')} colors={colors} />
               <ReportMenuItem number="७" icon="grid" title="सहा राष्ट्रीय कार्यक्रमाचा आढावा" count={nationalProgramsReviewReports.length} onPress={() => setActiveReport('nationalReview')} colors={colors} />
               <View style={[styles.specialSection, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                 <View style={[styles.specialSectionIcon, { backgroundColor: colors.card }]}>
                   <Feather name="sunrise" size={16} color={colors.primary} />
                 </View>
                 <View style={styles.specialSectionCopy}>
                   <Text style={[styles.specialSectionEyebrow, { color: colors.primary }]}>SPECIAL SECTION</Text>
                   <Text style={[styles.specialSectionTitle, { color: colors.foreground }]}>किटकशास्त्रीय अहवाल</Text>
                     <Text style={[styles.specialSectionText, { color: colors.mutedForeground }]}>या विभागात ३ गावनिहाय reports आहेत</Text>
                 </View>
                 <Pressable testID="share-entomological-section-pdf" accessibilityRole="button" accessibilityLabel="किटकशास्त्रीय अहवालांची एकत्रित PDF शेअर करा" onPress={() => void exportEntomologicalSectionPdf()} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}>
                   <Feather name="file-text" size={16} color={colors.primary} />
                 </Pressable>
               </View>
               <View style={[styles.specialReportMenu, { borderColor: colors.border }]}>
                   <ReportMenuItem number="८" icon="file-text" title="Blood Slides Report" count={bloodSlideReports.length} onPress={() => setActiveReport('bloodSlide')} colors={colors} />
                  <ReportMenuItem number="९" icon="sunrise" title="किटकशास्त्रीय अहवाल" count={entomologicalReports.length} onPress={() => setActiveReport('entomological')} colors={colors} />
                  <ReportMenuItem number="१०" icon="map-pin" title="गप्पी मासे सोडलेली ठिकाणे" count={guppyFishReleasePlacesReports.length} onPress={() => setActiveReport('guppyFishReleasePlaces')} colors={colors} last />
               </View>
            </View>
          </> : null}
          {activeReport === 'death' ? <>
          <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="file-text" size={18} color={colors.primary} /></View>
            <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT 1 OF 6</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>मृत्यू अहवाल</Text></View>
            <Pressable testID="add-death-report" accessibilityRole="button" accessibilityLabel="नवीन मृत्यू नोंद जोडा" onPress={toggleForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
          </View>
          <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.paperTop}>
              <View style={styles.paperHeading}>
                <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
              </View>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
            </View>
            <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
            <Text style={[styles.reportTitle, { color: colors.foreground }]}>मृत्यू अहवाल</Text>
            <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{deathReports.length} नोंदी या महिन्यात</Text>
          </View>
          {showForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingId ? 'मृत्यू नोंद बदला' : 'नवीन मृत्यू नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>{editingId ? 'बदल करून नोंद पुन्हा जतन करा.' : 'अहवालातील पुढील क्रमांकासाठी माहिती भरा.'}</Text></View><Feather name="edit-3" size={18} color={colors.primary} /></View>
            <FormField label="मृत व्यक्तीचे नाव *" value={personName} onChangeText={setPersonName} placeholder="पूर्ण नाव" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="वय" value={age} onChangeText={setAge} placeholder="वय" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><GenderField value={gender} onChange={setGender} colors={colors} /></View>
              </View>
            <View style={styles.twoColumns}>
              <View style={styles.column}><FormField label="गावाचे नाव" value={villageName} onChangeText={setVillageName} placeholder="गाव" colors={colors} /></View>
              <View style={styles.column}><FormField label="मृत्यूचे ठिकाण" value={deathPlace} onChangeText={setDeathPlace} placeholder="ठिकाण" colors={colors} /></View>
            </View>
            <FormField label="मृत्यूची तारीख *" value={deathDate} onChangeText={setDeathDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} />
            <FormField label="मृत्यूचे कारण" value={cause} onChangeText={setCause} placeholder="मृत्यूचे कारण" colors={colors} />
            <FormField label="शेरा" value={remark} onChangeText={setRemark} placeholder="अतिरिक्त माहिती" colors={colors} />
            <Pressable testID="save-death-report" onPress={saveDeathReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingId ? 'बदल जतन करा' : 'मृत्यू नोंद जतन करा'}</Text></Pressable>
          </View> : null}
           <View style={styles.entriesHeader}>
             <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>मृत्यू अहवाल नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>फोटोतील नमुन्याप्रमाणे प्रत्येक नोंद येथे दिसेल.</Text></View>
             <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{deathReports.length}</Text></View>
           </View>
           {deathReports.length ? deathReports.map((entry, index) => (
            <DeathEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editDeathReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.personName} यांची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeDeathReport(entry.id) }])} />
           )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="file-text" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून मृत्यू नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>वरचे + बटन दाबून पहिली नोंद जोडा.</Text></View>}
          {deathReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>पूर्ण रिपोर्ट तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>तपासल्यानंतर PDF सेव्ह किंवा शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
            <View style={styles.exportButtons}>
              <Pressable testID="share-death-report-pdf" onPress={() => void exportPdf('share')} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
              <Pressable testID="save-death-report-pdf" onPress={() => void exportPdf('save')} style={({ pressed }) => [styles.exportButton, styles.exportButtonSecondary, { borderColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="download" size={15} color={colors.primary} /><Text style={[styles.exportButtonSecondaryText, { color: colors.primary }]}>PDF सेव्ह करा</Text></Pressable>
            </View>
          </View> : null}
          <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
            <View style={styles.signatureColumn}>
              <Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text>
              <Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text>
              <Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text>
            </View>
            <View style={[styles.signatureColumn, styles.signatureRight]}>
              <Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text>
              <Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text>
              <Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
            </View>
          </View>
          </> : null}
          {activeReport === 'cataract' ? <View style={styles.secondReportSection}>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="eye" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 2</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>संशयीत मोतीबिंदू अहवाल</Text></View>
              <Pressable testID="add-cataract-report" accessibilityRole="button" accessibilityLabel="नवीन मोतीबिंदू नोंद जोडा" onPress={toggleCataractForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showCataractForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>संशयीत मोतीबिंदू अहवाल</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{cataractReports.length} रुग्णांच्या नोंदी</Text>
            </View>
            {showCataractForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingCataractId ? 'मोतीबिंदू नोंद बदला' : 'नवीन मोतीबिंदू नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>चित्रातील नमुन्याप्रमाणे संशयीत रुग्णाची माहिती भरा.</Text></View><Feather name="eye" size={18} color={colors.primary} /></View>
              <FormField label="रुग्णाचे नाव *" value={cataractPersonName} onChangeText={setCataractPersonName} placeholder="पूर्ण नाव" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="वय" value={cataractAge} onChangeText={setCataractAge} placeholder="वय" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><GenderField value={cataractGender} onChange={setCataractGender} colors={colors} /></View>
              </View>
              <FormField label="गावाचे नाव" value={cataractVillageName} onChangeText={setCataractVillageName} placeholder="गाव" colors={colors} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>डोळा *</Text>
              <View style={styles.eyeChoices}>
                <EyeChoice label="उजवा" value="right" selected={cataractEye === 'right'} onPress={() => setCataractEye('right')} colors={colors} />
                <EyeChoice label="डावा" value="left" selected={cataractEye === 'left'} onPress={() => setCataractEye('left')} colors={colors} />
              </View>
              <FormField label="शोधल्याचा दिनांक" value={cataractSearchDate} onChangeText={setCataractSearchDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} />
              <FormField label="शेरा" value={cataractRemark} onChangeText={setCataractRemark} placeholder="अतिरिक्त माहिती" colors={colors} />
              <Pressable testID="save-cataract-report" onPress={saveCataractReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingCataractId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
            </View> : null}
            <View style={styles.entriesHeader}>
              <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>रुग्णांच्या नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>उजवा / डावा डोळा आणि शोधल्याचा दिनांक.</Text></View>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{cataractReports.length}</Text></View>
            </View>
            {cataractReports.length ? cataractReports.map((entry, index) => (
              <CataractEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editCataractReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.personName} यांची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeCataractReport(entry.id) }])} />
            )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="eye" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून मोतीबिंदू नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून नोंद जोडा.</Text></View>}
            {cataractReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>मोतीबिंदू रिपोर्ट तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
              <Pressable testID="share-cataract-report-pdf" onPress={() => void exportCataractPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
            </View> : null}
            <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
              <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
              <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
            </View>
           </View> : null}
          {activeReport === 'cataractSurgery' ? <View style={styles.secondReportSection}>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="check-circle" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 3</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>मोतीबिंदू शस्त्रक्रिया अहवाल</Text></View>
              <Pressable testID="add-cataract-surgery-report" accessibilityRole="button" accessibilityLabel="नवीन मोतीबिंदू शस्त्रक्रिया नोंद जोडा" onPress={toggleCataractSurgeryForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showCataractSurgeryForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>मोतीबिंदू शस्त्रक्रिया अहवाल</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{cataractSurgeryReports.length} रुग्णांच्या नोंदी</Text>
            </View>
            {showCataractSurgeryForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingCataractSurgeryId ? 'शस्त्रक्रिया नोंद बदला' : 'नवीन शस्त्रक्रिया नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>शस्त्रक्रिया झालेल्या रुग्णाची माहिती भरा.</Text></View><Feather name="check-circle" size={18} color={colors.primary} /></View>
              <FormField label="रुग्णाचे नाव *" value={cataractSurgeryPersonName} onChangeText={setCataractSurgeryPersonName} placeholder="पूर्ण नाव" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="वय" value={cataractSurgeryAge} onChangeText={setCataractSurgeryAge} placeholder="वय" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><GenderField value={cataractSurgeryGender} onChange={setCataractSurgeryGender} colors={colors} /></View>
              </View>
              <FormField label="गावाचे नाव" value={cataractSurgeryVillageName} onChangeText={setCataractSurgeryVillageName} placeholder="गाव" colors={colors} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>डोळा *</Text>
              <View style={styles.eyeChoices}>
                <EyeChoice label="उजवा" value="right" selected={cataractSurgeryEye === 'right'} onPress={() => setCataractSurgeryEye('right')} colors={colors} />
                <EyeChoice label="डावा" value="left" selected={cataractSurgeryEye === 'left'} onPress={() => setCataractSurgeryEye('left')} colors={colors} />
              </View>
              <FormField label="शस्त्रक्रिया दिनांक" value={cataractSurgeryDate} onChangeText={setCataractSurgeryDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} />
              <FormField label="शेरा" value={cataractSurgeryRemark} onChangeText={setCataractSurgeryRemark} placeholder="अतिरिक्त माहिती" colors={colors} />
              <Pressable testID="save-cataract-surgery-report" onPress={saveCataractSurgeryReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingCataractSurgeryId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
            </View> : null}
            <View style={styles.entriesHeader}>
              <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>शस्त्रक्रिया झालेल्या रुग्णांच्या नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>उजवा / डावा डोळा आणि शस्त्रक्रिया दिनांक.</Text></View>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{cataractSurgeryReports.length}</Text></View>
            </View>
            {cataractSurgeryReports.length ? cataractSurgeryReports.map((entry, index) => (
              <CataractSurgeryEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editCataractSurgeryReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.personName} यांची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeCataractSurgeryReport(entry.id) }])} />
            )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="check-circle" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून शस्त्रक्रिया नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून नोंद जोडा.</Text></View>}
            {cataractSurgeryReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>शस्त्रक्रिया रिपोर्ट तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
              <Pressable testID="share-cataract-surgery-report-pdf" onPress={() => void exportCataractSurgeryPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
            </View> : null}
            <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
              <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
              <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
            </View>
           </View> : null}
          {activeReport === 'sputum' ? <View style={styles.secondReportSection}>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="activity" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 4</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>थुकी नमुने अहवाल</Text></View>
              <Pressable testID="add-sputum-report" accessibilityRole="button" accessibilityLabel="नवीन थुकी नमुना नोंद जोडा" onPress={toggleSputumForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showSputumForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>थुकी नमुने अहवाल</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{sputumSampleReports.length} नमुन्यांच्या नोंदी</Text>
            </View>
            {showSputumForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingSputumId ? 'थुकी नमुना नोंद बदला' : 'नवीन थुकी नमुना नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>चित्रातील नमुन्याप्रमाणे रुग्ण आणि तपासणीची माहिती भरा.</Text></View><Feather name="activity" size={18} color={colors.primary} /></View>
              <FormField label="रुग्णाचे नाव *" value={sputumPersonName} onChangeText={setSputumPersonName} placeholder="पूर्ण नाव" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="वय" value={sputumAge} onChangeText={setSputumAge} placeholder="वय" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><GenderField value={sputumGender} onChange={setSputumGender} colors={colors} /></View>
              </View>
              <FormField label="गावाचे नाव" value={sputumVillageName} onChangeText={setSputumVillageName} placeholder="गाव" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="थुकी नमुना घेतल्याचा दिनांक" value={sputumCollectedDate} onChangeText={setSputumCollectedDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><FormField label="थुंकी नमुना तपासणीसाठी पाठवलेला दिनांक" value={sputumTestDate} onChangeText={setSputumTestDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} /></View>
              </View>
              <FormField label="शोधणाऱ्या कर्मचाऱ्याचे नाव" value={sputumWorkerName} onChangeText={setSputumWorkerName} placeholder="कर्मचाऱ्याचे नाव" colors={colors} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>तपासणीचा प्रकार *</Text>
              <View style={styles.testTypeChoices}>
                <TestTypeChoice label="Sputum" selected={sputumTestType === 'sputum'} onPress={() => setSputumTestType('sputum')} colors={colors} />
                <TestTypeChoice label="CBNAAT" selected={sputumTestType === 'cbnaat'} onPress={() => setSputumTestType('cbnaat')} colors={colors} />
              </View>
              <Pressable testID="save-sputum-report" onPress={saveSputumReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingSputumId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
            </View> : null}
            <View style={styles.entriesHeader}>
              <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>थुकी नमुना नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>Sputum / CBNAAT तपासणी प्रकारासह.</Text></View>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{sputumSampleReports.length}</Text></View>
            </View>
            {sputumSampleReports.length ? sputumSampleReports.map((entry, index) => (
              <SputumEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editSputumReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.personName} यांची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeSputumSampleReport(entry.id) }])} />
            )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="activity" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून थुकी नमुना नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून नोंद जोडा.</Text></View>}
            {sputumSampleReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>थुकी नमुने report तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
              <Pressable testID="share-sputum-report-pdf" onPress={() => void exportSputumPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
            </View> : null}
            <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
              <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
              <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
            </View>
           </View> : null}
          {activeReport === 'leprosy' ? <View style={styles.secondReportSection}>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="heart" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 5</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>संशयीत कुष्ठरुग्ण अहवाल</Text></View>
              <Pressable testID="add-leprosy-report" accessibilityRole="button" accessibilityLabel="नवीन कुष्ठरुग्ण नोंद जोडा" onPress={toggleLeprosyForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showLeprosyForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>संशयीत कुष्ठरुग्ण अहवाल</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{leprosyReports.length} रुग्णांच्या नोंदी</Text>
            </View>
            {showLeprosyForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingLeprosyId ? 'कुष्ठरुग्ण नोंद बदला' : 'नवीन कुष्ठरुग्ण नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>चित्रातील नमुन्याप्रमाणे संशयीत रुग्णाची माहिती भरा.</Text></View><Feather name="heart" size={18} color={colors.primary} /></View>
              <FormField label="रुग्णाचे नाव *" value={leprosyPersonName} onChangeText={setLeprosyPersonName} placeholder="पूर्ण नाव" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="वय" value={leprosyAge} onChangeText={setLeprosyAge} placeholder="वय" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><GenderField value={leprosyGender} onChange={setLeprosyGender} colors={colors} /></View>
              </View>
              <FormField label="गावाचे नाव" value={leprosyVillageName} onChangeText={setLeprosyVillageName} placeholder="गाव" colors={colors} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>चट्टे *</Text>
              <View style={styles.testTypeChoices}>
                <SpotCountChoice label="१ ते ५" selected={leprosySpotCount === '1-5'} onPress={() => setLeprosySpotCount('1-5')} colors={colors} />
                <SpotCountChoice label="५ पेक्षा जास्त" selected={leprosySpotCount === 'more-than-5'} onPress={() => setLeprosySpotCount('more-than-5')} colors={colors} />
              </View>
              <FormField label="चट्ट्याचे ठिकाण" value={leprosySpotLocation} onChangeText={setLeprosySpotLocation} placeholder="उदा. हात / पाय / पाठ" colors={colors} />
              <FormField label="शोधल्याचा दिनांक" value={leprosySearchDate} onChangeText={setLeprosySearchDate} placeholder="DD/MM/YYYY" keyboardType="number-pad" colors={colors} />
              <Pressable testID="save-leprosy-report" onPress={saveLeprosyReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingLeprosyId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
            </View> : null}
            <View style={styles.entriesHeader}>
              <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>कुष्ठरुग्णांच्या नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>चट्ट्यांची संख्या, ठिकाण आणि शोधल्याचा दिनांक.</Text></View>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{leprosyReports.length}</Text></View>
            </View>
            {leprosyReports.length ? leprosyReports.map((entry, index) => (
              <LeprosyEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editLeprosyReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.personName} यांची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeLeprosyReport(entry.id) }])} />
            )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="heart" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून कुष्ठरुग्ण नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून नोंद जोडा.</Text></View>}
            {leprosyReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>कुष्ठरुग्ण रिपोर्ट तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
              <Pressable testID="share-leprosy-report-pdf" onPress={() => void exportLeprosyPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
            </View> : null}
            <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
              <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
              <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
            </View>
           </View> : null}
          {activeReport === 'waterTcl' ? <View style={styles.secondReportSection}>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="droplet" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 6</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>पाणी नमुने व ओ.टी. अहवाल</Text></View>
              <Pressable testID="add-water-tcl-report" accessibilityRole="button" accessibilityLabel="नवीन पाणी नमुने व ओ.टी. नोंद जोडा" onPress={toggleWaterTclForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showWaterTclForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>पाणी नमुने व ओ.टी. अहवाल</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{waterTclReports.length} गावांच्या नोंदी</Text>
            </View>
            {showWaterTclForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingWaterTclId ? 'पाणी नमुने व ओ.टी. नोंद बदला' : 'नवीन पाणी नमुने व ओ.टी. नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>चित्रातील नमुन्याप्रमाणे गावनिहाय साठा आणि नमुना माहिती भरा.</Text></View><Feather name="droplet" size={18} color={colors.primary} /></View>
              <VillageChoiceField value={waterVillageName} villages={profile.villages} onChange={setWaterVillageName} colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="मागील शिल्लक" value={waterPreviousBalance} onChangeText={setWaterPreviousBalance} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><FormField label="चालू महिन्यात मिळालेला साठा" value={waterReceivedThisMonth} onChangeText={setWaterReceivedThisMonth} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
              </View>
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="एकूण साठा" value={waterTotalStock} onChangeText={setWaterTotalStock} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><FormField label="खर्च साठा" value={waterUsedStock} onChangeText={setWaterUsedStock} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
              </View>
              <FormField label="महिन्याखेर शिल्लक साठा" value={waterClosingBalance} onChangeText={setWaterClosingBalance} placeholder="संख्या" keyboardType="number-pad" colors={colors} />
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="पाणी नमुने - मा." value={waterSamplesCollected} onChangeText={setWaterSamplesCollected} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><FormField label="पाणी नमुने - प्र." value={waterSamplesSent} onChangeText={setWaterSamplesSent} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
              </View>
              <View style={styles.twoColumns}>
                <View style={styles.column}><FormField label="ओ.टी. - योग्य" value={waterTclSuitable} onChangeText={setWaterTclSuitable} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                <View style={styles.column}><FormField label="ओ.टी. - अयोग्य" value={waterTclUnsuitable} onChangeText={setWaterTclUnsuitable} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
              </View>
              <FormField label="शेरा" value={waterRemark} onChangeText={setWaterRemark} placeholder="अतिरिक्त माहिती" colors={colors} />
              <Pressable testID="save-water-tcl-report" onPress={saveWaterTclReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingWaterTclId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
            </View> : null}
            <View style={styles.entriesHeader}>
              <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>गावनिहाय नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>साठा, पाणी नमुने आणि ओ.टी. तपशील.</Text></View>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{waterTclReports.length}</Text></View>
            </View>
            {waterTclReports.length ? waterTclReports.map((entry, index) => (
              <WaterTclEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editWaterTclReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.villageName} गावाची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeWaterTclReport(entry.id) }])} />
            )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="droplet" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून पाणी नमुना नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून गावाची नोंद जोडा.</Text></View>}
            {waterTclReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>पाणी नमुने व ओ.टी. रिपोर्ट तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
              <Pressable testID="share-water-tcl-report-pdf" onPress={() => void exportWaterTclPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
            </View> : null}
            <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
              <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
              <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
            </View>
           </View> : null}
          {activeReport === 'nationalReview' ? <View style={styles.secondReportSection}>
            <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="grid" size={18} color={colors.primary} /></View>
              <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 7</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>सहा राष्ट्रीय कार्यक्रमाचा आढावा</Text></View>
              <Pressable testID="add-national-review-report" accessibilityRole="button" accessibilityLabel="नवीन सहा राष्ट्रीय कार्यक्रमाचा आढावा नोंद जोडा" onPress={toggleNationalReviewForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showNationalReviewForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
            </View>
            <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.paperTop}>
                <View style={styles.paperHeading}>
                  <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                  <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                </View>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
              </View>
              <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
              <Text style={[styles.reportTitle, { color: colors.foreground }]}>सहा राष्ट्रीय कार्यक्रमाचा आढावा</Text>
              <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{nationalProgramsReviewReports.length} गावांच्या नोंदी · प्रत्येक बाबीसाठी मा. / प्र.</Text>
            </View>
            {showNationalReviewForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingNationalReviewId ? 'राष्ट्रीय कार्यक्रमांचा आढावा बदला' : 'नवीन राष्ट्रीय कार्यक्रमांचा आढावा'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>नमुना पत्रिकेप्रमाणे गावनिहाय मा. / प्र. संख्या भरा.</Text></View><Feather name="grid" size={18} color={colors.primary} /></View>
              <VillageChoiceField value={reviewVillageName} villages={profile.villages} onChange={selectNationalReviewVillage} colors={colors} />
              <FormField label="लोकसंख्या" value={reviewPopulation} onChangeText={setReviewPopulation} placeholder="लोकसंख्या" keyboardType="number-pad" colors={colors} />
              <ReviewMetricPair label="क्षयरोग" firstValue={reviewTbMa} onFirstChange={setReviewTbMa} secondValue={reviewTbPr} onSecondChange={setReviewTbPr} colors={colors} />
              <ReviewMetricPair label="कुष्ठरोग" firstValue={reviewLeprosyMa} onFirstChange={setReviewLeprosyMa} secondValue={reviewLeprosyPr} onSecondChange={setReviewLeprosyPr} colors={colors} />
              <ReviewMetricPair label="मोतीबिंदू संशयित" firstValue={reviewCataractSuspectedMa} onFirstChange={setReviewCataractSuspectedMa} secondValue={reviewCataractSuspectedPr} onSecondChange={setReviewCataractSuspectedPr} colors={colors} />
              <ReviewMetricPair label="मोतीबिंदू शस्त्रक्रिया" firstValue={reviewCataractSurgeryMa} onFirstChange={setReviewCataractSurgeryMa} secondValue={reviewCataractSurgeryPr} onSecondChange={setReviewCataractSurgeryPr} colors={colors} />
              <ReviewMetricPair label="थुंकी नमुने" firstValue={reviewSputumMa} onFirstChange={setReviewSputumMa} secondValue={reviewSputumPr} onSecondChange={setReviewSputumPr} colors={colors} />
              <ReviewMetricPair label="पाणी नमुने" firstValue={reviewWaterMa} onFirstChange={setReviewWaterMa} secondValue={reviewWaterPr} onSecondChange={setReviewWaterPr} colors={colors} />
              <ReviewMetricPair label="टी. सी. एल. नमुने" firstValue={reviewTclMa} onFirstChange={setReviewTclMa} secondValue={reviewTclPr} onSecondChange={setReviewTclPr} colors={colors} />
              <ReviewMetricPair label="मीठ नमुने" firstValue={reviewSaltMa} onFirstChange={setReviewSaltMa} secondValue={reviewSaltPr} onSecondChange={setReviewSaltPr} colors={colors} />
              <ReviewMetricPair label="ओ. टी. टेस्ट" firstValue={reviewOtMa} onFirstChange={setReviewOtMa} secondValue={reviewOtPr} onSecondChange={setReviewOtPr} colors={colors} />
              <FormField label="शेरा" value={reviewRemark} onChangeText={setReviewRemark} placeholder="अतिरिक्त माहिती" colors={colors} />
              <Pressable testID="save-national-review-report" onPress={saveNationalReviewReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingNationalReviewId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
            </View> : null}
            <View style={styles.entriesHeader}>
              <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>गावनिहाय आढावा नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>क्षयरोग ते ओ.टी. टेस्टपर्यंत सर्व मा. / प्र. तपशील.</Text></View>
              <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{nationalProgramsReviewReports.length}</Text></View>
            </View>
            {nationalProgramsReviewReports.length ? nationalProgramsReviewReports.map((entry, index) => (
              <NationalProgramsReviewEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editNationalReviewReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.villageName} गावाची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeNationalProgramsReviewReport(entry.id) }])} />
            )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="grid" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून आढावा नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून गावाची नोंद जोडा.</Text></View>}
            {nationalProgramsReviewReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>सहा राष्ट्रीय कार्यक्रमाचा आढावा तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नमुना पत्रिकेसारखा landscape PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
              <Pressable testID="share-national-review-report-pdf" onPress={() => void exportNationalReviewPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
            </View> : null}
            <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
              <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
              <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
            </View>
          </View> : null}
           {activeReport === 'entomological' ? <View style={styles.secondReportSection}>
             <View style={[styles.sectionBanner, { backgroundColor: colors.secondary }]}>
               <View style={[styles.sectionIcon, { backgroundColor: colors.card }]}><Feather name="sunrise" size={18} color={colors.primary} /></View>
               <View style={styles.sectionCopy}><Text style={[styles.sectionEyebrow, { color: colors.primary }]}>REPORT SECTION 8</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>किटकशास्त्रीय अहवाल</Text></View>
               <Pressable testID="add-entomological-report" accessibilityRole="button" accessibilityLabel="नवीन किटकशास्त्रीय अहवाल नोंद जोडा" onPress={toggleEntomologicalForm} style={({ pressed }) => [styles.sectionAddButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}><Feather name={showEntomologicalForm ? 'x' : 'plus'} size={17} color={colors.primary} /></Pressable>
             </View>
             <View style={[styles.reportPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <View style={styles.paperTop}>
                 <View style={styles.paperHeading}>
                   <Text style={[styles.facilityName, { color: colors.foreground }]}>प्राथमिक आरोग्य केंद्र {profile.primaryHealthCenter || '—'}</Text>
                   <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>तालुका: {profile.taluka || '—'}  जिल्हा: {profile.district || '—'}</Text>
                   <Text style={[styles.facilityMeta, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text>
                 </View>
                 <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
               </View>
               <View style={[styles.reportTitleRule, { borderTopColor: colors.border }]} />
               <Text style={[styles.reportTitle, { color: colors.foreground }]}>किटकशास्त्रीय अहवाल</Text>
               <Text style={[styles.reportSubtitle, { color: colors.mutedForeground }]}>{entomologicalReports.length} गावांच्या नोंदी · गाव, लोकसंख्या आणि घरे प्रोफाइलमधून</Text>
             </View>
             {showEntomologicalForm ? <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <View style={styles.formHeading}><View><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingEntomologicalId ? 'किटकशास्त्रीय नोंद बदला' : 'नवीन किटकशास्त्रीय नोंद'}</Text><Text style={[styles.formHint, { color: colors.mutedForeground }]}>गाव निवडा; लोकसंख्या आणि एकूण घरांची संख्या प्रोफाइलमधून आपोआप येईल.</Text></View><Feather name="sunrise" size={18} color={colors.primary} /></View>
               <VillageChoiceField value={entomologicalVillageName} villages={profile.villages} onChange={selectEntomologicalVillage} colors={colors} />
               <View style={styles.twoColumns}>
                 <View style={styles.column}><ProfileValueField label="लोकसंख्या (प्रोफाइलमधून)" value={entomologicalPopulation} colors={colors} /></View>
                 <View style={styles.column}><ProfileValueField label="एकूण घरांची संख्या (प्रोफाइलमधून)" value={entomologicalHouseholdCount} colors={colors} /></View>
               </View>
               <View style={styles.twoColumns}>
                 <View style={styles.column}><FormField label="डास अळी करिता तपासलेली घरे" value={entomologicalLarvaeInspectedHouses} onChangeText={setEntomologicalLarvaeInspectedHouses} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                 <View style={styles.column}><FormField label="डास अळी असलेली घरे" value={entomologicalLarvaeInfestedHouses} onChangeText={setEntomologicalLarvaeInfestedHouses} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
               </View>
               <View style={styles.twoColumns}>
                 <View style={styles.column}><FormField label="तपासलेली कंटेनर" value={entomologicalContainersInspected} onChangeText={setEntomologicalContainersInspected} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                 <View style={styles.column}><FormField label="दूषित असलेली कंटेनर" value={entomologicalContainersInfested} onChangeText={setEntomologicalContainersInfested} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
               </View>
               <View style={styles.twoColumns}>
                 <View style={styles.column}><FormField label="रिकामी केलेली कंटेनर" value={entomologicalContainersEmptied} onChangeText={setEntomologicalContainersEmptied} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
                 <View style={styles.column}><FormField label="ऑव्हिट टाकलेली घरे" value={entomologicalOvitrapHouses} onChangeText={setEntomologicalOvitrapHouses} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
               </View>
               <View style={styles.twoColumns}>
                 <View style={styles.column}><FormField label="हाऊस इंडेक्स" value={entomologicalHouseIndex} onChangeText={setEntomologicalHouseIndex} placeholder="इंडेक्स" colors={colors} /></View>
                 <View style={styles.column}><FormField label="कंटेनर इंडेक्स" value={entomologicalContainerIndex} onChangeText={setEntomologicalContainerIndex} placeholder="इंडेक्स" colors={colors} /></View>
               </View>
               <FormField label="ब्रेटो इंडेक्स" value={entomologicalBreteauIndex} onChangeText={setEntomologicalBreteauIndex} placeholder="इंडेक्स" colors={colors} />
               <Pressable testID="save-entomological-report" onPress={saveEntomologicalReport} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="check" size={17} color="#FFFFFF" /><Text style={styles.saveText}>{editingEntomologicalId ? 'बदल जतन करा' : 'नोंद जतन करा'}</Text></Pressable>
             </View> : null}
             <View style={styles.entriesHeader}>
               <View><Text style={[styles.entriesTitle, { color: colors.foreground }]}>किटकशास्त्रीय नोंदी</Text><Text style={[styles.entriesSubtitle, { color: colors.mutedForeground }]}>गावाची लोकसंख्या आणि एकूण घरांची संख्या प्रोफाइलमधून घेतली आहे.</Text></View>
               <View style={[styles.countPill, { backgroundColor: colors.secondary }]}><Text style={[styles.countPillText, { color: colors.primary }]}>{entomologicalReports.length}</Text></View>
             </View>
             {entomologicalReports.length ? entomologicalReports.map((entry, index) => (
               <EntomologicalEntryCard key={entry.id} entry={entry} index={index} colors={colors} onEdit={() => editEntomologicalReport(entry)} onRemove={() => Alert.alert('नोंद हटवायची?', `${entry.villageName} गावाची नोंद हटवायची आहे का?`, [{ text: 'रद्द करा', style: 'cancel' }, { text: 'हटवा', style: 'destructive', onPress: () => removeEntomologicalReport(entry.id) }])} />
             )) : <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="sunrise" size={24} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>अजून किटकशास्त्रीय नोंद नाही</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>या sectionमधील + बटन दाबून गावाची नोंद जोडा.</Text></View>}
             {entomologicalReports.length ? <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <View style={styles.exportHeading}><View><Text style={[styles.exportTitle, { color: colors.foreground }]}>किटकशास्त्रीय रिपोर्ट तयार आहे?</Text><Text style={[styles.exportText, { color: colors.mutedForeground }]}>नोंदी तपासल्यानंतर PDF शेअर करा.</Text></View><Feather name="file-text" size={20} color={colors.primary} /></View>
               <Pressable testID="share-entomological-report-pdf" onPress={() => void exportEntomologicalPdf()} style={({ pressed }) => [styles.exportButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="share-2" size={15} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF शेअर करा</Text></Pressable>
             </View> : null}
             <View style={[styles.signatureArea, { backgroundColor: colors.secondary }]}>
               <View style={styles.signatureColumn}><Text style={[styles.signatureText, { color: colors.foreground }]}>सविनय सादर</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>वैद्यकीय अधिकारी</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र: {profile.primaryHealthCenter || '—'}</Text></View>
               <View style={[styles.signatureColumn, styles.signatureRight]}><Text style={[styles.signatureText, { color: colors.foreground }]}>नाव: {profile.name || '—'}</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>आरोग्य सेवक</Text><Text style={[styles.signatureText, { color: colors.mutedForeground }]}>उपकेंद्र: {profile.subCenter || '—'}</Text></View>
             </View>
            </View> : null}
             {activeReport === 'bloodSampleMonthly' ? <View style={styles.secondReportSection}>
              <BloodSampleMonthlyReport />
            </View> : null}
             {activeReport === 'bloodSlide' ? <View style={styles.secondReportSection}>
               <BloodSlideReport />
             </View> : null}
             {activeReport === 'guppyFishReleasePlaces' ? <View style={styles.secondReportSection}>
               <GuppyFishReleasePlacesReport />
             </View> : null}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, colors }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'number-pad'; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} /></View>;
}

function ProfileValueField({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <View style={[styles.fieldInput, styles.readOnlyField, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Text style={[styles.readOnlyFieldText, { color: colors.foreground }]}>{value || 'प्रोफाइलमध्ये भरा'}</Text>
    </View>
  </View>;
}

function VillageChoiceField({ value, villages, onChange, colors }: { value: string; villages: Village[]; onChange: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  const availableVillages = villages.filter((village) => village.name.trim());
  return <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>गावाचे नाव *</Text>
    {availableVillages.length ? <View style={styles.villageChoices}>
      {availableVillages.map((village) => {
        const selected = value === village.name.trim();
        return <Pressable key={village.id} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${village.name} गाव निवडा`} onPress={() => onChange(village.name.trim())} style={({ pressed }) => [styles.villageChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background, opacity: pressed ? 0.75 : 1 }]}>
          <Feather name={selected ? 'check-circle' : 'circle'} size={16} color={selected ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.villageChoiceText, { color: selected ? colors.primary : colors.foreground }]}>{village.name.trim()}</Text>
        </Pressable>;
      })}
    </View> : <View style={[styles.noVillagesNotice, { backgroundColor: colors.secondary }]}>
      <Feather name="info" size={15} color={colors.primary} />
      <Text style={[styles.noVillagesText, { color: colors.foreground }]}>प्रोफाइलमध्ये अजून गावे जोडलेली नाहीत. आधी प्रोफाइलमध्ये गावांची नोंद करा.</Text>
    </View>}
    {value ? <Text style={[styles.selectedVillageText, { color: colors.primary }]}>निवडलेले गाव: {value}</Text> : null}
  </View>;
}

function ReportMenuItem({ number, icon, title, count, onPress, colors, last = false }: { number: string; icon: keyof typeof Feather.glyphMap; title: string; count: number; onPress: () => void; colors: ReturnType<typeof useColors>; last?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title} उघडा`} onPress={onPress} style={({ pressed }) => [styles.reportMenuItem, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }, { opacity: pressed ? 0.72 : 1 }]}>
    <View style={[styles.reportMenuNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.reportMenuNumberText, { color: colors.primary }]}>{number}</Text></View>
    <View style={[styles.reportMenuIcon, { backgroundColor: colors.background }]}><Feather name={icon} size={17} color={colors.primary} /></View>
    <Text style={[styles.reportMenuTitle, { color: colors.foreground }]}>{title}</Text>
    <View style={[styles.reportMenuCount, { backgroundColor: colors.secondary }]}><Text style={[styles.reportMenuCountText, { color: colors.primary }]}>{count}</Text></View>
    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
  </Pressable>;
}

function GenderField({ value, onChange, colors }: { value: string; onChange: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>लिंग</Text>
    <View style={styles.genderChoices}>
      <TestTypeChoice label="M" selected={value === 'M'} onPress={() => onChange('M')} colors={colors} />
      <TestTypeChoice label="F" selected={value === 'F'} onPress={() => onChange('F')} colors={colors} />
    </View>
  </View>;
}

function DeathEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: DeathReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.personName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.age || '—'} वर्षे · {entry.gender || '—'} · {entry.villageName || 'गाव नमूद नाही'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.deathPlace || 'ठिकाण नमूद नाही'} · {entry.deathDate}</Text>
      {entry.cause ? <Text style={[styles.entryCause, { color: colors.foreground }]}>कारण: {entry.cause}</Text> : null}
      {entry.remark ? <Text style={[styles.entryCause, { color: colors.mutedForeground }]}>शेरा: {entry.remark}</Text> : null}
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function CataractEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: CataractReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  const eyeLabel = entry.eye === 'right' ? 'उजवा डोळा' : entry.eye === 'left' ? 'डावा डोळा' : 'डोळा नमूद नाही';
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.personName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.age || '—'} वर्षे · {entry.gender || '—'} · {entry.villageName || 'गाव नमूद नाही'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{eyeLabel} · {entry.searchDate || 'शोधल्याचा दिनांक बाकी'}</Text>
      {entry.remark ? <Text style={[styles.entryCause, { color: colors.mutedForeground }]}>शेरा: {entry.remark}</Text> : null}
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची मोतीबिंदू नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची मोतीबिंदू नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function CataractSurgeryEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: CataractSurgeryReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  const eyeLabel = entry.eye === 'right' ? 'उजवा डोळा' : entry.eye === 'left' ? 'डावा डोळा' : 'डोळा नमूद नाही';
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.personName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.age || '—'} वर्षे · {entry.gender || '—'} · {entry.villageName || 'गाव नमूद नाही'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{eyeLabel} · {entry.surgeryDate || 'शस्त्रक्रिया दिनांक बाकी'}</Text>
      {entry.remark ? <Text style={[styles.entryCause, { color: colors.mutedForeground }]}>शेरा: {entry.remark}</Text> : null}
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची शस्त्रक्रिया नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची शस्त्रक्रिया नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function SputumEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: SputumSampleReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.personName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.age || '—'} वर्षे · {entry.gender || '—'} · {entry.villageName || 'गाव नमूद नाही'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.testType === 'cbnaat' ? 'CBNAAT' : 'Sputum'} · नमुना: {entry.sampleCollectedDate || '—'} · पाठवलेला दिनांक: {entry.sampleTestDate || '—'}</Text>
      {entry.workerName ? <Text style={[styles.entryCause, { color: colors.mutedForeground }]}>शोधणारा कर्मचारी: {entry.workerName}</Text> : null}
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची थुकी नमुना नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची थुकी नमुना नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function LeprosyEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: LeprosyReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  const spotCountLabel = entry.spotCount === 'more-than-5' ? '५ पेक्षा जास्त' : entry.spotCount === '1-5' ? '१ ते ५' : 'नमूद नाही';
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.personName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{entry.age || '—'} वर्षे · {entry.gender || '—'} · {entry.villageName || 'गाव नमूद नाही'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>चट्टे: {spotCountLabel} · ठिकाण: {entry.spotLocation || 'नमूद नाही'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>शोधल्याचा दिनांक: {entry.searchDate || '—'}</Text>
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची कुष्ठरुग्ण नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.personName} ची कुष्ठरुग्ण नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function WaterTclEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: WaterTclReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.villageName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>मागील: {entry.previousBalance || '—'} · मिळालेले: {entry.receivedThisMonth || '—'} · एकूण: {entry.totalStock || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>खर्च: {entry.usedStock || '—'} · महिनाअखेर शिल्लक: {entry.closingBalance || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>पाणी नमुने मा.: {entry.waterSamplesCollected || '—'} · प्र.: {entry.waterSamplesSent || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>ओ.टी. योग्य: {entry.tclSuitable || '—'} · अयोग्य: {entry.tclUnsuitable || '—'}</Text>
      {entry.remark ? <Text style={[styles.entryCause, { color: colors.mutedForeground }]}>शेरा: {entry.remark}</Text> : null}
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गावाची पाणी नमुना नोंद बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गावाची पाणी नमुना नोंद हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function NationalProgramsReviewEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: NationalProgramsReviewEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  const metrics: Array<[string, string, string]> = [
    ['क्षयरोग', entry.tbMa, entry.tbPr],
    ['कुष्ठरोग', entry.leprosyMa, entry.leprosyPr],
    ['मोतीबिंदू संशयित', entry.cataractSuspectedMa, entry.cataractSuspectedPr],
    ['मोतीबिंदू शस्त्रक्रिया', entry.cataractSurgeryMa, entry.cataractSurgeryPr],
    ['थुंकी नमुने', entry.sputumMa, entry.sputumPr],
    ['पाणी नमुने', entry.waterMa, entry.waterPr],
    ['टी. सी. एल.', entry.tclMa, entry.tclPr],
    ['मीठ नमुने', entry.saltMa, entry.saltPr],
    ['ओ. टी. टेस्ट', entry.otMa, entry.otPr],
  ];
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.villageName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>लोकसंख्या: {entry.population || '—'}</Text>
      {metrics.map(([label, ma, pr]) => <Text key={label} style={[styles.entryMeta, { color: colors.mutedForeground }]}>{label}: मा. {ma || '—'} · प्र. {pr || '—'}</Text>)}
      {entry.remark ? <Text style={[styles.entryCause, { color: colors.mutedForeground }]}>शेरा: {entry.remark}</Text> : null}
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गावाचा राष्ट्रीय कार्यक्रम आढावा बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गावाचा राष्ट्रीय कार्यक्रम आढावा हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function EntomologicalEntryCard({ entry, index, colors, onEdit, onRemove }: { entry: EntomologicalReportEntry; index: number; colors: ReturnType<typeof useColors>; onEdit: () => void; onRemove: () => void }) {
  return <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.entryNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.entryNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
    <View style={styles.entryCopy}>
      <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.villageName}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>लोकसंख्या: {entry.population || '—'} · एकूण घरे: {entry.householdCount || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>अळी तपासलेली घरे: {entry.larvaeInspectedHouses || '—'} · अळी असलेली घरे: {entry.larvaeInfestedHouses || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>कंटेनर तपासलेले: {entry.containersInspected || '—'} · दूषित: {entry.containersInfested || '—'} · रिकामी: {entry.containersEmptied || '—'}</Text>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>ऑव्हिट टाकलेली घरे: {entry.ovitrapHouses || '—'} · हाऊस: {entry.houseIndex || '—'} · कंटेनर: {entry.containerIndex || '—'} · ब्रेटो: {entry.breteauIndex || '—'}</Text>
    </View>
    <View style={styles.entryActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गावाचा किटकशास्त्रीय अहवाल बदला`} onPress={onEdit} hitSlop={10}><Feather name="edit-2" size={16} color={colors.primary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${entry.villageName} गावाचा किटकशास्त्रीय अहवाल हटवा`} onPress={onRemove} hitSlop={10}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
    </View>
  </View>;
}

function EyeChoice({ label, value, selected, onPress, colors }: { label: string; value: 'right' | 'left'; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.eyeChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background, opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.eyeChoiceDot, { borderColor: selected ? colors.primary : colors.mutedForeground, backgroundColor: selected ? colors.primary : 'transparent' }]} />
    <Text style={[styles.eyeChoiceText, { color: selected ? colors.primary : colors.mutedForeground }]}>{label}</Text>
    <Text style={styles.eyeChoiceValue}>{value === 'right' ? 'R' : 'L'}</Text>
  </Pressable>;
}

function ReviewMetricPair({ label, firstValue, onFirstChange, secondValue, onSecondChange, colors }: { label: string; firstValue: string; onFirstChange: (value: string) => void; secondValue: string; onSecondChange: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <View>
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
    <View style={styles.twoColumns}>
      <View style={styles.column}><FormField label="मा." value={firstValue} onChangeText={onFirstChange} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
      <View style={styles.column}><FormField label="प्र." value={secondValue} onChangeText={onSecondChange} placeholder="संख्या" keyboardType="number-pad" colors={colors} /></View>
    </View>
  </View>;
}

function TestTypeChoice({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.testTypeChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background, opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.eyeChoiceDot, { borderColor: selected ? colors.primary : colors.mutedForeground, backgroundColor: selected ? colors.primary : 'transparent' }]} />
    <Text style={[styles.testTypeText, { color: selected ? colors.primary : colors.mutedForeground }]}>{label}</Text>
  </Pressable>;
}

function SpotCountChoice({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.testTypeChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background, opacity: pressed ? 0.75 : 1 }]}>
    <Feather name={selected ? 'check-square' : 'square'} size={17} color={selected ? colors.primary : colors.mutedForeground} />
    <Text style={[styles.testTypeText, { color: selected ? colors.primary : colors.mutedForeground }]}>{label}</Text>
  </Pressable>;
}

const sumWaterValues = (values: string[]) => {
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  return numbers.length ? String(numbers.reduce((total, value) => total + value, 0)) : '';
};

function buildWaterTclReportHtml({ profile, waterTclReports, monthLabel }: { profile: Profile; waterTclReports: WaterTclReportEntry[]; monthLabel: string }) {
  const rows = waterTclReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.previousBalance)}</td>
      <td>${escapeHtml(entry.receivedThisMonth)}</td>
      <td>${escapeHtml(entry.totalStock)}</td>
      <td>${escapeHtml(entry.usedStock)}</td>
      <td>${escapeHtml(entry.closingBalance)}</td>
      <td>${escapeHtml(entry.waterSamplesCollected)}</td>
      <td>${escapeHtml(entry.waterSamplesSent)}</td>
      <td>${escapeHtml(entry.tclSuitable)}</td>
      <td>${escapeHtml(entry.tclUnsuitable)}</td>
      <td>${escapeHtml(entry.remark)}</td>
    </tr>
  `).join('');
  const totals = [
    sumWaterValues(waterTclReports.map((entry) => entry.previousBalance)),
    sumWaterValues(waterTclReports.map((entry) => entry.receivedThisMonth)),
    sumWaterValues(waterTclReports.map((entry) => entry.totalStock)),
    sumWaterValues(waterTclReports.map((entry) => entry.usedStock)),
    sumWaterValues(waterTclReports.map((entry) => entry.closingBalance)),
    sumWaterValues(waterTclReports.map((entry) => entry.waterSamplesCollected)),
    sumWaterValues(waterTclReports.map((entry) => entry.waterSamplesSent)),
    sumWaterValues(waterTclReports.map((entry) => entry.tclSuitable)),
    sumWaterValues(waterTclReports.map((entry) => entry.tclUnsuitable)),
  ];
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>पाणी नमुने व ओ.टी. अहवाल - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 19px; text-align: center; margin: 20px 0 14px; }
      table { border-collapse: collapse; width: 100%; font-size: 8.5px; }
      th, td { border: 1px solid #6f7785; padding: 5px 3px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(12) { text-align: left; }
      .total-row td { background: #eef2ff; font-weight: 700; }
      .signatures { display: flex; justify-content: space-between; margin-top: 42px; font-size: 12px; line-height: 1.7; }
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
      <h1>पाणी नमुने व ओ.टी. अहवाल</h1>
      <table>
        <thead>
          <tr>
            <th rowspan="2">अ. नं.</th><th rowspan="2">गावाचे नाव</th><th rowspan="2">मागील<br>शिल्लक</th><th rowspan="2">चालू महिन्यात<br>मिळालेला साठा</th><th rowspan="2">एकूण<br>साठा</th><th rowspan="2">खर्च<br>साठा</th><th rowspan="2">महिन्याखेर<br>शिल्लक साठा</th><th colspan="2">पाणी नमुने</th><th colspan="2">ओ.टी.</th><th rowspan="2">शेरा</th>
          </tr>
          <tr><th>मा.</th><th>प्र.</th><th>योग्य</th><th>अयोग्य</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="12">कोणतीही नोंद नाही</td></tr>'}</tbody>
        <tfoot><tr class="total-row"><td colspan="2">एकूण</td>${totals.map((total) => `<td>${total}</td>`).join('')}<td></td></tr></tfoot>
      </table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

function buildEntomologicalReportHtml({ profile, entomologicalReports, monthLabel }: { profile: Profile; entomologicalReports: EntomologicalReportEntry[]; monthLabel: string }) {
  const rows = entomologicalReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.population)}</td>
      <td>${escapeHtml(entry.householdCount)}</td>
      <td>${escapeHtml(entry.larvaeInspectedHouses)}</td>
      <td>${escapeHtml(entry.larvaeInfestedHouses)}</td>
      <td>${escapeHtml(entry.containersInspected)}</td>
      <td>${escapeHtml(entry.containersInfested)}</td>
      <td>${escapeHtml(entry.containersEmptied)}</td>
      <td>${escapeHtml(entry.ovitrapHouses)}</td>
      <td>${escapeHtml(entry.houseIndex)}</td>
      <td>${escapeHtml(entry.containerIndex)}</td>
      <td>${escapeHtml(entry.breteauIndex)}</td>
    </tr>
  `).join('');
  const sum = (field: keyof EntomologicalReportEntry) => sumNationalReviewValues(entomologicalReports.map((entry) => entry[field]));
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>किटकशास्त्रीय अहवाल - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 16px; font-weight: 700; }
      .meta { font-size: 10px; margin-top: 3px; }
      .month { font-size: 11px; font-weight: 700; min-width: 110px; text-align: right; }
      h1 { font-size: 18px; text-align: center; margin: 14px 0 12px; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 7.5px; }
      th, td { border: 1px solid #222; padding: 4px 2px; text-align: center; vertical-align: middle; word-break: break-word; }
      th { font-weight: 700; }
      th:nth-child(2), td:nth-child(2) { width: 12%; }
      .total-row td { font-weight: 700; }
      .signatures { display: flex; justify-content: space-between; margin-top: 25px; font-size: 10px; line-height: 1.6; }
      .right { text-align: right; }
    </style></head><body>
      <div class="top">
        <div style="width:110px"></div>
        <div class="center">
          <div class="facility">${escapeHtml(`प्राथमिक आरोग्य केंद्र ${profile.primaryHealthCenter || '—'}`)}</div>
          <div class="meta">तालुका: ${escapeHtml(profile.taluka || '—')} &nbsp;&nbsp; जिल्हा: ${escapeHtml(profile.district || '—')}</div>
          <div class="meta">उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
        </div>
        <div class="month">महिना: ${escapeHtml(monthLabel)}</div>
      </div>
      <h1>किटकशास्त्रीय अहवाल</h1>
      <table><thead><tr>
        <th>अ. क्र.</th><th>गावाचे नाव</th><th>लोकसंख्या</th><th>एकूण<br>घरांची संख्या</th>
        <th>डास अळी करिता<br>तपासलेली घरे</th><th>डास अळी असलेली<br>घरे</th><th>तपासलेली<br>कंटेनर</th>
        <th>दूषित असलेली<br>कंटेनर</th><th>रिकामी केलेली<br>कंटेनर</th><th>ऑव्हिट टाकलेली<br>घरे</th>
        <th>हाऊस<br>इंडेक्स</th><th>कंटेनर<br>इंडेक्स</th><th>ब्रेटो<br>इंडेक्स</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="13">कोणतीही नोंद नाही</td></tr>'}</tbody>
      <tfoot><tr class="total-row"><td colspan="2">Total</td><td>${sum('population')}</td><td>${sum('householdCount')}</td><td>${sum('larvaeInspectedHouses')}</td><td>${sum('larvaeInfestedHouses')}</td><td>${sum('containersInspected')}</td><td>${sum('containersInfested')}</td><td>${sum('containersEmptied')}</td><td>${sum('ovitrapHouses')}</td><td></td><td></td><td></td></tr></tfoot></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

const sumNationalReviewValues = (values: string[]) => {
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  return numbers.length ? String(numbers.reduce((total, value) => total + value, 0)) : '';
};

function buildNationalProgramsReviewHtml({ profile, nationalProgramsReviewReports, monthLabel }: { profile: Profile; nationalProgramsReviewReports: NationalProgramsReviewEntry[]; monthLabel: string }) {
  const rows = nationalProgramsReviewReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.population)}</td>
      <td>${escapeHtml(entry.tbMa)}</td><td>${escapeHtml(entry.tbPr)}</td>
      <td>${escapeHtml(entry.leprosyMa)}</td><td>${escapeHtml(entry.leprosyPr)}</td>
      <td>${escapeHtml(entry.cataractSuspectedMa)}</td><td>${escapeHtml(entry.cataractSuspectedPr)}</td>
      <td>${escapeHtml(entry.cataractSurgeryMa)}</td><td>${escapeHtml(entry.cataractSurgeryPr)}</td>
      <td>${escapeHtml(entry.sputumMa)}</td><td>${escapeHtml(entry.sputumPr)}</td>
      <td>${escapeHtml(entry.waterMa)}</td><td>${escapeHtml(entry.waterPr)}</td>
      <td>${escapeHtml(entry.tclMa)}</td><td>${escapeHtml(entry.tclPr)}</td>
      <td>${escapeHtml(entry.saltMa)}</td><td>${escapeHtml(entry.saltPr)}</td>
      <td>${escapeHtml(entry.otMa)}</td><td>${escapeHtml(entry.otPr)}</td>
      <td>${escapeHtml(entry.remark)}</td>
    </tr>
  `).join('');
  const numericFields: Array<keyof Omit<NationalProgramsReviewEntry, 'id' | 'villageName' | 'remark'>> = [
    'population', 'tbMa', 'tbPr', 'leprosyMa', 'leprosyPr', 'cataractSuspectedMa', 'cataractSuspectedPr',
    'cataractSurgeryMa', 'cataractSurgeryPr', 'sputumMa', 'sputumPr', 'waterMa', 'waterPr', 'tclMa', 'tclPr',
    'saltMa', 'saltPr', 'otMa', 'otPr',
  ];
  const totals = numericFields.map((field) => sumNationalReviewValues(nationalProgramsReviewReports.map((entry) => entry[field])));
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>सहा राष्ट्रीय कार्यक्रमाचा आढावा - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 9mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 16px; font-weight: 700; }
      .meta { font-size: 10px; margin-top: 3px; }
      .month { font-size: 11px; font-weight: 700; min-width: 110px; text-align: right; }
      h1 { font-size: 17px; text-align: center; margin: 14px 0 10px; }
      table { border-collapse: collapse; width: 100%; font-size: 6.8px; table-layout: fixed; }
      th, td { border: 1px solid #222; padding: 3px 2px; text-align: center; vertical-align: middle; word-break: break-word; }
      th { font-weight: 700; }
      th:nth-child(2), td:nth-child(2) { width: 9%; }
      th:nth-child(22), td:nth-child(22) { width: 8%; }
      .total-row td { font-weight: 700; }
      .signatures { display: flex; justify-content: space-between; margin-top: 24px; font-size: 10px; line-height: 1.6; }
      .right { text-align: right; }
    </style></head><body>
      <div class="top">
        <div style="width:110px"></div>
        <div class="center">
          <div class="facility">${escapeHtml(`प्राथमिक आरोग्य केंद्र ${profile.primaryHealthCenter || '—'}`)}</div>
          <div class="meta">तालुका: ${escapeHtml(profile.taluka || '—')} &nbsp;&nbsp; जिल्हा: ${escapeHtml(profile.district || '—')}</div>
          <div class="meta">उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
        </div>
        <div class="month">महिना: ${escapeHtml(monthLabel)}</div>
      </div>
      <h1>सहा राष्ट्रीय कार्यक्रमाचा आढावा</h1>
      <table>
        <thead>
          <tr>
            <th rowspan="2">अ. नं.</th><th rowspan="2">गावाचे नाव</th><th rowspan="2">लोकसंख्या</th>
            <th colspan="2">क्षयरोग</th><th colspan="2">कुष्ठरोग</th><th colspan="2">मोतीबिंदू<br>संशयित</th>
            <th colspan="2">मोतीबिंदू<br>शस्त्रक्रिया</th><th colspan="2">थुंकी नमुने</th><th colspan="2">पाणी नमुने</th>
            <th colspan="2">टी. सी. एल.<br>नमुने</th><th colspan="2">मीठ नमुने</th><th colspan="2">ओ. टी.<br>टेस्ट</th><th rowspan="2">शेरा</th>
          </tr>
          <tr>
            <th>मा.</th><th>प्र.</th><th>मा.</th><th>प्र.</th><th>मा.</th><th>प्र.</th><th>मा.</th><th>प्र.</th>
            <th>मा.</th><th>प्र.</th><th>मा.</th><th>प्र.</th><th>मा.</th><th>प्र.</th><th>मा.</th><th>प्र.</th>
            <th>मा.</th><th>प्र.</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="22">कोणतीही नोंद नाही</td></tr>'}</tbody>
        <tfoot><tr class="total-row"><td colspan="2">Total</td>${totals.map((total) => `<td>${total}</td>`).join('')}<td></td></tr></tfoot>
      </table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्यसेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

function buildLeprosyReportHtml({ profile, leprosyReports, monthLabel }: { profile: Profile; leprosyReports: LeprosyReportEntry[]; monthLabel: string }) {
  const rows = leprosyReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.personName)}</td>
      <td>${escapeHtml(entry.age)}</td>
      <td>${escapeHtml(entry.gender)}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.spotCount === 'more-than-5' ? '५ पेक्षा जास्त' : entry.spotCount === '1-5' ? '१ ते ५' : '')}</td>
      <td>${escapeHtml(entry.spotLocation)}</td>
      <td>${escapeHtml(entry.searchDate)}</td>
    </tr>
  `).join('');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>संशयीत कुष्ठरुग्ण अहवाल - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 24px 0 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 10px; }
      th, td { border: 1px solid #6f7785; padding: 7px 5px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(5), td:nth-child(7) { text-align: left; }
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
        <div class="month">${escapeHtml(monthLabel)}</div>
      </div>
      <h1>संशयीत कुष्ठरुग्ण अहवाल</h1>
      <table><thead><tr>
        <th>अ.नं.</th><th>रुग्णाचे नाव</th><th>वय</th><th>लिंग</th><th>गावाचे नाव</th><th>चट्टे<br>१ ते ५ / ५ पेक्षा जास्त</th><th>चट्ट्याचे ठिकाण</th><th>शोधल्याचा दिनांक</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="8">कोणतीही नोंद नाही</td></tr>'}</tbody></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

function buildCataractReportHtml({ profile, cataractReports, monthLabel }: { profile: Profile; cataractReports: CataractReportEntry[]; monthLabel: string }) {
  const rows = cataractReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.personName)}</td>
      <td>${escapeHtml(entry.age)}</td>
      <td>${escapeHtml(entry.gender)}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.eye === 'right' ? 'उजवा' : entry.eye === 'left' ? 'डावा' : '')}</td>
      <td>${escapeHtml(entry.searchDate)}</td>
      <td>${escapeHtml(entry.remark)}</td>
    </tr>
  `).join('');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>संशयीत मोतीबिंदू अहवाल - ${escapeHtml(monthLabel)}</title>
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
      th, td { border: 1px solid #6f7785; padding: 8px 6px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(5), td:nth-child(8) { text-align: left; }
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
        <div class="month">${escapeHtml(monthLabel)}</div>
      </div>
      <h1>संशयीत मोतीबिंदू अहवाल</h1>
      <table><thead><tr>
        <th>अ.नं.</th><th>रुग्णाचे नाव</th><th>वय</th><th>लिंग</th><th>गावाचे नाव</th><th>डोळा</th><th>शोधल्याचा दिनांक</th><th>शेरा</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="8">कोणतीही नोंद नाही</td></tr>'}</tbody></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

function buildSputumReportHtml({ profile, sputumSampleReports, monthLabel }: { profile: Profile; sputumSampleReports: SputumSampleReportEntry[]; monthLabel: string }) {
  const rows = sputumSampleReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.personName)}</td>
      <td>${escapeHtml(entry.age)}</td>
      <td>${escapeHtml(entry.gender)}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.sampleCollectedDate)}</td>
      <td>${escapeHtml(entry.sampleTestDate)}</td>
      <td>${escapeHtml(entry.workerName)}</td>
      <td>${escapeHtml(entry.testType === 'cbnaat' ? 'CBNAAT' : entry.testType === 'sputum' ? 'Sputum' : '')}</td>
    </tr>
  `).join('');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>थुकी नमुने अहवाल - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 24px 0 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 10px; }
      th, td { border: 1px solid #6f7785; padding: 7px 5px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(5), td:nth-child(8) { text-align: left; }
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
        <div class="month">${escapeHtml(monthLabel)}</div>
      </div>
      <h1>थुकी नमुने अहवाल</h1>
      <table><thead><tr>
        <th>अ.नं.</th><th>रुग्णाचे नाव</th><th>वय</th><th>लिंग</th><th>गावाचे नाव</th><th>थुकी नमुना घेतल्याचा दिनांक</th><th>थुंकी नमुना तपासणीसाठी पाठवलेला दिनांक</th><th>शोधणाऱ्या कर्मचाऱ्याचे नाव</th><th>Sputum/CBNAAT</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="9">कोणतीही नोंद नाही</td></tr>'}</tbody></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

function buildCataractSurgeryReportHtml({ profile, cataractSurgeryReports, monthLabel }: { profile: Profile; cataractSurgeryReports: CataractSurgeryReportEntry[]; monthLabel: string }) {
  const rows = cataractSurgeryReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.personName)}</td>
      <td>${escapeHtml(entry.age)}</td>
      <td>${escapeHtml(entry.gender)}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.eye === 'right' ? 'उजवा' : entry.eye === 'left' ? 'डावा' : '')}</td>
      <td>${escapeHtml(entry.surgeryDate)}</td>
      <td>${escapeHtml(entry.remark)}</td>
    </tr>
  `).join('');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>मोतीबिंदू शस्त्रक्रिया अहवाल - ${escapeHtml(monthLabel)}</title>
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
      th, td { border: 1px solid #6f7785; padding: 8px 6px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(5), td:nth-child(8) { text-align: left; }
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
        <div class="month">${escapeHtml(monthLabel)}</div>
      </div>
      <h1>मोतीबिंदू शस्त्रक्रिया अहवाल</h1>
      <table><thead><tr>
        <th>अ.नं.</th><th>रुग्णाचे नाव</th><th>वय</th><th>लिंग</th><th>गावाचे नाव</th><th>डोळा</th><th>शस्त्रक्रिया दिनांक</th><th>शेरा</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="8">कोणतीही नोंद नाही</td></tr>'}</tbody></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

function bodyFromReportHtml(html: string) {
  return html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
}

function buildCombinedReportsFileName(monthLabel: string) {
  const safeMonthLabel = monthLabel.replace(/[\\/:*?"<>|]/g, '-').trim();
  return `सहा राष्ट्रीय कार्यक्रमाचा आढावा - ${safeMonthLabel}.pdf`;
}

function buildEntomologicalSectionFileName(monthLabel: string) {
  const safeMonthLabel = monthLabel.replace(/[\\/:*?"<>|]/g, '-').trim();
  return `किटकशास्त्रीय अहवाल - ${safeMonthLabel}.pdf`;
}

function buildEntomologicalSectionHtml({
  profile,
  entomologicalReports,
  bloodSlideReports,
  guppyFishReleasePlacesReports,
  monthLabel,
}: {
  profile: Profile;
  entomologicalReports: EntomologicalReportEntry[];
  bloodSlideReports: BloodSlideReportEntry[];
  guppyFishReleasePlacesReports: GuppyFishReleasePlacesReportEntry[];
  monthLabel: string;
}) {
  const pages = [
    buildEntomologicalReportHtml({ profile, entomologicalReports, monthLabel }),
    buildBloodSlideReportHtml({ profile, reports: bloodSlideReports, monthLabel }),
    buildGuppyFishReleasePlacesReportHtml({ profile, reports: guppyFishReleasePlacesReports, monthLabel }),
  ].map(bodyFromReportHtml).join('<div class="report-page-break"></div>');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>${escapeHtml(buildEntomologicalSectionFileName(monthLabel).replace(/\.pdf$/i, ''))}</title>
    <style>
      @page { size: A4 landscape; margin: 14mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .report-page-break { page-break-after: always; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 22px 0 15px; }
      table { border-collapse: collapse; width: 100%; font-size: 9px; }
      th, td { border: 1px solid #6f7785; padding: 6px 4px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      .total-row td, .totals td { background: #eef2ff; font-weight: 700; }
      .signatures { display: flex; justify-content: space-between; margin-top: 48px; font-size: 12px; line-height: 1.7; }
      .right { text-align: right; }
    </style></head><body>${pages}</body></html>`;
}

function buildCombinedReportsHtml({
  profile,
  monthLabel,
  deathReports,
  cataractReports,
  cataractSurgeryReports,
  sputumSampleReports,
  leprosyReports,
  waterTclReports,
  nationalProgramsReviewReports,
}: {
  profile: Profile;
  monthLabel: string;
  deathReports: DeathReportEntry[];
  cataractReports: CataractReportEntry[];
  cataractSurgeryReports: CataractSurgeryReportEntry[];
  sputumSampleReports: SputumSampleReportEntry[];
  leprosyReports: LeprosyReportEntry[];
  waterTclReports: WaterTclReportEntry[];
  nationalProgramsReviewReports: NationalProgramsReviewEntry[];
}) {
  const pages = [
    buildNationalProgramsReviewHtml({ profile, nationalProgramsReviewReports, monthLabel }),
    buildDeathReportHtml({ profile, deathReports, monthLabel }),
    buildCataractReportHtml({ profile, cataractReports, monthLabel }),
    buildCataractSurgeryReportHtml({ profile, cataractSurgeryReports, monthLabel }),
    buildSputumReportHtml({ profile, sputumSampleReports, monthLabel }),
    buildLeprosyReportHtml({ profile, leprosyReports, monthLabel }),
    buildWaterTclReportHtml({ profile, waterTclReports, monthLabel }),
  ].map(bodyFromReportHtml).join('<div class="report-page-break"></div>');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>${escapeHtml(buildCombinedReportsFileName(monthLabel).replace(/\.pdf$/i, ''))}</title>
    <style>
      @page { size: A4 landscape; margin: 14mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .report-page-break { page-break-after: always; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 22px 0 15px; }
      table { border-collapse: collapse; width: 100%; font-size: 9px; }
      th, td { border: 1px solid #6f7785; padding: 6px 4px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(5), td:nth-child(8), td:nth-child(9), td:nth-child(12) { text-align: left; }
      .total-row td { background: #eef2ff; font-weight: 700; }
      .signatures { display: flex; justify-content: space-between; margin-top: 48px; font-size: 12px; line-height: 1.7; }
      .right { text-align: right; }
    </style></head><body>${pages}</body></html>`;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

function buildDeathReportHtml({ profile, deathReports, monthLabel }: { profile: Profile; deathReports: DeathReportEntry[]; monthLabel: string }) {
  const rows = deathReports.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.personName)}</td>
      <td>${escapeHtml(entry.age)}</td>
      <td>${escapeHtml(entry.gender)}</td>
      <td>${escapeHtml(entry.villageName)}</td>
      <td>${escapeHtml(entry.deathPlace)}</td>
      <td>${escapeHtml(entry.deathDate)}</td>
      <td>${escapeHtml(entry.cause)}</td>
      <td>${escapeHtml(entry.remark)}</td>
    </tr>
  `).join('');
  return `<!doctype html>
    <html><head><meta charset="utf-8"><title>मृत्यू अहवाल - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .center { text-align: center; flex: 1; }
      .facility { font-size: 18px; font-weight: 700; }
      .meta { font-size: 12px; margin-top: 5px; }
      .month { font-size: 13px; font-weight: 700; min-width: 130px; text-align: right; }
      h1 { font-size: 20px; text-align: center; margin: 24px 0 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 10px; }
      th, td { border: 1px solid #6f7785; padding: 7px 5px; text-align: center; vertical-align: middle; }
      th { background: #eef2ff; font-weight: 700; }
      td:nth-child(2), td:nth-child(5), td:nth-child(6), td:nth-child(8), td:nth-child(9) { text-align: left; }
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
        <div class="month">${escapeHtml(monthLabel)}</div>
      </div>
      <h1>मृत्यू अहवाल</h1>
      <table><thead><tr>
        <th>अ.नं.</th><th>मृत व्यक्तीचे नाव</th><th>वय</th><th>लिंग</th><th>गावाचे नाव</th><th>मृत्यूचे ठिकाण</th><th>मृत्यूचा दिनांक</th><th>मृत्यूचे कारण</th><th>शेरा</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="9">कोणतीही नोंद नाही</td></tr>'}</tbody></table>
      <div class="signatures">
        <div>सविनय सादर<br>वैद्यकीय अधिकारी<br>प्राथमिक आरोग्य केंद्र: ${escapeHtml(profile.primaryHealthCenter || '—')}</div>
        <div class="right">नाव: ${escapeHtml(profile.name || '—')}<br>आरोग्य सेवक<br>उपकेंद्र: ${escapeHtml(profile.subCenter || '—')}</div>
      </div>
    </body></html>`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20 },
  secondReportSection: { marginTop: 8 },
  sectionBanner: { borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionCopy: { flex: 1 },
  sectionEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.7 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 3 },
  sectionAddButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  specialSection: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 10, marginTop: 12, marginBottom: 2 },
  specialSectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  specialSectionCopy: { flex: 1 },
  specialSectionEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 0.7 },
  specialSectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 2 },
  specialSectionText: { fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 2 },
  specialReportMenu: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, marginTop: 8, marginBottom: 4 },
  reportPaper: { borderRadius: 19, borderWidth: 1, padding: 16, marginBottom: 18 },
  reportMenu: { borderRadius: 19, borderWidth: 1, paddingHorizontal: 13, marginBottom: 18 },
  reportMenuItem: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
  reportMenuNumber: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  reportMenuNumberText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  reportMenuIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reportMenuTitle: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  reportMenuCount: { minWidth: 25, height: 25, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  reportMenuCountText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  paperTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  paperHeading: { flex: 1, paddingRight: 8 },
  facilityName: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  facilityMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  monthLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, maxWidth: 90, textAlign: 'right' },
  reportTitleRule: { borderTopWidth: 1, marginTop: 13 },
  reportTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center', marginTop: 12 },
  reportSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginTop: 4 },
  periodButton: { height: 34, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13 },
  periodButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  periodEditor: { borderRadius: 17, borderWidth: 1, padding: 14, marginTop: -8, marginBottom: 18 },
  periodSaveButton: { height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  formCard: { borderRadius: 19, borderWidth: 1, padding: 16, marginBottom: 18 },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 },
  formTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  formHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  twoColumns: { flexDirection: 'row', gap: 9 },
  column: { flex: 1, minWidth: 0 },
  field: { marginBottom: 11 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginBottom: 6 },
  fieldInput: { height: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, fontFamily: 'Inter_400Regular', fontSize: 13 },
  readOnlyField: { justifyContent: 'center' },
  readOnlyFieldText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  villageChoices: { gap: 7, marginBottom: 5 },
  villageChoice: { minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  villageChoiceText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  noVillagesNotice: { minHeight: 42, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noVillagesText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  selectedVillageText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 3, marginBottom: 2 },
  genderChoices: { flexDirection: 'row', gap: 9 },
  eyeChoices: { flexDirection: 'row', gap: 9, marginBottom: 11 },
  eyeChoice: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  eyeChoiceDot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5 },
  eyeChoiceText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, flex: 1 },
  eyeChoiceValue: { color: '#9CA3AF', fontFamily: 'Inter_700Bold', fontSize: 10 },
  testTypeChoices: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  testTypeChoice: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  testTypeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  saveButton: { height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2 },
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
  entryCause: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 5 },
  entryActions: { gap: 14, paddingTop: 2 },
  emptyCard: { borderRadius: 17, borderWidth: 1, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18, marginBottom: 14 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 9 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'center' },
  exportCard: { borderRadius: 17, borderWidth: 1, padding: 14, marginBottom: 14 },
  exportHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exportTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  exportText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  exportButtons: { flexDirection: 'row', gap: 8, marginTop: 13 },
  exportButton: { flex: 1, minHeight: 40, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  exportButtonSecondary: { borderWidth: 1, backgroundColor: 'transparent' },
  exportButtonText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  exportButtonSecondaryText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  signatureArea: { borderRadius: 15, padding: 13, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  signatureColumn: { flex: 1 },
  signatureRight: { alignItems: 'flex-end' },
  signatureText: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 16 },
});