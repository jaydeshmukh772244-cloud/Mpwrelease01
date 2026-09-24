import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Profile, Village, useAppData } from '@/context/AppDataContext';
import { useColors } from '@/hooks/useColors';

export default function PeopleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAppData();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [primaryHealthCenter, setPrimaryHealthCenter] = useState('');
  const [subCenter, setSubCenter] = useState('');
  const [villages, setVillages] = useState<Village[]>([]);
  const [bsCode, setBsCode] = useState('');
  const [phone, setPhone] = useState('');
  const [gmail, setGmail] = useState('');

  useEffect(() => {
    setName(profile.name);
    setAvatarUri(profile.avatarUri);
    setDistrict(profile.district);
    setTaluka(profile.taluka);
    setPrimaryHealthCenter(profile.primaryHealthCenter);
    setSubCenter(profile.subCenter);
    setVillages(profile.villages);
    setBsCode(profile.bsCode);
    setPhone(profile.phone);
    setGmail(profile.gmail);
  }, [profile]);

  const updateVillage = (id: string, field: 'name' | 'population' | 'householdCount', value: string) => {
    setVillages((current) => current.map((village) => (village.id === id ? { ...village, [field]: value } : village)));
  };

  const addVillage = () => {
    setVillages((current) => [...current, { id: `village-${Date.now()}-${current.length}`, name: '', population: '', householdCount: '' }]);
  };

  const removeVillage = (id: string) => {
    setVillages((current) => current.filter((village) => village.id !== id));
  };

  const makeProfile = (nextAvatarUri = avatarUri): Profile => ({
    name: name.trim(),
    avatarUri: nextAvatarUri,
    district: district.trim(),
    taluka: taluka.trim(),
    primaryHealthCenter: primaryHealthCenter.trim(),
    subCenter: subCenter.trim(),
    villages: villages.map((village) => ({
      ...village,
      name: village.name.trim(),
      population: village.population.trim(),
      householdCount: village.householdCount.trim(),
    })),
    bsCode: bsCode.trim(),
    phone: phone.trim(),
    gmail: gmail.trim(),
  });

  const pickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      const asset = result.canceled || !result.assets ? null : result.assets[0];
      if (!result.canceled && asset?.uri) {
        const savedUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setAvatarUri(savedUri);
        updateProfile(makeProfile(savedUri));
      }
    } catch {
      Alert.alert('फोटो निवडता आला नाही', 'कृपया पुन्हा प्रयत्न करा.');
    }
  };

  const removeProfilePicture = () => {
    setAvatarUri('');
  };

  const saveProfile = () => {
    if (!name.trim()) {
      Alert.alert('माहिती अपुरी आहे', 'कृपया तुमचे पूर्ण नाव लिहा.');
      return;
    }
    updateProfile(makeProfile());
    Alert.alert('प्रोफाइल जतन झाले', 'तुमची माहिती यशस्वीपणे जतन झाली.');
  };

  const initial = name.trim().slice(0, 1) || 'आ';
  const locationLine = [district.trim(), taluka.trim()].filter(Boolean).join(' · ');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat bottomOffset={20} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }}>
        <ScreenHeader eyebrow="आरोग्य सेवकाची माहिती" title="माझी माहिती" subtitle="तुमच्या कार्यक्षेत्राची आणि संपर्काची माहिती येथे जतन करा." />
        <View style={styles.body}>
          <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="प्रोफाइल फोटो निवडा" onPress={pickProfilePicture} style={styles.avatarPressable}>
              <View style={styles.profileAvatar}>
                {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.profileAvatarImage} accessibilityLabel="प्रोफाइल फोटो" /> : <Text style={styles.profileAvatarText}>{initial}</Text>}
                <View style={styles.photoBadge}><Feather name="camera" size={12} color="#FFFFFF" /></View>
              </View>
            </Pressable>
            <View style={styles.profileCopy}>
              <Text style={styles.profileEyebrow}>सध्याचे प्रोफाइल</Text>
              <Text style={styles.profileName}>{name.trim() || 'तुमचे नाव'}</Text>
              <Text style={styles.profileRole}>{locationLine || 'जिल्हा आणि तालुका नमूद करा'}</Text>
            </View>
            <Feather name="user" size={24} color="#D8E3FF" />
          </View>
          <View style={styles.photoActions}>
            <Pressable onPress={pickProfilePicture} style={({ pressed }) => [styles.photoAction, { borderColor: colors.border, backgroundColor: pressed ? colors.secondary : colors.card }]}><Feather name={avatarUri ? 'refresh-cw' : 'image'} size={15} color={colors.primary} /><Text style={[styles.photoActionText, { color: colors.primary }]}>{avatarUri ? 'फोटो बदला' : 'प्रोफाइल फोटो निवडा'}</Text></Pressable>
            {avatarUri ? <Pressable onPress={removeProfilePicture} style={({ pressed }) => [styles.removePhotoAction, { opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.removePhotoText, { color: colors.destructive }]}>फोटो काढा</Text></Pressable> : null}
          </View>
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>मूलभूत माहिती</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>पूर्ण नाव *</Text>
            <TextInput value={name} onChangeText={setName} placeholder="उदा. अमोल देशमुख" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>जिल्हा</Text>
            <TextInput value={district} onChangeText={setDistrict} placeholder="उदा. पुणे" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>तालुका</Text>
            <TextInput value={taluka} onChangeText={setTaluka} placeholder="उदा. हवेली" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>प्राथमिक आरोग्य केंद्र</Text>
            <TextInput value={primaryHealthCenter} onChangeText={setPrimaryHealthCenter} placeholder="प्राथमिक आरोग्य केंद्राचे नाव" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>उपकेंद्र</Text>
            <TextInput value={subCenter} onChangeText={setSubCenter} placeholder="उपकेंद्राचे नाव" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>BS Code</Text>
            <TextInput value={bsCode} onChangeText={setBsCode} placeholder="BS Code" autoCapitalize="characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
          </View>
          <View style={[styles.villageSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionTitleCopy}>
                <Text style={[styles.formTitle, { color: colors.foreground }]}>गाव, लोकसंख्या आणि घरांची संख्या</Text>
                <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>किटकशास्त्रीय अहवालासाठी प्रत्येक गावाची एकूण घरांची संख्या येथे भरा.</Text>
              </View>
              <View style={[styles.villageCount, { backgroundColor: colors.secondary }]}><Text style={[styles.villageCountText, { color: colors.primary }]}>{villages.length}</Text></View>
            </View>
            {villages.map((village, index) => (
              <View key={village.id} style={[styles.villageRow, { borderColor: colors.border }]}>
                <View style={[styles.villageNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.villageNumberText, { color: colors.primary }]}>{index + 1}</Text></View>
                <View style={styles.villageInputs}>
                  <TextInput value={village.name} onChangeText={(value) => updateVillage(village.id, 'name', value)} placeholder="गावाचे नाव" placeholderTextColor={colors.mutedForeground} style={[styles.villageInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
                  <TextInput value={village.population} onChangeText={(value) => updateVillage(village.id, 'population', value)} placeholder="लोकसंख्या" keyboardType="numeric" placeholderTextColor={colors.mutedForeground} style={[styles.villageInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
                  <TextInput value={village.householdCount} onChangeText={(value) => updateVillage(village.id, 'householdCount', value)} placeholder="एकूण घरे" keyboardType="numeric" placeholderTextColor={colors.mutedForeground} style={[styles.villageInput, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`${index + 1} क्रमांकाचे गाव हटवा`} onPress={() => removeVillage(village.id)} hitSlop={10} style={styles.removeVillage}><Feather name="trash-2" size={17} color={colors.destructive} /></Pressable>
              </View>
            ))}
            <Pressable accessibilityRole="button" testID="add-village" onPress={addVillage} style={({ pressed }) => [styles.addVillageButton, { borderColor: colors.primary, backgroundColor: pressed ? colors.secondary : 'transparent' }]}><Feather name="plus" size={17} color={colors.primary} /><Text style={[styles.addVillageText, { color: colors.primary }]}>गाव जोडा</Text></Pressable>
          </View>
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>संपर्क माहिती</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>मोबाईल नंबर</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="मोबाईल नंबर" keyboardType="phone-pad" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Gmail</Text>
            <TextInput value={gmail} onChangeText={setGmail} placeholder="तुमचा Gmail पत्ता" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.input, color: colors.foreground }]} />
            <Pressable testID="save-profile" onPress={saveProfile} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><Feather name="save" size={17} color="#FFFFFF" /><Text style={styles.saveText}>प्रोफाइल जतन करा</Text></Pressable>
          </View>
          <View style={[styles.infoBanner, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>ही माहिती फक्त अॅप वापरणाऱ्या तुमच्या प्रोफाइलसाठी आहे.</Text>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20 },
  profileCard: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPressable: { borderRadius: 20 },
  profileAvatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  profileAvatarImage: { width: '100%', height: '100%', borderRadius: 20 },
  profileAvatarText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 25 },
  photoBadge: { position: 'absolute', right: -4, bottom: -4, width: 23, height: 23, borderRadius: 8, backgroundColor: '#1F55D5', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  profileCopy: { flex: 1 },
  profileEyebrow: { color: '#C9D7FF', fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.7 },
  profileName: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 5 },
  profileRole: { color: '#E0E8FF', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  photoActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: -6, marginBottom: 16 },
  photoAction: { minHeight: 36, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  photoActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  removePhotoAction: { paddingVertical: 8 },
  removePhotoText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  form: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  formTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 12 },
  villageSection: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  sectionTitleCopy: { flex: 1 },
  sectionHint: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: -9, marginBottom: 13, paddingRight: 8 },
  villageCount: { minWidth: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  villageCountText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  villageRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 11 },
  villageNumber: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  villageNumberText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  villageInputs: { flex: 1, flexDirection: 'row', gap: 7 },
  villageInput: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 9, fontFamily: 'Inter_400Regular', fontSize: 12 },
  removeVillage: { paddingLeft: 8 },
  addVillageButton: { height: 42, borderWidth: 1, borderRadius: 12, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 11 },
  addVillageText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  saveButton: { height: 45, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  infoBanner: { borderRadius: 15, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});