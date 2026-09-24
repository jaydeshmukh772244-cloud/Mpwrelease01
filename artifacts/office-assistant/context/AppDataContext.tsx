import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface Profile {
  name: string;
  avatarUri: string;
  district: string;
  taluka: string;
  primaryHealthCenter: string;
  subCenter: string;
  villages: Village[];
  bsCode: string;
  phone: string;
  gmail: string;
}

export interface Village {
  id: string;
  name: string;
  population: string;
  householdCount: string;
}

export interface DeathReportEntry {
  id: string;
  personName: string;
  age: string;
  gender: string;
  villageName: string;
  deathPlace: string;
  deathDate: string;
  cause: string;
  remark: string;
}

export interface CataractReportEntry {
  id: string;
  personName: string;
  age: string;
  gender: string;
  villageName: string;
  eye: 'right' | 'left' | '';
  searchDate: string;
  remark: string;
}

export interface CataractSurgeryReportEntry {
  id: string;
  personName: string;
  age: string;
  gender: string;
  villageName: string;
  eye: 'right' | 'left' | '';
  surgeryDate: string;
  remark: string;
}

export interface SputumSampleReportEntry {
  id: string;
  personName: string;
  age: string;
  gender: string;
  villageName: string;
  sampleCollectedDate: string;
  sampleTestDate: string;
  workerName: string;
  testType: 'sputum' | 'cbnaat' | '';
}

export interface LeprosyReportEntry {
  id: string;
  personName: string;
  age: string;
  gender: string;
  villageName: string;
  spotCount: '1-5' | 'more-than-5' | '';
  spotLocation: string;
  searchDate: string;
}

export interface WaterTclReportEntry {
  id: string;
  villageName: string;
  previousBalance: string;
  receivedThisMonth: string;
  totalStock: string;
  usedStock: string;
  closingBalance: string;
  waterSamplesCollected: string;
  waterSamplesSent: string;
  tclSuitable: string;
  tclUnsuitable: string;
  remark: string;
}

export interface NationalProgramsReviewEntry {
  id: string;
  villageName: string;
  population: string;
  tbMa: string;
  tbPr: string;
  leprosyMa: string;
  leprosyPr: string;
  cataractSuspectedMa: string;
  cataractSuspectedPr: string;
  cataractSurgeryMa: string;
  cataractSurgeryPr: string;
  sputumMa: string;
  sputumPr: string;
  waterMa: string;
  waterPr: string;
  tclMa: string;
  tclPr: string;
  saltMa: string;
  saltPr: string;
  otMa: string;
  otPr: string;
  remark: string;
}

export interface EntomologicalReportEntry {
  id: string;
  villageName: string;
  population: string;
  householdCount: string;
  larvaeInspectedHouses: string;
  larvaeInfestedHouses: string;
  containersInspected: string;
  containersInfested: string;
  containersEmptied: string;
  ovitrapHouses: string;
  houseIndex: string;
  containerIndex: string;
  breteauIndex: string;
}

export interface BloodSampleMonthlyReportEntry {
  id: string;
  employeeName: string;
  villageName: string;
  population: string;
  firstFortnightFeverPatients: string;
  firstFortnightBloodSamples: string;
  secondFortnightFeverPatients: string;
  secondFortnightBloodSamples: string;
  annualFeverPatients: string;
  annualBloodSamples: string;
  remark: string;
}

export interface BloodSlideReportEntry {
  id: string;
  employeeName: string;
  primaryHealthCenter: string;
  subCenter: string;
  bsCode: string;
  villageName: string;
  firstFortnightMale: string;
  firstFortnightFemale: string;
  firstFortnightTotal: string;
  secondFortnightMale: string;
  secondFortnightFemale: string;
  secondFortnightTotal: string;
  monthlyTotal: string;
  progressive: string;
}

export interface GuppyFishReleasePlacesReportEntry {
  id: string;
  villageName: string;
  releasePlace: string;
  releaseType: 'seasonal' | 'permanent' | '';
  releaseDate: string;
}

export interface ReportPeriod {
  month: number;
  year: number;
}

export interface DiaryEntry {
  id: string;
  title: string;
  note: string;
  date: string;
  category: string;
  done: boolean;
  alarmAt?: string;
  notificationId?: string;
}

export type AtpWorkDetail = string;

export interface AtpRow {
  id: string;
  date: string;
  destination: string;
  workDetail: AtpWorkDetail;
}

export interface AtpPlan {
  month: number;
  year: number;
  rows: AtpRow[];
}

interface AppDataContextValue {
  profile: Profile;
  entries: DiaryEntry[];
  deathReports: DeathReportEntry[];
  cataractReports: CataractReportEntry[];
  cataractSurgeryReports: CataractSurgeryReportEntry[];
  sputumSampleReports: SputumSampleReportEntry[];
  leprosyReports: LeprosyReportEntry[];
  waterTclReports: WaterTclReportEntry[];
  nationalProgramsReviewReports: NationalProgramsReviewEntry[];
  entomologicalReports: EntomologicalReportEntry[];
  bloodSampleMonthlyReports: BloodSampleMonthlyReportEntry[];
  bloodSlideReports: BloodSlideReportEntry[];
  guppyFishReleasePlacesReports: GuppyFishReleasePlacesReportEntry[];
  reportPeriod: ReportPeriod;
  atpPlans: AtpPlan[];
  hydrated: boolean;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'date'> & { date?: string }) => void;
  updateEntry: (id: string, changes: Partial<Omit<DiaryEntry, 'id'>>) => void;
  toggleEntry: (id: string) => void;
  removeEntry: (id: string) => void;
  addDeathReport: (report: Omit<DeathReportEntry, 'id'>) => void;
  updateDeathReport: (id: string, report: Omit<DeathReportEntry, 'id'>) => void;
  removeDeathReport: (id: string) => void;
  addCataractReport: (report: Omit<CataractReportEntry, 'id'>) => void;
  updateCataractReport: (id: string, report: Omit<CataractReportEntry, 'id'>) => void;
  removeCataractReport: (id: string) => void;
  addCataractSurgeryReport: (report: Omit<CataractSurgeryReportEntry, 'id'>) => void;
  updateCataractSurgeryReport: (id: string, report: Omit<CataractSurgeryReportEntry, 'id'>) => void;
  removeCataractSurgeryReport: (id: string) => void;
  addSputumSampleReport: (report: Omit<SputumSampleReportEntry, 'id'>) => void;
  updateSputumSampleReport: (id: string, report: Omit<SputumSampleReportEntry, 'id'>) => void;
  removeSputumSampleReport: (id: string) => void;
  addLeprosyReport: (report: Omit<LeprosyReportEntry, 'id'>) => void;
  updateLeprosyReport: (id: string, report: Omit<LeprosyReportEntry, 'id'>) => void;
  removeLeprosyReport: (id: string) => void;
  addWaterTclReport: (report: Omit<WaterTclReportEntry, 'id'>) => void;
  updateWaterTclReport: (id: string, report: Omit<WaterTclReportEntry, 'id'>) => void;
  removeWaterTclReport: (id: string) => void;
  addNationalProgramsReviewReport: (report: Omit<NationalProgramsReviewEntry, 'id'>) => void;
  updateNationalProgramsReviewReport: (id: string, report: Omit<NationalProgramsReviewEntry, 'id'>) => void;
  removeNationalProgramsReviewReport: (id: string) => void;
  addEntomologicalReport: (report: Omit<EntomologicalReportEntry, 'id'>) => void;
  updateEntomologicalReport: (id: string, report: Omit<EntomologicalReportEntry, 'id'>) => void;
  removeEntomologicalReport: (id: string) => void;
  addBloodSampleMonthlyReport: (report: Omit<BloodSampleMonthlyReportEntry, 'id'>) => void;
  updateBloodSampleMonthlyReport: (id: string, report: Omit<BloodSampleMonthlyReportEntry, 'id'>) => void;
  removeBloodSampleMonthlyReport: (id: string) => void;
  addBloodSlideReport: (report: Omit<BloodSlideReportEntry, 'id'>) => void;
  updateBloodSlideReport: (id: string, report: Omit<BloodSlideReportEntry, 'id'>) => void;
  removeBloodSlideReport: (id: string) => void;
  addGuppyFishReleasePlacesReport: (report: Omit<GuppyFishReleasePlacesReportEntry, 'id'>) => void;
  updateGuppyFishReleasePlacesReport: (id: string, report: Omit<GuppyFishReleasePlacesReportEntry, 'id'>) => void;
  removeGuppyFishReleasePlacesReport: (id: string) => void;
  updateReportPeriod: (period: ReportPeriod) => void;
  updateAtpPlan: (plan: AtpPlan) => void;
  updateProfile: (profile: Profile) => void;
}

const STORAGE_KEY = '@office-assistant/data';

const emptyProfile: Profile = {
  name: '',
  avatarUri: '',
  district: '',
  taluka: '',
  primaryHealthCenter: '',
  subCenter: '',
  villages: [],
  bsCode: '',
  phone: '',
  gmail: '',
};

const currentDate = new Date();
const defaultReportPeriod: ReportPeriod = {
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
};

const today = new Date();
const dateKey = (offset = 0) => {
  const value = new Date(today);
  value.setDate(today.getDate() + offset);
  return value.toISOString().slice(0, 10);
};

const starterEntries: DiaryEntry[] = [
  {
    id: 'entry-1',
    title: 'साप्ताहिक टीम मीटिंग',
    note: 'पुढील आठवड्याची कामांची यादी आणि जबाबदाऱ्या ठरवायच्या.',
    date: dateKey(),
    category: 'मीटिंग',
    done: false,
  },
  {
    id: 'entry-2',
    title: 'ग्राहकाला प्रस्ताव पाठवला',
    note: 'नवीन प्रोजेक्टचा खर्चाचा अंदाज ईमेल केला.',
    date: dateKey(-1),
    category: 'फॉलो-अप',
    done: true,
  },
  {
    id: 'entry-3',
    title: 'महिन्याचा खर्च तपासला',
    note: 'ऑफिसचे नियमित खर्च आणि येणे बाकी असलेली रक्कम पाहिली.',
    date: dateKey(-2),
    category: 'अकाउंट्स',
    done: true,
  },
];

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [entries, setEntries] = useState<DiaryEntry[]>(starterEntries);
  const [deathReports, setDeathReports] = useState<DeathReportEntry[]>([]);
  const [cataractReports, setCataractReports] = useState<CataractReportEntry[]>([]);
  const [cataractSurgeryReports, setCataractSurgeryReports] = useState<CataractSurgeryReportEntry[]>([]);
  const [sputumSampleReports, setSputumSampleReports] = useState<SputumSampleReportEntry[]>([]);
  const [leprosyReports, setLeprosyReports] = useState<LeprosyReportEntry[]>([]);
  const [waterTclReports, setWaterTclReports] = useState<WaterTclReportEntry[]>([]);
  const [nationalProgramsReviewReports, setNationalProgramsReviewReports] = useState<NationalProgramsReviewEntry[]>([]);
  const [entomologicalReports, setEntomologicalReports] = useState<EntomologicalReportEntry[]>([]);
  const [bloodSampleMonthlyReports, setBloodSampleMonthlyReports] = useState<BloodSampleMonthlyReportEntry[]>([]);
  const [bloodSlideReports, setBloodSlideReports] = useState<BloodSlideReportEntry[]>([]);
  const [guppyFishReleasePlacesReports, setGuppyFishReleasePlacesReports] = useState<GuppyFishReleasePlacesReportEntry[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>(defaultReportPeriod);
  const [atpPlans, setAtpPlans] = useState<AtpPlan[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as {
            profile?: Partial<Profile> & { email?: string };
            people?: Array<{ name: string; role: string; phone: string; email?: string; kind?: string }>;
            entries?: DiaryEntry[];
            deathReports?: DeathReportEntry[];
            cataractReports?: Array<CataractReportEntry & { surgeryDate?: string }>;
            cataractSurgeryReports?: CataractSurgeryReportEntry[];
            sputumSampleReports?: SputumSampleReportEntry[];
            leprosyReports?: LeprosyReportEntry[];
            waterTclReports?: WaterTclReportEntry[];
            nationalProgramsReviewReports?: NationalProgramsReviewEntry[];
            entomologicalReports?: EntomologicalReportEntry[];
            bloodSampleMonthlyReports?: BloodSampleMonthlyReportEntry[];
            bloodSlideReports?: BloodSlideReportEntry[];
            guppyFishReleasePlacesReports?: GuppyFishReleasePlacesReportEntry[];
            reportPeriod?: ReportPeriod;
            atpPlans?: AtpPlan[];
          };
          if (saved.profile) {
            setProfile({
              ...emptyProfile,
              ...saved.profile,
               villages: Array.isArray(saved.profile.villages) ? saved.profile.villages.map((village) => ({
                 ...village,
                 householdCount: village.householdCount ?? '',
               })) : [],
              gmail: saved.profile.gmail ?? saved.profile.email ?? '',
            });
          } else if (Array.isArray(saved.people)) {
            const previousUser = saved.people.find((person) => person.kind === 'team') ?? saved.people[0];
            if (previousUser) {
              setProfile({
                name: previousUser.name ?? '',
                avatarUri: '',
                district: '',
                taluka: '',
                primaryHealthCenter: '',
                subCenter: '',
                villages: [],
                bsCode: '',
                phone: previousUser.phone ?? '',
                gmail: previousUser.email ?? '',
              });
            }
          }
          if (Array.isArray(saved.entries)) setEntries(saved.entries);
          if (Array.isArray(saved.deathReports)) setDeathReports(saved.deathReports);
          if (Array.isArray(saved.cataractReports)) {
            setCataractReports(saved.cataractReports.map((entry) => ({
              ...entry,
              searchDate: entry.searchDate ?? entry.surgeryDate ?? '',
            })));
          }
          if (Array.isArray(saved.cataractSurgeryReports)) setCataractSurgeryReports(saved.cataractSurgeryReports);
          if (Array.isArray(saved.sputumSampleReports)) setSputumSampleReports(saved.sputumSampleReports);
          if (Array.isArray(saved.leprosyReports)) setLeprosyReports(saved.leprosyReports);
          if (Array.isArray(saved.waterTclReports)) setWaterTclReports(saved.waterTclReports);
          if (Array.isArray(saved.nationalProgramsReviewReports)) setNationalProgramsReviewReports(saved.nationalProgramsReviewReports);
          if (Array.isArray(saved.entomologicalReports)) setEntomologicalReports(saved.entomologicalReports);
          if (Array.isArray(saved.bloodSampleMonthlyReports)) setBloodSampleMonthlyReports(saved.bloodSampleMonthlyReports);
          if (Array.isArray(saved.bloodSlideReports)) setBloodSlideReports(saved.bloodSlideReports);
          if (Array.isArray(saved.guppyFishReleasePlacesReports)) setGuppyFishReleasePlacesReports(saved.guppyFishReleasePlacesReports);
          if (Array.isArray(saved.atpPlans)) setAtpPlans(saved.atpPlans);
          if (saved.reportPeriod && Number.isInteger(saved.reportPeriod.month) && saved.reportPeriod.month >= 1 && saved.reportPeriod.month <= 12 && Number.isInteger(saved.reportPeriod.year)) {
            setReportPeriod(saved.reportPeriod);
          }
        }
      } catch {
        // The in-memory starter data remains usable if storage is unavailable.
      } finally {
        setHydrated(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, entries, deathReports, cataractReports, cataractSurgeryReports, sputumSampleReports, leprosyReports, waterTclReports, nationalProgramsReviewReports, entomologicalReports, bloodSampleMonthlyReports, bloodSlideReports, guppyFishReleasePlacesReports, reportPeriod, atpPlans }));
  }, [profile, entries, deathReports, cataractReports, cataractSurgeryReports, sputumSampleReports, leprosyReports, waterTclReports, nationalProgramsReviewReports, entomologicalReports, bloodSampleMonthlyReports, bloodSlideReports, guppyFishReleasePlacesReports, reportPeriod, atpPlans, hydrated]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      profile,
      entries,
      deathReports,
      cataractReports,
      cataractSurgeryReports,
      sputumSampleReports,
      leprosyReports,
      waterTclReports,
      nationalProgramsReviewReports,
      entomologicalReports,
      bloodSampleMonthlyReports,
      bloodSlideReports,
      guppyFishReleasePlacesReports,
      reportPeriod,
      atpPlans,
      hydrated,
      addEntry: (entry) =>
        setEntries((current) => [
          {
            ...entry,
            id: makeId('entry'),
            date: entry.date ?? new Date().toISOString().slice(0, 10),
          },
          ...current,
        ]),
      updateEntry: (id, changes) =>
        setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))),
      toggleEntry: (id) =>
        setEntries((current) =>
          current.map((entry) => (entry.id === id ? { ...entry, done: !entry.done } : entry)),
        ),
      removeEntry: (id) => setEntries((current) => current.filter((entry) => entry.id !== id)),
      addDeathReport: (report) => setDeathReports((current) => [...current, { ...report, id: makeId('death') }]),
      updateDeathReport: (id, report) => setDeathReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeDeathReport: (id) => setDeathReports((current) => current.filter((report) => report.id !== id)),
      addCataractReport: (report) => setCataractReports((current) => [...current, { ...report, id: makeId('cataract') }]),
      updateCataractReport: (id, report) => setCataractReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeCataractReport: (id) => setCataractReports((current) => current.filter((report) => report.id !== id)),
      addCataractSurgeryReport: (report) => setCataractSurgeryReports((current) => [...current, { ...report, id: makeId('cataract-surgery') }]),
      updateCataractSurgeryReport: (id, report) => setCataractSurgeryReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeCataractSurgeryReport: (id) => setCataractSurgeryReports((current) => current.filter((report) => report.id !== id)),
      addSputumSampleReport: (report) => setSputumSampleReports((current) => [...current, { ...report, id: makeId('sputum') }]),
      updateSputumSampleReport: (id, report) => setSputumSampleReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeSputumSampleReport: (id) => setSputumSampleReports((current) => current.filter((report) => report.id !== id)),
      addLeprosyReport: (report) => setLeprosyReports((current) => [...current, { ...report, id: makeId('leprosy') }]),
      updateLeprosyReport: (id, report) => setLeprosyReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeLeprosyReport: (id) => setLeprosyReports((current) => current.filter((report) => report.id !== id)),
      addWaterTclReport: (report) => setWaterTclReports((current) => [...current, { ...report, id: makeId('water-tcl') }]),
      updateWaterTclReport: (id, report) => setWaterTclReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeWaterTclReport: (id) => setWaterTclReports((current) => current.filter((report) => report.id !== id)),
      addNationalProgramsReviewReport: (report) => setNationalProgramsReviewReports((current) => [...current, { ...report, id: makeId('national-programs-review') }]),
      updateNationalProgramsReviewReport: (id, report) => setNationalProgramsReviewReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeNationalProgramsReviewReport: (id) => setNationalProgramsReviewReports((current) => current.filter((report) => report.id !== id)),
      addEntomologicalReport: (report) => setEntomologicalReports((current) => [...current, { ...report, id: makeId('entomological') }]),
      updateEntomologicalReport: (id, report) => setEntomologicalReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeEntomologicalReport: (id) => setEntomologicalReports((current) => current.filter((report) => report.id !== id)),
      addBloodSampleMonthlyReport: (report) => setBloodSampleMonthlyReports((current) => [...current, { ...report, id: makeId('blood-sample-monthly') }]),
      updateBloodSampleMonthlyReport: (id, report) => setBloodSampleMonthlyReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeBloodSampleMonthlyReport: (id) => setBloodSampleMonthlyReports((current) => current.filter((report) => report.id !== id)),
      addBloodSlideReport: (report) => setBloodSlideReports((current) => [...current, { ...report, id: makeId('blood-slide') }]),
      updateBloodSlideReport: (id, report) => setBloodSlideReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeBloodSlideReport: (id) => setBloodSlideReports((current) => current.filter((report) => report.id !== id)),
      addGuppyFishReleasePlacesReport: (report) => setGuppyFishReleasePlacesReports((current) => [...current, { ...report, id: makeId('guppy-fish-release') }]),
      updateGuppyFishReleasePlacesReport: (id, report) => setGuppyFishReleasePlacesReports((current) => current.map((entry) => (entry.id === id ? { ...report, id } : entry))),
      removeGuppyFishReleasePlacesReport: (id) => setGuppyFishReleasePlacesReports((current) => current.filter((report) => report.id !== id)),
      updateReportPeriod: (period) => setReportPeriod(period),
      updateAtpPlan: (plan) => setAtpPlans((current) => {
        const existingIndex = current.findIndex((item) => item.month === plan.month && item.year === plan.year);
        if (existingIndex === -1) return [...current, plan];
        const next = [...current];
        next[existingIndex] = plan;
        return next;
      }),
      updateProfile: (nextProfile) => setProfile(nextProfile),
    }),
    [atpPlans, bloodSampleMonthlyReports, bloodSlideReports, cataractReports, cataractSurgeryReports, deathReports, entomologicalReports, entries, guppyFishReleasePlacesReports, hydrated, leprosyReports, nationalProgramsReviewReports, profile, reportPeriod, sputumSampleReports, waterTclReports],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used within AppDataProvider');
  return value;
}