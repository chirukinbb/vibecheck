import {useMemo, useState} from 'react';
import {Keyboard, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Chip, Searchbar, Text, useTheme,} from 'react-native-paper';
import AppPopup from './app-popup';

type SuggestedTag = string | { id?: number | string; name?: string };

type TagCloudInputProps = {
    value: string[];
    onChange: (nextValue: string[]) => void;
    suggestedTags?: SuggestedTag[];
};

const MAX_TAG_LENGTH = 30;

// Убираем лишние пробелы, ведущие «#» и ограничиваем длину
const normalizeTag = (tag: string) =>
    tag
        .trim()
        .replace(/^#+/, '')
        .replace(/\s+/g, ' ')
        .slice(0, MAX_TAG_LENGTH);

const getTagName = (tag: SuggestedTag) => {
    if (typeof tag === 'string') {
        return tag;
    }

    return tag?.name ?? '';
};

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// Подсвечивает совпадение с поисковым запросом внутри названия тега
function TagLabel({name, query, color}: { name: string; query: string; color: string }) {
    const q = query.trim().replace(/^#+/, '').toLowerCase();
    const index = q ? name.toLowerCase().indexOf(q) : -1;

    if (index === -1) {
        return <>#{name}</>;
    }

    return (
        <>
            #{name.slice(0, index)}
            <Text style={{fontWeight: '700', color}}>
                {name.slice(index, index + q.length)}
            </Text>
            {name.slice(index + q.length)}
        </>
    );
}

export default function TagCloudInput({value, onChange, suggestedTags = []}: TagCloudInputProps) {
    const theme = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [query, setQuery] = useState('');

    // Все известные теги без дублей (без учёта регистра): подсказки + уже выбранные
    const allTags = useMemo(() => {
        const result: string[] = [];
        [...suggestedTags.map(getTagName), ...value].forEach((raw) => {
            const name = normalizeTag(raw);
            if (name && !result.some((t) => sameTag(t, name))) {
                result.push(name);
            }
        });
        return result;
    }, [suggestedTags, value]);

    const normalizedQuery = normalizeTag(query);
    const exactMatch = allTags.find((t) => sameTag(t, normalizedQuery));
    const canCreate = normalizedQuery.length > 0 && !exactMatch;

    const filteredTags = useMemo(() => {
        const q = normalizedQuery.toLowerCase();
        return q ? allTags.filter((t) => t.toLowerCase().includes(q)) : allTags;
    }, [allTags, normalizedQuery]);

    const isSelected = (name: string) => value.some((t) => sameTag(t, name));

    const toggleTag = (name: string) => {
        if (isSelected(name)) {
            onChange(value.filter((t) => !sameTag(t, name)));
        } else {
            onChange([...value, name]);
        }
    };

    const createTag = () => {
        if (!canCreate) {
            return;
        }
        onChange([...value, normalizedQuery]);
        setQuery(''); // поле очищается, фокус остаётся — можно сразу вводить следующий
    };

    // Enter: есть точное совпадение — выбираем его, иначе создаём новый тег
    const handleSubmit = () => {
        if (!normalizedQuery) {
            return;
        }
        if (exactMatch) {
            if (!isSelected(exactMatch)) {
                onChange([...value, exactMatch]);
            }
            setQuery('');
            return;
        }
        createTag();
    };

    const openModal = () => {
        setQuery('');
        setModalVisible(true);
    };

    const closeModal = () => {
        Keyboard.dismiss();
        setModalVisible(false);
    };

    return (
        <View style={styles.tagField}>
            <Button mode="outlined" onPress={openModal} style={styles.tagSelectorButton}>
                {value.length > 0 ? `Теги (${value.length})` : 'Выбрать теги'}
            </Button>

            {value.length > 0 && (
                <View style={styles.chipRow}>
                    {value.map((tag) => (
                        <Chip
                            key={tag}
                            onClose={() => toggleTag(tag)}
                            style={styles.chip}
                            compact
                        >
                            #{tag}
                        </Chip>
                    ))}
                </View>
            )}

            <AppPopup
                visible={modalVisible}
                onDismiss={closeModal}
                header={
                    <Text variant="titleMedium" style={{color: theme.colors.onSurface}}>
                        Выберите теги
                    </Text>
                }
                body={
                    <>
                        <Searchbar
                            placeholder="Поиск..."
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSubmit}
                            returnKeyType="done"
                            blurOnSubmit={false}
                            maxLength={MAX_TAG_LENGTH + 1}
                            style={styles.searchbar}
                            autoFocus
                        />

                        {value.length > 0 && (
                            <View style={styles.selectedBlock}>
                                <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant}}>
                                    Выбрано
                                </Text>
                                <View style={styles.chipRow}>
                                    {value.map((tag) => (
                                        <Chip
                                            key={tag}
                                            onClose={() => toggleTag(tag)}
                                            style={styles.chip}
                                            compact
                                        >
                                            #{tag}
                                        </Chip>
                                    ))}
                                </View>
                            </View>
                        )}

                        <ScrollView
                            style={styles.list}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            contentContainerStyle={styles.listContent}
                        >
                            {canCreate && (
                                <Chip
                                    icon="plus"
                                    mode="flat"
                                    onPress={createTag}
                                    style={[
                                        styles.modalChip,
                                        {backgroundColor: theme.colors.primaryContainer},
                                    ]}
                                    textStyle={{color: theme.colors.onPrimaryContainer}}
                                >
                                    Создать «#{normalizedQuery}»
                                </Chip>
                            )}

                            {filteredTags.map((name) => {
                                const selected = isSelected(name);

                                return (
                                    <Chip
                                        key={name.toLowerCase()}
                                        mode={selected ? 'flat' : 'outlined'}
                                        selected={selected}
                                        showSelectedCheck
                                        onPress={() => toggleTag(name)}
                                        style={[
                                            styles.modalChip,
                                            selected && {
                                                backgroundColor: theme.colors.secondaryContainer,
                                            },
                                        ]}
                                        showSelectedOverlay
                                        compact
                                    >
                                        <TagLabel
                                            name={name}
                                            query={query}
                                            color={theme.colors.primary}
                                        />
                                    </Chip>
                                );
                            })}

                            {filteredTags.length === 0 && !canCreate && (
                                <Text style={{color: theme.colors.onSurfaceVariant}}>
                                    Ничего не найдено
                                </Text>
                            )}
                        </ScrollView>
                    </>
                }
                actions={[{label: 'Закрыть', onPress: closeModal, mode: 'contained'}]}
                style={[styles.modal, {backgroundColor: theme.colors.surface}]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tagField: {gap: 8},
    tagSelectorButton: {alignSelf: 'flex-start'},
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    modal: {
        margin: 24,
        padding: 16,
        borderRadius: 12,
    },
    searchbar: {marginBottom: 8},
    selectedBlock: {gap: 6, marginBottom: 12},
    list: {maxHeight: 200, flexGrow: 0},
    listContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 4,
    },
    modalChip: {borderRadius: 8},
    chip: {borderRadius: 8},
    doneButton: {marginTop: 12, alignSelf: 'flex-end'},
});