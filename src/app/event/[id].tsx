// src/app/event/[id].tsx — детальная страница события
import {router, useLocalSearchParams} from 'expo-router';
import {useState} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Chip,
  Modal,
  Portal,
  ProgressBar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import PageLayout from '@/components/page-layout';
import {formatDate, getEventById} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';

const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || process.env.TOMTOM_API_KEY || 'BHEiGUcbB06ofsGybuUFTFReGMYYkoy9';

export default function EventDetailScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const event = getEventById(Number(id));
  const address = event?.address ?? '';
  const [mapVisible, setMapVisible] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const openMapModal = async () => {
    setMapVisible(true);
    if (mapUrl || mapLoading || !address) return;
    setMapLoading(true);
    setMapError(null);

    try {
      const response = await fetch(
          `https://api.tomtom.com/search/2/search/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}&language=ru-RU&limit=1`,
      );
      if (!response.ok) {
        throw new Error('TomTom request failed');
      }
      const data = await response.json();
      const position = data.results?.[0]?.position;
      if (!position?.lat || !position?.lon) {
        throw new Error('Не удалось найти координаты адреса');
      }
      const {lat, lon} = position;
      setMapUrl(
          `https://api.tomtom.com/map/1/staticimage?layer=basic&style=main&zoom=15&width=700&height=400&center=${lon},${lat}&format=png&key=${TOMTOM_API_KEY}&pois=${lon},${lat}`,
      );
    } catch (error) {
      setMapError('Не удалось загрузить карту');
    } finally {
      setMapLoading(false);
    }
  };

  if (!event) {
    return (
        <PageLayout title="Событие не найдено">
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant}}>
              Событие не найдено
            </Text>
          </View>
        </PageLayout>
    );
  }

  const slotsLeft = event.slots - event.reserved;
  const isFull = slotsLeft <= 0;
  const isAlmostFull = slotsLeft <= 3;

  return (
      <PageLayout
          title={event.title}
          icon="arrow-left"
          onIconPress={() => router.back()}
      >
        <ScrollView
            contentContainerStyle={[
              styles.content,
              {paddingBottom: Spacing.four},
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
              <Text
                  variant="bodyMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.addressText, {color: theme.colors.onSurfaceVariant}]}
              >
                {event.address}
              </Text>
            </View>

            <Button mode="outlined" onPress={openMapModal} compact style={styles.mapButton}>
              Посмотреть на карте
            </Button>

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

          <Portal>
            <Modal
                visible={mapVisible}
                onDismiss={() => setMapVisible(false)}
                contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>
                Адрес на карте
              </Text>
              <Text variant="bodyMedium" style={styles.modalAddress}>
                {event.address}
              </Text>
              {mapLoading && (
                  <View style={styles.modalLoader}>
                    <ActivityIndicator animating size="large"/>
                  </View>
              )}
              {mapError && (
                  <Text variant="bodyMedium" style={styles.errorText}>
                    {mapError}
                  </Text>
              )}
              {!mapLoading && mapUrl && (
                  <Image source={{uri: mapUrl}} style={styles.mapImage}/>
              )}
              <Button mode="contained" onPress={() => setMapVisible(false)} style={styles.closeMapButton}>
                Закрыть
              </Button>
            </Modal>
          </Portal>

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
      </PageLayout>
  );
}

const styles = StyleSheet.create({
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
  addressText: {
    maxWidth: '50%',
  },
  mapButton: {
    alignSelf: 'flex-start',
    marginTop: -Spacing.two,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.two,
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
  closeMapButton: {
    marginTop: Spacing.three,
  },
  mapImage: {
    width: '100%',
    height: 220,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  modal: {
    margin: 24,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  modalTitle: {
    marginBottom: Spacing.one,
    fontWeight: '700',
  },
  modalAddress: {
    marginBottom: Spacing.two,
    color: '#6a6a6a',
  },
  modalLoader: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#B00020',
    marginBottom: Spacing.two,
  },
  subscribeBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
});
