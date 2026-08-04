// src/app/(tabs)/profile.tsx — профиль + фильтр
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Avatar, Button, SegmentedButtons, Surface, Text, TextInput, useTheme} from 'react-native-paper';

import MultiSelect from '@/components/multi-select';
import PageLayout from '@/components/page-layout';
import PhoneInput from '@/components/phone-input';
import {AVAILABLE_LANGUAGES, MOCK_CATEGORIES, MOCK_FILTER, MOCK_PROFILE,} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useSettingsStore} from '@/stores/settingsStore';

export default function ProfileScreen() {
  const theme = useTheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const [activeTab, setActiveTab] = useState<'profile' | 'filter' | 'settings'>('profile');

  // ─── Профиль ─────────────────────────────────────────────────
  const [name, setName] = useState(MOCK_PROFILE.name);
  const [phone, setPhone] = useState(MOCK_PROFILE.phone ?? '');
  const [countryPhoneCode, setCountryPhoneCode] = useState(
      MOCK_PROFILE.country_phone_code ?? '+7',
  );
  const [countryPhoneIso, setCountryPhoneIso] = useState(
      MOCK_PROFILE.country_phone_iso ?? 'RU',
  );
  const [languages, setLanguages] = useState<string[]>(
      MOCK_PROFILE.languages ?? ['ru', 'en'],
  );
  const [bio, setBio] = useState(MOCK_PROFILE.bio ?? '');

  // ─── Фильтр ──────────────────────────────────────────────────
  const [filterAddress, setFilterAddress] = useState('Москва');
  const [radius, setRadius] = useState(String(MOCK_FILTER.radius ?? 10));
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
      MOCK_FILTER.categories ?? [],
  );

  const handleSaveProfile = () => {
    console.log('Сохраняем профиль:', {name, phone, countryPhoneCode, countryPhoneIso, languages, bio});
  };

  const handleSaveFilter = () => {
    console.log('Сохраняем фильтр:', {address: filterAddress, radius: Number(radius), categories: selectedCategories});
  };

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  return (
      <PageLayout title="Профиль">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
        >
          <ScrollView
              contentContainerStyle={[
                styles.content,
                {paddingTop: Spacing.three, paddingBottom: 100},
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >

            {/* Аватар */}
            <View style={styles.avatarRow}>
              <Avatar.Text
                  size={80}
                  label={name.charAt(0).toUpperCase()}
                  style={{backgroundColor: theme.colors.primary}}
              />
            </View>

            {/* Единая карточка с табами */}
            <Surface elevation={2} style={styles.section}>
              <SegmentedButtons
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as 'profile' | 'filter' | 'settings')}
                  style={styles.segmented}
                  buttons={[
                    {value: 'profile', label: 'Личная информация'},
                    {value: 'filter', label: 'Фильтр'},
                    {value: 'settings', label: 'Настройки'},
                  ]}
              />

              {activeTab === 'profile' && (
                  <View style={styles.tabContent}>
                    <TextInput
                        mode="outlined"
                        label="Имя"
                        value={name}
                        onChangeText={setName}
                    />

                    <PhoneInput
                        value={phone}
                        onChangeText={setPhone}
                        defaultCountryCode={countryPhoneCode}
                        onCountryCodeChange={(_, iso) => setCountryPhoneIso(iso)}
                    />

                    <TextInput
                        mode="outlined"
                        label="ISO"
                        value={countryPhoneIso}
                        onChangeText={setCountryPhoneIso}
                        style={styles.isoInput}
                    />

                    <MultiSelect
                        label="Языки"
                        options={AVAILABLE_LANGUAGES}
                        selected={languages}
                        onChange={setLanguages}
                    />

                    <TextInput
                        mode="outlined"
                        label="О себе"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={3}
                        placeholder="Расскажите о себе..."
                    />

                    <Button mode="contained" onPress={handleSaveProfile}>
                      Сохранить профиль
                    </Button>
                  </View>
              )}

              {activeTab === 'filter' && (
                  <View style={styles.tabContent}>
                    <TextInput
                        mode="outlined"
                        label="Адрес"
                        value={filterAddress}
                        onChangeText={setFilterAddress}
                        placeholder="Москва"
                    />

                    <TextInput
                        mode="outlined"
                        label="Радиус (км)"
                        value={radius}
                        onChangeText={setRadius}
                        keyboardType="numeric"
                        placeholder="10"
                    />

                    {/* Категории фильтра */}
                    <MultiSelect
                        label="Категории"
                        options={MOCK_CATEGORIES.map((cat) => ({
                          code: cat.id,
                          label: cat.title,
                        }))}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                    />

                    <Button mode="contained" onPress={handleSaveFilter}>
                      Сохранить фильтр
                    </Button>
                  </View>
              )}

              {activeTab === 'settings' && (
                  <View style={styles.tabContent}>
                    <Text variant="labelLarge" style={styles.sectionTitle}>
                      Тема приложения
                    </Text>
                    <SegmentedButtons
                        value={themeMode}
                        onValueChange={(v) => setThemeMode(v as 'light' | 'dark' | 'system')}
                        style={styles.segmented}
                        buttons={[
                          {value: 'system', label: 'Система'},
                          {value: 'light', label: 'Светлая'},
                          {value: 'dark', label: 'Тёмная'},
                        ]}
                    />
                  </View>
              )}
            </Surface>

            {/* Выход */}
            <Button
                mode="outlined"
                textColor={theme.colors.error}
                onPress={handleLogout}
                style={styles.logoutBtn}
            >
              Выйти
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </PageLayout>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  avatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.four,
  },
  section: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  segmented: {marginBottom: Spacing.two},
  sectionTitle: {
    fontWeight: '700',
    paddingBottom: Spacing.one,
  },
  tabContent: {
    gap: Spacing.three,
  },
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  codeInput: {flex: 2},
  isoInput: {flex: 1},
  logoutBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});
