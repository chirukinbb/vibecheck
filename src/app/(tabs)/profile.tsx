// src/app/(tabs)/profile.tsx — профиль + фильтр
import MultiSelect from '@/components/multi-select';
import PageLayout from '@/components/page-layout';
import PhoneInput from '@/components/phone-input';
import {AVAILABLE_LANGUAGES, MOCK_CATEGORIES, MOCK_FILTER, MOCK_PROFILE,} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useSettingsStore} from '@/stores/settingsStore';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Avatar, Button, SegmentedButtons, Surface, TextInput, useTheme} from 'react-native-paper';
import * as Location from 'expo-location';

export default function ProfileScreen() {
  const theme = useTheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const [activeTab, setActiveTab] = useState<'profile' | 'filter' | 'settings'>('profile');
  const [locationLoading, setLocationLoading] = useState(false);

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
  const [avatarUri, setAvatarUri] = useState<string | null>(MOCK_PROFILE.avatar);

  // ─── Модал выбора источника ────────────────────────────
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // ─── Фильтр ──────────────────────────────────────────────────
  const [filterAddress, setFilterAddress] = useState('Москва');
  const [radius, setRadius] = useState(String(MOCK_FILTER.radius ?? 10));
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
      MOCK_FILTER.categories ?? [],
  );

  const handleSaveProfile = () => {
    console.log('Сохраняем профиль:', {
      name,
      phone,
      countryPhoneCode,
      countryPhoneIso,
      languages,
      bio,
      avatar: avatarUri
    });
  };

  const handleSaveFilter = () => {
    console.log('Сохраняем фильтр:', {address: filterAddress, radius: Number(radius), categories: selectedCategories});
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
  const handleAvatarPress = () => setAvatarModalVisible(true);

  const handlePickFromGallery = async () => {
    setAvatarModalVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await convertToWebPAndSetAvatar(result.assets[0].uri);
      }
    } catch (e: any) {
      console.warn('Ошибка выбора изображения:', e);
    }
  };

  const handleTakePhoto = async () => {
    setAvatarModalVisible(false);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await convertToWebPAndSetAvatar(result.assets[0].uri);
      }
    } catch (e: any) {
      console.warn('Ошибка камеры:', e);
    }
  };

  const convertToWebPAndSetAvatar = async (imagePath: string) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
          imagePath,
          [{resize: {width: 300, height: 300}}],
          {format: ImageManipulator.SaveFormat.WEBP, compress: 0.8},
      );
      setAvatarUri(result.uri);
    } catch (e) {
      console.warn('Ошибка конвертации в WebP:', e);
    }
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
            <Pressable onPress={handleAvatarPress} style={styles.avatarRow}>
              {avatarUri ? (
                  <Avatar.Image
                      size={80}
                      source={{uri: avatarUri}}
                      style={{backgroundColor: theme.colors.primary}}
                  />
              ) : (
                  <Avatar.Text
                      size={80}
                      label={name.charAt(0).toUpperCase()}
                      style={{backgroundColor: theme.colors.primary}}
                  />
              )}
            </Pressable>

            {/* Модал выбора источника аватара — bottom sheet */}
            <Modal
                visible={avatarModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAvatarModalVisible(false)}
            >
              <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setAvatarModalVisible(false)}
              >
                <Pressable style={styles.modalSheet} onPress={() => {
                }}>
                  <View style={styles.sheetHandle}/>
                  <Text style={styles.modalTitle}>Выберите аватар</Text>
                  <Button
                      mode="contained"
                      onPress={handlePickFromGallery}
                      style={styles.modalButton}
                      icon="image"
                  >
                    Галерея
                  </Button>
                  <Button
                      mode="contained"
                      onPress={handleTakePhoto}
                      style={styles.modalButton}
                      icon="camera"
                  >
                    Камера
                  </Button>
                </Pressable>
              </Pressable>
            </Modal>

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
                        right={
                          <TextInput.Icon
                              icon="crosshairs-gps"
                              onPress={handleUseCurrentLocation}
                              loading={locationLoading}
                          />
                        }
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.four,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  modalButton: {
    width: '100%',
  },
});
