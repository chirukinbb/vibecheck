// src/app/(tabs)/profile.tsx — профиль + фильтр
import AddressPicker from '@/components/address-picker';
import ImagePickerWithCrop from '@/components/image-picker';
import MultiSelect from '@/components/multi-select';
import PageLayout from '@/components/page-layout';
import {AVAILABLE_LANGUAGES} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {isFilterEmpty} from '@/lib/filter';
import {useAuthStore, useCategoriesStore, useFilterStore, useProfileStore} from '@/stores';
import {useSettingsStore} from '@/stores/settingsStore';
import * as Location from 'expo-location';
import {router, useLocalSearchParams} from 'expo-router';
import {useEffect, useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Avatar, Button, SegmentedButtons, Surface, Text, TextInput, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const theme = useTheme();
    const {redirectAfterSave} = useLocalSearchParams<{ redirectAfterSave?: string }>();
    const shouldRedirectToFeedAfterSave = redirectAfterSave === '1';
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
    const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [filterFeedback, setFilterFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        void fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (!profile) return;
        setName(profile.name ?? '');
        setLanguages(profile.languages ?? []);
        setBio(profile.bio ?? '');
    setAvatarUri(profile.avatar_url ?? null);
    }, [profile]);

    // ─── Профиль ─────────────────────────────────────────────────
    const [name, setName] = useState(profile?.name ?? '');
    const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
    const [bio, setBio] = useState(profile?.bio ?? '');
    const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);

    // ─── Фильтр ──────────────────────────────────────────────────
    const [filterAddress, setFilterAddress] = useState<[number, number]>(filter?.center ?? [0, 0]);
    const FIXED_FILTER_RADIUS = 10;
    const [radius, setRadius] = useState(String(filter?.radius ?? FIXED_FILTER_RADIUS));
    const [selectedCategories, setSelectedCategories] = useState<number[]>(filter?.categories ?? []);
    const isFilterTabMarked = isFilterEmpty(filter);

    const sanitizeDigits = (value: string) => value.replace(/\D/g, '');
    const areStringArraysEqual = (left: string[], right: string[]) => {
        if (left.length !== right.length) return false;
        return left.every((value, index) => value === right[index]);
    };
    const areNumberArraysEqual = (left: number[], right: number[]) => {
        const sortedLeft = [...left].sort((a, b) => a - b);
        const sortedRight = [...right].sort((a, b) => a - b);
        if (sortedLeft.length !== sortedRight.length) return false;
    return sortedLeft.every((value, index) => value === sortedRight[index]);
  };

  const hasProfileChanges =
      name !== (profile?.name ?? '') ||
      bio !== (profile?.bio ?? '') ||
      avatarUri !== (profile?.avatar_url ?? null) ||
      !areStringArraysEqual(languages, profile?.languages ?? []);

  const isProfileSaveDisabled = isProfileUpdating || !name.trim() || !hasProfileChanges;

  const hasFilterChanges =
      filterAddress[0] !== (filter?.center?.[0] ?? 0) ||
      filterAddress[1] !== (filter?.center?.[1] ?? 0) ||
      Number(radius) !== Number(filter?.radius ?? FIXED_FILTER_RADIUS) ||
      !areNumberArraysEqual(selectedCategories, filter?.categories ?? []);

  const isFilterSaveDisabled = isFilterUpdating || !radius.trim() || Number(radius) <= 0 || !hasFilterChanges;

  useEffect(() => {
    if (filter?.radius != null) {
        setRadius(String(filter.radius || FIXED_FILTER_RADIUS));
    }
    if (filter?.categories) {
      setSelectedCategories(filter.categories);
    }
  }, [filter]);

  const handleSaveProfile = async () => {
      setProfileFeedback(null);
      try {
          const message = await saveProfile({
              name,
              avatar_url: avatarUri,
              languages,
              bio,
          });

          if (message) {
              setProfileFeedback({type: 'success', text: String(message)});
          }
      } catch (e: any) {
          setProfileFeedback({type: 'error', text: e?.message ?? 'Ошибка при сохранении профиля'});
      }
  };

  const handleSaveFilter = async () => {
      const nextRadius = FIXED_FILTER_RADIUS;
      const wasFilterEmpty = isFilterEmpty(filter);
      setRadius(String(nextRadius));
      setFilterFeedback(null);
      try {
          const message = await saveFilter({
              center: filterAddress,
              radius: nextRadius,
              categories: selectedCategories,
          });

          if (message) {
              setFilterFeedback({type: 'success', text: String(message)});
          }

          const nextFilter = {
              center: filterAddress,
              radius: nextRadius,
              categories: selectedCategories,
          };

          if (wasFilterEmpty && !isFilterEmpty(nextFilter) && shouldRedirectToFeedAfterSave) {
              router.replace('/(tabs)');
          }
      } catch (e: any) {
          setFilterFeedback({type: 'error', text: e?.message ?? 'Ошибка при сохранении фильтра'});
      }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          setFilterFeedback({type: 'error', text: 'Нет доступа к геолокации'});
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setFilterAddress([Number(position.coords.latitude), Number(position.coords.longitude)] as [number, number]);
    } catch (e) {
        setFilterFeedback({type: 'error', text: 'Не удалось определить местоположение'});
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  const handleAvatarSelected = async (uri: string) => {
    setAvatarUri(uri);
  };

  const insets = useSafeAreaInsets();

  return (
      <PageLayout title="Профиль">
        <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
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

              <Surface
                  elevation={2}
                  style={[
                    styles.profileCard,
                    {backgroundColor: theme.colors.elevation.level2}
                  ]}
              >
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
                                style={[styles.authorAvatar, {backgroundColor: theme.colors.primaryContainer}]}
                            />
                        ) : (
                            <Avatar.Text
                                size={80}
                                label={name.charAt(0).toUpperCase()}
                                style={[styles.authorAvatar, {backgroundColor: theme.colors.primaryContainer}]}
                                labelStyle={[styles.avatarLabel, {color: theme.colors.onPrimaryContainer}]}
                            />
                        )}
                      </Pressable>
                  )}
                </ImagePickerWithCrop>
                <View style={styles.profileInfo}>
                  <Text variant="titleMedium" style={[styles.profileName, {color: theme.colors.onSurface}]}>
                    {name}
                  </Text>
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}} numberOfLines={2}>
                    {bio || 'Расскажите о себе...'}
                  </Text>
                </View>
              </Surface>

              {/* Единая карточка с табами */}
              <Surface
                  elevation={2}
                  style={[
                    styles.section,
                    {
                      backgroundColor: theme.colors.elevation.level2,
                      borderColor: theme.colors.outlineVariant,
                    }
                  ]}
              >
                <SegmentedButtons
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as 'profile' | 'filter' | 'settings')}
                    style={styles.segmented}
                    buttons={[
                        {value: 'profile', label: 'Профиль'},
                        {
                            value: 'filter',
                            label: isFilterTabMarked ? 'Фильтр ⚠' : 'Фильтр',
                        },
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
                            disabled={isProfileSaveDisabled}
                        >
                            Сохранить профиль
                        </Button>
                        {profileFeedback && (
                            <Text
                                style={[
                                    profileFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                                    {
                                        backgroundColor:
                                            profileFeedback.type === 'success'
                                                ? theme.colors.primaryContainer
                                                : theme.colors.errorContainer,
                                        color:
                                            profileFeedback.type === 'success'
                                                ? theme.colors.onPrimaryContainer
                                                : theme.colors.onErrorContainer,
                                    },
                                ]}
                            >
                                {profileFeedback.text}
                            </Text>
                        )}
                    </View>
                )}

                {activeTab === 'filter' && (
                    <View style={styles.tabContent}>
                      <AddressPicker
                          label="Адрес"
                          placeholder="Ввведите адрес"
                          value={filterAddress}
                          onChangeCoordinates={setFilterAddress}
                          onUseCurrentLocation={handleUseCurrentLocation}
                          locationLoading={locationLoading}
                      />

                        <TextInput
                            mode="outlined"
                            label="Радиус (км)"
                            value={String(FIXED_FILTER_RADIUS)}
                            onChangeText={(text) => setRadius(sanitizeDigits(text))}
                            keyboardType="numeric"
                            placeholder="10"
                            editable={false}
                            style={styles.hiddenRadiusInput}
                            pointerEvents="none"
                        />

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
                            disabled={isFilterSaveDisabled}
                        >
                            Сохранить фильтр
                        </Button>
                        {filterFeedback && (
                            <Text
                                style={[
                                    filterFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                                    {
                                        backgroundColor:
                                            filterFeedback.type === 'success'
                                                ? theme.colors.primaryContainer
                                                : theme.colors.errorContainer,
                                        color:
                                            filterFeedback.type === 'success'
                                                ? theme.colors.onPrimaryContainer
                                                : theme.colors.onErrorContainer,
                                    },
                                ]}
                            >
                                {filterFeedback.text}
                            </Text>
                        )}
                    </View>
                )}

                {activeTab === 'settings' && (
                    <View style={styles.tabContent}>
                      <Text variant="labelLarge" style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
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
                  style={[styles.logoutBtn, {borderColor: theme.colors.error}]}
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
  },
  avatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.four,
  },
  profileInfo: {
    gap: Spacing.one,
  },
  authorAvatar: {},
  avatarLabel: {
    fontWeight: '700',
  },
  profileName: {
    fontWeight: '700',
  },
  section: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  segmented: {marginBottom: Spacing.two},
  sectionTitle: {
      fontWeight: '700',
      paddingBottom: Spacing.one,
  },
    tabContent: {
        gap: Spacing.three,
    },
    logoutBtn: {
        marginTop: Spacing.two,
        width: '100%',
    },
    feedbackSuccess: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        textAlign: 'center',
    },
    feedbackError: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        textAlign: 'center',
    },
    hiddenRadiusInput: {
        display: 'none',
    },
});