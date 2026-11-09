// src/app/(tabs)/create.tsx — создание события
import DateTimePicker from '@/components/date-time-picker';
import * as Location from 'expo-location';
import {router} from 'expo-router';
import {useEffect, useState} from 'react';
import {Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Surface, Text, TextInput, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AddressPicker, {Coordinates} from '@/components/address-picker';
import ImagePickerWithCrop from '@/components/image-picker';
import PageLayout from '@/components/page-layout';
import SegmentedToggle from '@/components/segmented-toggle';
import SingleSelect from '@/components/single-select';
import TagCloudInput from '@/components/tag-cloud-input';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useCategoriesStore, useEventsStore} from '@/stores';
import {useTagsStore} from "@/stores/tagsStore";

export default function CreateEventScreen() {
  const theme = useTheme();
  const categories = useCategoriesStore((state) => state.categories);
  const fetchCategories = useCategoriesStore((state) => state.fetchCategories);
  const addEvent = useEventsStore((state) => state.addEvent);
  const isMutating = useEventsStore((state) => state.isMutating);

  // Получение категорий тегов из useTagsStore
  const suggestedTags = useTagsStore((state) => state.categories);
  const fetchTags = useTagsStore((state) => state.fetchTags);

  useEffect(() => {
    void fetchCategories();
    if (typeof fetchTags === 'function') {
      void fetchTags();
    }
  }, [fetchCategories, fetchTags]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [planingTime, setPlaningTime] = useState<Date | null>(null);
  const [slots, setSlots] = useState('');
  const [condition, setCondition] = useState<'paid' | 'free'>('free');
  const [price, setPrice] = useState('');
  const [isPublic, setIsPublic] = useState<number>(1);
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

  const handleThumbnailSelected = (uri: string) => {
    setThumbnail(uri);
  };

  const handleSubmit = async () => {
    if (!title || !categoryId || !coordinates || !slots || !planingTime) {
      setFeedback({type: 'error', text: 'Заполните все обязательные поля'});
      return;
    }

    if (condition === 'paid' && (!price || Number(price) <= 0)) {
      setFeedback({type: 'error', text: 'Укажите цену для платного события'});
      return;
    }

    setFeedback(null);
    try {
      const saved = await addEvent({
        title,
        description,
        category_id: categoryId,
        address: coordinates,
        condition,
        price: condition === 'paid' ? Number(price) : 0,
        is_public: Number(isPublic),
        planing_time: planingTime ? Math.floor(planingTime.getTime() / 1000) : null,
        slots: Number(slots),
        tags,
        thumb_path: thumbnail ?? undefined,
      });
      if (saved) {
        setFeedback({type: 'success', text: 'Событие создано'});
        router.back();
      } else {
        setFeedback({type: 'error', text: 'Не удалось сохранить событие'});
      }
    } catch (e: any) {
      setFeedback({type: 'error', text: e?.message ?? 'Ошибка при создании события'});
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setFeedback({type: 'error', text: 'Нет доступа к геолокации'});
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates([position.coords.latitude, position.coords.longitude]);
    } catch (e) {
      setFeedback({type: 'error', text: 'Не удалось определить местоположение'});
    } finally {
      setLocationLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
      <PageLayout title="Новое событие">
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
                    styles.form,
                    {
                      backgroundColor: theme.colors.elevation.level2,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
              >
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
                    placeholder="Выберите адрес на карте"
                    value={coordinates}
                    onChangeCoordinates={(coords) => setCoordinates(coords)}
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
                    onChangeText={(text) => setSlots(sanitizeDigits(text))}
                    keyboardType="numeric"
                    placeholder="20"
                />

                {/* Тип события */}
                <View>
                  <Text variant="labelLarge" style={styles.toggleLabel}>Условия участия</Text>
                  <SegmentedToggle<'paid' | 'free'>
                      options={[
                        {label: 'Бесплатно', value: 'free'},
                        {label: 'Платно', value: 'paid'},
                      ]}
                      value={condition}
                      onChange={(v) => setCondition(v ?? 'free')}
                      style={styles.toggleRow}
                      buttonStyle={styles.toggleButton}
                  />
                </View>

                {condition === 'paid' && (
                    <TextInput
                        mode="outlined"
                        label="Цена, UAH"
                        value={price}
                        onChangeText={(text) => setPrice(sanitizeDigits(text))}
                        keyboardType="numeric"
                        placeholder="500"
                    />
                )}

                <View>
                  <Text variant="labelLarge" style={styles.toggleLabel}>Публичность</Text>
                  <SegmentedToggle<number>
                      options={[
                        {label: 'Публичное', value: 1},
                        {label: 'Приватное', value: 0},
                      ]}
                      value={Number(isPublic)}
                      onChange={(v) => setIsPublic(v ?? 1)}
                      style={styles.toggleRow}
                      buttonStyle={styles.toggleButton}
                  />
                </View>

                {/* Теги */}
                <TagCloudInput
                    value={tags}
                    onChange={setTags}
                    suggestedTags={suggestedTags}
                />

                {/* Обложка */}
                <View style={styles.coverRow}>
                  {thumbnail ? (
                      <View
                          style={[styles.coverPreview, {backgroundColor: theme.colors.surfaceVariant}]}
                          accessible
                          accessibilityLabel="Обложка события"
                          accessibilityHint="Нажмите, чтобы выбрать другую обложку"
                      >
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
                {feedback && (
                    <Text
                        style={[
                          feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                          {
                            backgroundColor:
                                feedback.type === 'success'
                                    ? theme.colors.primaryContainer
                                    : theme.colors.errorContainer,
                            color:
                                feedback.type === 'success'
                                    ? theme.colors.onPrimaryContainer
                                    : theme.colors.onErrorContainer,
                          },
                        ]}
                    >
                      {feedback.text}
                    </Text>
                )}
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isMutating}
                    disabled={isMutating || !title || !categoryId || !coordinates || !slots || !planingTime}
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
    borderWidth: 1,
  },
  toggleLabel: {
    marginBottom: Spacing.one,
    fontWeight: '600',
  },
  toggleRow: {
    marginVertical: 0,
  },
  toggleButton: {
    flex: 1,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  coverPreview: {
    width: '100%',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  submitBtn: {marginTop: Spacing.two},
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
});