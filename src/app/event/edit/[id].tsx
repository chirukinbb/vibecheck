// src/app/event/edit/[id].tsx — редактирование события
import DateTimePicker from '@/components/date-time-picker';
import {router, useLocalSearchParams} from 'expo-router';
import {useEffect, useState} from 'react';
import {Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Chip,
    Modal,
    Portal,
    Searchbar,
    Surface,
    TextInput,
    useTheme
} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AddressPicker, {Coordinates} from '@/components/address-picker';
import ImagePickerWithCrop from '@/components/image-picker';
import PageLayout from '@/components/page-layout';
import SingleSelect from '@/components/single-select';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {getCurrentCoordinates} from '@/api';
import {useCategoriesStore, useEventsStore} from '@/stores';
import {useTagsStore} from '@/stores/tagsStore';

export default function EditEventScreen() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();

    const categories = useCategoriesStore((state) => state.categories);
    const fetchCategories = useCategoriesStore((state) => state.fetchCategories);

    const suggestedTags = useTagsStore((state) => state.categories);
    const fetchTags = useTagsStore((state) => state.fetchCategories ?? state.fetchTags);

    const {
        selectedEvent,
        isLoadingSingle,
        fetchEvent,
        editEvent,
        isMutating,
    } = useEventsStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [planingTime, setPlaningTime] = useState<Date | null>(null);
    const [slots, setSlots] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [tagModalVisible, setTagModalVisible] = useState(false);
    const [tagQuery, setTagQuery] = useState('');
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    // 1. Загрузка данных
    useEffect(() => {
        void fetchCategories();
        if (typeof fetchTags === 'function') {
            void fetchTags();
        }
        if (id) {
            void fetchEvent(Number(id));
        }
    }, [fetchCategories, fetchTags, fetchEvent, id]);

    // 2. Заполнение полей формы из selectedEvent
    useEffect(() => {
        if (selectedEvent) {
            setTitle(selectedEvent.title ?? '');
            setDescription(selectedEvent.description ?? '');
            setSlots(String(selectedEvent.slots ?? ''));

            // Категория по названию или ID
            const matchedCategory = categories.find(
                (cat) => cat.title === selectedEvent.category || cat.id === selectedEvent.category_id
            );
            if (matchedCategory) {
                setCategoryId(matchedCategory.id);
            } else if (selectedEvent.category_id) {
                setCategoryId(Number(selectedEvent.category_id));
            }

            // Безопасное парсинг координат (поддержка coordinate_lat и coordinates_lat)
            const lat = Number(selectedEvent.coordinate_lat ?? selectedEvent.coordinates_lat);
            const lng = Number(selectedEvent.coordinate_lng ?? selectedEvent.coordinates_lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setCoordinates([lat, lng]);
            }

            // Время начала
            if (selectedEvent.planing_time) {
                const timestamp = typeof selectedEvent.planing_time === 'number'
                    ? selectedEvent.planing_time * 1000
                    : new Date(selectedEvent.planing_time).getTime();
                setPlaningTime(new Date(timestamp));
            }

            // Теги (поддержка как массива строк, так и объектов { id, name })
            if (Array.isArray(selectedEvent.tags)) {
                setTags(
                    selectedEvent.tags.map((t: any) => (typeof t === 'string' ? t : t.name ?? ''))
                );
            }

            // Картинка обложки
            if (selectedEvent.thumbnail_url) {
                setThumbnail(selectedEvent.thumbnail_url);
            }
        }
    }, [selectedEvent, categories]);

    const handleThumbnailSelected = (uri: string) => {
        setThumbnail(uri);
    };

    const handleSubmit = async () => {
        if (!id || !title || !categoryId || !coordinates || !slots || !planingTime) {
            return;
        }

        const saved = await editEvent(Number(id), {
            title,
            description,
            category_id: categoryId,
            address: coordinates,
            planing_time: planingTime ? Math.floor(planingTime.getTime() / 1000) : null,
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
            const coords = await getCurrentCoordinates();
            if (coords) {
                setCoordinates(coords);
            } else {
                alert('Нет доступа к геолокации');
            }
        } catch (e) {
            alert('Не удалось определить местоположение');
        } finally {
            setLocationLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    if (isLoadingSingle && !selectedEvent) {
        return (
            <PageLayout title="Редактирование события">
                <View style={styles.centered}>
                    <ActivityIndicator animating size="large"/>
                </View>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Редактировать событие" icon="arrow-left" onIconPress={() => router.back()}>
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

                            {/* Адрес (Один компонент вместо двух) */}
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
                                            {backgroundColor: theme.colors.elevation.level3},
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
                                            {(suggestedTags ?? [])
                                                .filter((tag: any) =>
                                                    (tag.name ?? tag).toLowerCase().includes(tagQuery.toLowerCase())
                                                )
                                                .map((tag: any) => {
                                                    const tagName = tag.name ?? tag;
                                                    const selected = tags.includes(tagName);
                                                    return (
                                                        <Chip
                                                            key={tag.id ?? tagName}
                                                            mode={selected ? 'flat' : 'outlined'}
                                                            selected={selected}
                                                            onPress={() => {
                                                                if (selected) {
                                                                    setTags(tags.filter((t) => t !== tagName));
                                                                } else {
                                                                    setTags([...tags, tagName]);
                                                                }
                                                            }}
                                                            style={styles.modalChip}
                                                            compact
                                                        >
                                                            #{tagName}
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
                                    <View
                                        style={[styles.coverPreview, {backgroundColor: theme.colors.surfaceVariant}]}
                                    >
                                        <Image source={{uri: thumbnail}} style={styles.coverImage}/>
                                        <Button mode="text" onPress={() => setThumbnail(null)}>
                                            ✕ Изменить обложку
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

                            {/* Кнопка отправки */}
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={isMutating}
                                disabled={isMutating || !title || !categoryId || !coordinates || !slots || !planingTime}
                                style={styles.submitBtn}
                            >
                                Сохранить изменения
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
    screen: {flex: 1},
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.four,
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
    },
    coverImage: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    submitBtn: {marginTop: Spacing.two},
});