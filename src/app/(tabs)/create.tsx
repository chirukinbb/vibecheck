// src/app/(tabs)/create.tsx — создание события
import DateTimePicker from '@/components/date-time-picker';
import * as Location from 'expo-location';
import {router} from 'expo-router';
import {useEffect, useState} from 'react';
import {Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Chip, Modal, Portal, Searchbar, Surface, TextInput, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AddressPicker from '@/components/address-picker';
import ImagePickerWithCrop from '@/components/image-picker';
import PageLayout from '@/components/page-layout';
import SingleSelect from '@/components/single-select';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useCategoriesStore, useEventsStore} from '@/stores';

export default function CreateEventScreen() {
  const theme = useTheme();
  const categories = useCategoriesStore((state) => state.categories);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);
  const addEvent = useEventsStore((state) => state.addEvent);
  const isMutating = useEventsStore((state) => state.isMutating);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  // GET /events возвращает события в сокращённом виде (без тегов),
  // поэтому подсказки тегов не извлекаются из списка. Пользователь вводит теги вручную.
  const SUGGESTED_TAGS: string[] = [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [planingTime, setPlaningTime] = useState<Date | null>(null);
  const [slots, setSlots] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const handleThumbnailSelected = (uri: string) => {
    setThumbnail(uri);
  };

  const handleSubmit = async () => {
    if (!title || !categoryId || !address || !slots || !planingTime) {
      return;
    }

    const saved = await addEvent({
      title,
      description,
      category_id: categoryId,
      address,
      planing_time: `${String(planingTime.getDate()).padStart(2, '0')}/${String(planingTime.getMonth() + 1).padStart(2, '0')}/${planingTime.getFullYear()} ${String(planingTime.getHours()).padStart(2, '0')}:${String(planingTime.getMinutes()).padStart(2, '0')}`,
      slots: Number(slots),
      tags,
      thumb_path: thumbnail ?? undefined,
    });

    if (saved) {
      router.back();
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
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const parts = [
        addr.street,
        addr.streetNumber,
        addr.district,
        addr.city,
        addr.region,
        addr.country,
      ].filter(Boolean);
      setAddress(parts.join(', ') || String(position.coords.latitude) + ', ' + String(position.coords.longitude));
    } catch (e) {
      alert('Не удалось определить местоположение');
    } finally {
      setLocationLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
      <PageLayout title="Новое событие">
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

              <Surface elevation={2} style={styles.form}>
                {/* Название */}
                <TextInput
                    mode="outlined"
                    label="Название"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Например: Йога на крыше"
                />

              {/* Описание */}
              <TextInput
                  mode="outlined"
                  label="Описание"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Расскажите подробнее о событии..."
              />

              {/* Категория */}
              <SingleSelect<number>
                  label="Категория"
                  options={categories.map((cat) => ({code: cat.id, label: cat.title}))}
                  selected={categoryId}
                  onChange={(v) => setCategoryId(v as number | null)}
              />

              {/* Адрес */}
              <AddressPicker
                  label="Адрес"
                  placeholder="ул. Тверская, 15"
                  value={address}
                  onChangeText={setAddress}
                  onUseCurrentLocation={handleUseCurrentLocation}
                  locationLoading={locationLoading}
              />

              {/* Дата */}
              <DateTimePicker
                  label="Дата и время"
                  value={planingTime}
                  onChange={(d) => setPlaningTime(d)}
              />

              {/* Места */}
              <TextInput
                  mode="outlined"
                  label="Количество мест"
                  value={slots}
                  onChangeText={setSlots}
                  keyboardType="numeric"
                  placeholder="20"
              />

              {/* Теги */}
              <View style={styles.tagField}>
                <Button
                    mode="outlined"
                    onPress={() => {
                      setTagQuery('');
                      setTagModalVisible(true);
                    }}
                    style={styles.tagSelectorButton}
                >
                  {tags.length > 0 ? `Теги (${tags.length})` : 'Выбрать теги'}
                </Button>

                <View style={styles.chipRow}>
                  {tags.map((tag) => (
                      <Chip
                          key={tag}
                          onPress={() => setTags(tags.filter((t) => t !== tag))}
                          style={styles.chip}
                          compact
                      >
                        #{tag}
                      </Chip>
                  ))}
                </View>

                <Portal>
                  <Modal
                      visible={tagModalVisible}
                      onDismiss={() => setTagModalVisible(false)}
                      contentContainerStyle={[
                        styles.modal,
                        {backgroundColor: theme.colors.surface},
                      ]}
                  >
                    <Searchbar
                        placeholder="Поиск тегов..."
                        value={tagQuery}
                        onChangeText={setTagQuery}
                        style={styles.searchbar}
                        autoFocus
                    />

                    <View style={styles.tagInputRow}>
                      <TextInput
                          mode="outlined"
                          label="Новый тег"
                          value={tagInput}
                          onChangeText={setTagInput}
                          placeholder="йога"
                          style={styles.tagTextInput}
                      />
                      <Button
                          mode="contained"
                          onPress={() => {
                            const nextTag = tagInput.trim();
                            if (!nextTag) return;
                            if (!tags.includes(nextTag)) {
                              setTags([...tags, nextTag]);
                            }
                            setTagInput('');
                          }}
                          style={styles.addTagButton}
                      >
                        Добавить
                      </Button>
                    </View>

                    <ScrollView style={styles.list} nestedScrollEnabled>
                      {SUGGESTED_TAGS.filter((tag) =>
                          tag.toLowerCase().includes(tagQuery.toLowerCase()),
                      ).map((tag) => {
                        const selected = tags.includes(tag);
                        return (
                            <Chip
                                key={tag}
                                mode={selected ? 'flat' : 'outlined'}
                                selected={selected}
                                onPress={() => {
                                  if (selected) {
                                    setTags(tags.filter((t) => t !== tag));
                                  } else {
                                    setTags([...tags, tag]);
                                  }
                                }}
                                style={styles.modalChip}
                                compact
                            >
                              #{tag}
                            </Chip>
                        );
                      })}
                    </ScrollView>

                    <Button
                        mode="contained"
                        onPress={() => setTagModalVisible(false)}
                        style={styles.doneButton}
                    >
                      Готово
                    </Button>
                  </Modal>
                </Portal>
              </View>

              {/* Обложка */}
              <View style={styles.coverRow}>
                {thumbnail ? (
                    <View style={styles.coverPreview}
                          accessible
                          accessibilityLabel="Обложка события"
                          accessibilityHint="Нажмите, чтобы выбрать другую обложку">
                      <Image source={{uri: thumbnail}} style={styles.coverImage}/>
                      <Button mode="text" onPress={() => setThumbnail(null)}>
                        ✕
                      </Button>
                    </View>
                ) : (
                    <ImagePickerWithCrop
                        aspect={[16, 9]}
                        onImageSelected={handleThumbnailSelected}
                        title="Выберите обложку"
                        maxWidth={1600}
                        quality={0.8}
                    >
                      {({open}) => (
                          <Button mode="outlined" onPress={open}>
                            Выбрать обложку
                          </Button>
                      )}
                    </ImagePickerWithCrop>
                )}
              </View>

                {/* Сабмит */}
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isMutating}
                    disabled={isMutating || !title || !categoryId || !address || !slots || !planingTime}
                    style={styles.submitBtn}
                >
                  Создать событие
                </Button>
              </Surface>
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
  form: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9F2',
  },
  tagField: {gap: Spacing.two},
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tagTextInput: {flex: 1},
  addTagButton: {alignSelf: 'flex-end'},
  tagSelectorButton: {alignSelf: 'flex-start'},
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  modal: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
  },
  searchbar: {marginBottom: 12},
  list: {maxHeight: 220, flexGrow: 0},
  modalChip: {borderRadius: Spacing.two, marginBottom: Spacing.two},
  chip: {borderRadius: Spacing.two},
  doneButton: {marginTop: 12, alignSelf: 'flex-end'},
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  coverPreview: {
    width: '100%',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  submitBtn: {marginTop: Spacing.two},
});
