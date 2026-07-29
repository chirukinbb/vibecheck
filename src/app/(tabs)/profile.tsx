// src/app/(tabs)/profile.tsx — профиль + фильтр
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Avatar, Button, Chip, Surface, Text, TextInput, useTheme,} from 'react-native-paper';

import PageLayout from '@/components/page-layout';
import {AVAILABLE_LANGUAGES, MOCK_CATEGORIES, MOCK_FILTER, MOCK_PROFILE,} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';

export default function ProfileScreen() {
  const theme = useTheme();

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

  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

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

            {/* Секция: Профиль */}
            <Surface elevation={2} style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Личные данные
              </Text>

              <TextInput
                  mode="outlined"
                  label="Имя"
                  value={name}
                  onChangeText={setName}
              />

              <TextInput
                  mode="outlined"
                  label="Телефон"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
              />

              <View style={styles.codeRow}>
                <TextInput
                    mode="outlined"
                    label="Код страны"
                    value={countryPhoneCode}
                    onChangeText={setCountryPhoneCode}
                    style={styles.codeInput}
                />
                <TextInput
                    mode="outlined"
                    label="ISO"
                    value={countryPhoneIso}
                    onChangeText={setCountryPhoneIso}
                    style={styles.isoInput}
                />
              </View>

              {/* Языки */}
              <Text variant="labelLarge">Языки</Text>
              <View style={styles.chipRow}>
                {AVAILABLE_LANGUAGES.map((lang) => (
                    <Chip
                        key={lang.code}
                        selected={languages.includes(lang.code)}
                        onPress={() => toggleLanguage(lang.code)}
                        showSelectedOverlay
                        style={styles.chip}
                    >
                      {lang.label}
                    </Chip>
                ))}
              </View>

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
            </Surface>

            {/* Секция: Фильтр */}
            <Surface elevation={2} style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Гео-фильтр
              </Text>

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
              <Text variant="labelLarge">Категории</Text>
              <View style={styles.chipRow}>
                {MOCK_CATEGORIES.map((cat) => (
                    <Chip
                        key={cat.id}
                        selected={selectedCategories.includes(cat.id)}
                        onPress={() => toggleCategory(cat.id)}
                        showSelectedOverlay
                        style={styles.chip}
                    >
                      {cat.title}
                    </Chip>
                ))}
              </View>

              <Button mode="contained" onPress={handleSaveFilter}>
                Сохранить фильтр
              </Button>
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
  sectionTitle: {
    fontWeight: '700',
    paddingBottom: Spacing.one,
  },
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  codeInput: {flex: 2},
  isoInput: {flex: 1},
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {borderRadius: Spacing.two},
  logoutBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});
