// src/app/(tabs)/profile.tsx — профиль + фильтр
import AddressPicker from '@/components/address-picker';
import ImagePickerWithCrop from '@/components/image-picker';
import MultiSelect from '@/components/multi-select';
import PageLayout from '@/components/page-layout';
import {AVAILABLE_LANGUAGES} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useAuthStore, useCategoriesStore, useFilterStore, useProfileStore} from '@/stores';
import {useSettingsStore} from '@/stores/settingsStore';
import * as Location from 'expo-location';
import {router} from 'expo-router';
import {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Avatar, Button, SegmentedButtons, Surface, Text, TextInput, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const theme = useTheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const profile = useAuthStore((state) => state.profile);
  const filter = useAuthStore((state) => state.filter);
  const categories = useCategoriesStore((state) => state.categories);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);
  const {saveProfile, isUpdating: isProfileUpdating} = useProfileStore();
  const {saveFilter, isUpdating: isFilterUpdating} = useFilterStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'filter' | 'settings'>('profile');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setLanguages(profile.languages ?? ['ru', 'en']);
    setBio(profile.bio ?? '');
    setAvatarUri(profile.avatar_url ?? null);
  }, [profile]);

  // ─── Профиль ─────────────────────────────────────────────────
  const [name, setName] = useState(profile?.name ?? '');
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? ['ru', 'en']);
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);

  // ─── Модал выбора источника ────────────────────────────

  // ─── Фильтр ──────────────────────────────────────────────────
  const [filterAddress, setFilterAddress] = useState('Москва');
  const [radius, setRadius] = useState(String(filter?.radius ?? 10));
  const [selectedCategories, setSelectedCategories] = useState<number[]>(filter?.categories ?? []);

  useEffect(() => {
    console.log(profile)
    if (filter?.radius != null) {
      setRadius(String(filter.radius));
    }
    if (filter?.categories) {
      setSelectedCategories(filter.categories);
    }
  }, [filter]);

  const handleSaveProfile = async () => {
    const message = await saveProfile({
      name,
      avatar_url: avatarUri,
      languages,
      bio,
    });

    if (message) {
      alert(message);
    }
  };

  const handleSaveFilter = async () => {
    const nextRadius = Number(radius) || 10;
    const message = await saveFilter({
      address: filterAddress.trim() || 'Москва',
      radius: nextRadius,
      categories: selectedCategories,
    });

    if (message) {
      alert(message);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Нет доступа к геолокации');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const parts = [
        address.street,
        address.streetNumber,
        address.district,
        address.city,
        address.region,
        address.country,
      ].filter(Boolean);
      setFilterAddress(parts.join(', ') || String(position.coords.latitude) + ', ' + String(position.coords.longitude));
    } catch (e) {
      alert('Не удалось определить местоположение');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  // ─── Аватар ────────────────────────────────────────────
  const handleAvatarSelected = async (uri: string) => {
    setAvatarUri(uri);
  };

  const insets = useSafeAreaInsets();
  console.log(avatarUri)
  return (
      <PageLayout title="Профиль">
        <View style={styles.screen}>
          <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.flex}
          >
            <ScrollView
                contentContainerStyle={[
                  styles.content,
                  {paddingTop: Spacing.three, paddingBottom: Spacing.five + insets.bottom},
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

              <Surface elevation={2} style={styles.profileCard}>
                <ImagePickerWithCrop
                    aspect={[1, 1]}
                    onImageSelected={handleAvatarSelected}
                    title="Выберите аватар"
                    maxWidth={300}
                    quality={0.8}
                >
                  {({open}) => (
                      <Pressable onPress={open} style={styles.avatarRow}>
                        {avatarUri ? (
                            <Avatar.Image
                                size={80}
                                source={{uri: avatarUri}}
                                style={styles.authorAvatar}
                            />
                        ) : (
                            <Avatar.Text
                                size={80}
                                label={name.charAt(0).toUpperCase()}
                                style={styles.authorAvatar}
                                labelStyle={styles.avatarLabel}
                            />
                        )}
                      </Pressable>
                  )}
                </ImagePickerWithCrop>
                <View style={styles.profileInfo}>
                  <Text variant="titleMedium" style={styles.profileName}>
                    {name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.profileSubtitle} numberOfLines={2}>
                    {bio || 'Расскажите о себе...'}
                  </Text>
                </View>
              </Surface>

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

                    <Button
                        mode="contained"
                        onPress={handleSaveProfile}
                        loading={isProfileUpdating}
                        disabled={isProfileUpdating}
                    >
                      Сохранить профиль
                    </Button>
                  </View>
              )}

              {activeTab === 'filter' && (
                  <View style={styles.tabContent}>
                      <AddressPicker
                          label="Адрес"
                          placeholder="Москва"
                          value={filterAddress}
                          onChangeText={setFilterAddress}
                          onUseCurrentLocation={handleUseCurrentLocation}
                          locationLoading={locationLoading}
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
                        options={categories.map((cat) => ({
                          code: cat.id,
                          label: cat.title,
                        }))}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSaveFilter}
                        loading={isFilterUpdating}
                        disabled={isFilterUpdating}
                    >
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
        </View>
      </PageLayout>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  screen: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  content: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  profileCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: '#FFFFFF',
  },
  avatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.four,
  },
  profileInfo: {
    gap: Spacing.one,
  },
  authorAvatar: {
    backgroundColor: '#E8EAF6',
  },
  avatarLabel: {
    color: '#1F2937',
    fontWeight: '700',
  },
  profileName: {
    fontWeight: '700',
  },
  profileSubtitle: {
    color: '#6A6A6A',
  },
  section: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    marginBottom: Spacing.four,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9F2',
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
    width: '100%',
  },
});
