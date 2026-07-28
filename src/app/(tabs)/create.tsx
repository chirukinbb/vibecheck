// src/app/(tabs)/create.tsx — создание события
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Chip, Surface, Text, TextInput, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {MOCK_CATEGORIES} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';

export default function CreateEventScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [planingTime, setPlaningTime] = useState('');
  const [slots, setSlots] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const handleSubmit = () => {
    // Хардкод — просто логируем данные
    console.log('Создаём событие:', {
      title,
      description,
      category_id: categoryId,
      address,
      planing_time: planingTime,
      slots: Number(slots),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      thumbnail,
    });
    router.back();
  };

  return (
      <Surface style={styles.root} mode="flat">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
        >
          <ScrollView
              contentContainerStyle={[
                styles.content,
                {
                  paddingTop: insets.top + Spacing.three,
                  paddingBottom: insets.bottom + 100,
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            <Text variant="headlineMedium" style={styles.title}>
              Новое событие
            </Text>

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
              <Text variant="labelLarge">Категория</Text>
              <View style={styles.chipRow}>
                {MOCK_CATEGORIES.map((cat) => (
                    <Chip
                        key={cat.id}
                        selected={categoryId === cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        showSelectedOverlay
                        style={styles.chip}
                    >
                      {cat.title}
                    </Chip>
                ))}
              </View>

              {/* Адрес */}
              <TextInput
                  mode="outlined"
                  label="Адрес"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="ул. Тверская, 15"
              />

              {/* Дата */}
              <TextInput
                  mode="outlined"
                  label="Дата и время"
                  value={planingTime}
                  onChangeText={setPlaningTime}
                  placeholder="25/12/2026 19:00"
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
              <TextInput
                  mode="outlined"
                  label="Теги (через запятую)"
                  value={tags}
                  onChangeText={setTags}
                  placeholder="йога, здоровье, на природе"
              />

              {/* Обложка */}
              <View style={styles.coverRow}>
                <Button
                    mode="outlined"
                    onPress={() =>
                        setThumbnail(
                            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
                        )
                    }
                >
                  {thumbnail ? 'Обложка выбрана' : 'Выбрать обложку'}
                </Button>
                {thumbnail && (
                    <Button mode="text" onPress={() => setThumbnail(null)}>
                      ✕
                    </Button>
                )}
              </View>

              {/* Сабмит */}
              <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={!title || !categoryId || !address || !slots}
                  style={styles.submitBtn}
              >
                Создать событие
              </Button>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </Surface>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  content: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  title: {fontWeight: '700', paddingBottom: Spacing.three},
  form: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {borderRadius: Spacing.two},
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  submitBtn: {marginTop: Spacing.two},
});
