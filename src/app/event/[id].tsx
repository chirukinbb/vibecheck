// src/app/event/[id].tsx — детальная страница события
import {useLocalSearchParams} from 'expo-router';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Avatar, Button, Card, Chip, ProgressBar, Surface, Text, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {formatDate, getEventById} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';

export default function EventDetailScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const event = getEventById(Number(id));

  if (!event) {
    return (
        <Surface style={styles.root} mode="flat">
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant}}>
              Событие не найдено
            </Text>
          </View>
        </Surface>
    );
  }

  const slotsLeft = event.slots - event.reserved;
  const isFull = slotsLeft <= 0;
  const isAlmostFull = slotsLeft <= 3;

  return (
      <Surface style={styles.root} mode="flat">
        <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: insets.bottom + Spacing.four,
              },
            ]}
            showsVerticalScrollIndicator={false}
        >
          {/* Обложка */}
          <Card.Cover
              source={{uri: event.thumbnail_url}}
              style={styles.cover}
          />

          {/* Категория */}
          <Chip compact style={styles.categoryBadge} textStyle={styles.categoryText}>
            {event.category}
          </Chip>

          {/* Заголовок */}
          <Text variant="headlineMedium" style={styles.title}>
            {event.title}
          </Text>

          {/* Дата + адрес */}
          <Surface elevation={1} style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text variant="labelLarge">📅 Дата</Text>
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                {formatDate(event.planing_time)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="labelLarge">📍 Адрес</Text>
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                {event.address}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="labelLarge">
                👥 Места ({event.reserved}/{event.slots})
              </Text>
              <Text
                  variant="labelLarge"
                  style={{
                    color: isAlmostFull ? theme.colors.error : theme.colors.primary,
                  }}
              >
                {isFull ? 'Мест нет' : `${slotsLeft} свободно`}
              </Text>
            </View>

            <ProgressBar
                progress={event.reserved / event.slots}
                color={isFull ? theme.colors.error : theme.colors.primary}
                style={styles.progressBar}
            />
          </Surface>

          {/* Описание */}
          <Text variant="bodyLarge" style={styles.description}>
            {event.description}
          </Text>

          {/* Теги */}
          {event.tags && event.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {event.tags.map((tag) => (
                    <Chip key={tag.id} compact style={styles.tag}>
                      #{tag.name}
                    </Chip>
                ))}
              </View>
          )}

          {/* Автор */}
          <Surface elevation={1} style={styles.authorCard}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Организатор
            </Text>
            <View style={styles.authorRow}>
              <Avatar.Text
                  size={48}
                  label={event.author.name.charAt(0).toUpperCase()}
                  style={{backgroundColor: theme.colors.primary}}
              />
              <View style={styles.authorInfo}>
                <Text variant="bodyLarge" style={{fontWeight: '700'}}>
                  {event.author.name}
                </Text>
                <Text
                    variant="bodyMedium"
                    style={{color: theme.colors.onSurfaceVariant}}
                >
                  {event.author.bio}
                </Text>
              </View>
            </View>
          </Surface>

          {/* Кнопка записи */}
          <Button
              mode="contained"
              onPress={() => console.log('Запись на событие:', event.id)}
              disabled={isFull}
              style={styles.subscribeBtn}
          >
            {isFull ? 'Мест нет' : 'Записаться'}
          </Button>
        </ScrollView>
      </Surface>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  content: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  cover: {
    height: 250,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  categoryBadge: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    height: 28,
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
  },
  categoryText: {color: '#FFFFFF', fontSize: 12},
  title: {
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  infoCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  description: {
    lineHeight: 28,
    marginBottom: Spacing.three,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  tag: {borderRadius: Spacing.two},
  authorCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sectionTitle: {fontWeight: '700'},
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  authorInfo: {flex: 1, gap: Spacing.half},
  subscribeBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});
