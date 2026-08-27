// src/app/event/[id].tsx — детальная страница события
import {router, useLocalSearchParams} from 'expo-router';
import {useEffect, useState} from 'react';
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {formatDate} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useEventsStore} from '@/stores';
import {subscribeToEvent} from "@/api";

const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || process.env.TOMTOM_API_KEY || 'BHEiGUcbB06ofsGybuUFTFReGMYYkoy9';

export default function EventDetailScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const {selectedEvent, isLoadingSingle, error, fetchEvent, clearSelected} = useEventsStore();

  useEffect(() => {
    if (!id) return;
    clearSelected();
    void fetchEvent(Number(id));
  }, [clearSelected, fetchEvent, id]);

  const event = selectedEvent;
  const insets = useSafeAreaInsets();
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
    } catch (_error) {
      setMapError('Не удалось загрузить карту');
    } finally {
      setMapLoading(false);
    }
  };

  if (isLoadingSingle && !event) {
    return (
        <PageLayout title="Загрузка…">
          <View style={styles.centered}>
            <ActivityIndicator animating size="large"/>
          </View>
        </PageLayout>
    );
  }

  if (!event) {
    return (
        <PageLayout title="Событие не найдено">
          <View style={styles.centered}>
            <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant}}>
              {error ?? 'Событие не найдено'}
            </Text>
          </View>
        </PageLayout>
    );
  }

  const slotsLeft = event.slots - (event.reserved ?? 0);
  const isFull = slotsLeft <= 0;
  const occupancyText = isFull ? 'Мест нет' : `${slotsLeft} свободно`;
  const formattedDate = formatDate(event.planing_time);

  return (
      <PageLayout
          icon="arrow-left"
          onIconPress={() => router.back()}
          title="Назад"
      >
        <View style={styles.screen}>
          <ScrollView
              contentContainerStyle={[
                styles.content,
                {paddingBottom: Spacing.six + insets.bottom},
              ]}
              showsVerticalScrollIndicator={false}
          >
            <Card.Cover
                source={{uri: event.thumbnail_url}}
                style={styles.cover}
            />

            <Chip compact style={styles.categoryBadge} textStyle={styles.categoryText}>
              {event.category}
            </Chip>

            <Text variant="headlineSmall" style={styles.eventTitle}>
              {event.title}
            </Text>

            <Surface elevation={2} style={styles.infoCard}>
              <View style={styles.detailsRow}>
                <Surface elevation={0} style={styles.detailCard}>
                  <Text variant="bodyLarge" style={styles.detailIcon}>
                    📅
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailText} numberOfLines={1}>
                    {formattedDate}
                  </Text>
                </Surface>
                <Surface elevation={0} style={styles.detailCard}>
                  <Text variant="bodyLarge" style={styles.detailIcon}>
                    📍
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                    {event.address}
                  </Text>
                </Surface>
              </View>

              <Button mode="outlined" onPress={openMapModal} style={styles.mapButton}>
                📍 Посмотреть на карте
              </Button>

              <View style={styles.summaryRow}>
                <Text variant="titleMedium" style={styles.summaryText}>
                  {occupancyText}
                </Text>
                <Text variant="bodySmall" style={styles.summarySubtext}>
                  {event.reserved ?? 0}/{event.slots} занято
                </Text>
              </View>
              <ProgressBar
                  progress={(event.reserved ?? 0) / (event.slots || 1)}
                  color={isFull ? theme.colors.error : theme.colors.primary}
                  style={styles.progressBar}
              />
            </Surface>

            <Text variant="bodyLarge" style={styles.description}>
              {event.description}
            </Text>

            {event.tags && event.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {event.tags.map((tag) => (
                      <Chip key={tag.id} compact style={styles.tag}>
                        #{tag.name}
                      </Chip>
                  ))}
                </View>
            )}

            <Surface elevation={2} style={styles.authorCard}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Организатор
              </Text>
              <View style={styles.authorRow}>
                {event.author.avatar_url ? (
                    <Avatar.Image
                        size={48}
                        source={{uri: event.author.avatar_url}}
                        style={styles.authorAvatar}
                    />
                ) : (
                    <Avatar.Text
                        size={48}
                        label={event.author.name.charAt(0).toUpperCase()}
                        style={styles.authorAvatar}
                        labelStyle={styles.avatarLabel}
                    />
                )}
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
                <Text variant="bodyMedium" style={styles.modalMeta} numberOfLines={1} ellipsizeMode="tail">
                  {formattedDate}, {event.address}
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
          </ScrollView>

          <View style={[styles.footer, {paddingBottom: insets.bottom || Spacing.three}]}>
            <Button
                mode="contained"
                onPress={() => subscribeToEvent(event.id)}
                disabled={isFull}
                style={styles.bottomButton}
            >
              {isFull ? 'Мест нет' : 'Записаться'}
            </Button>
          </View>
        </View>
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
  screen: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  infoCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: '#FFFFFF',
  },
  eventTitle: {
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  capacityBadge: {
    alignItems: 'flex-end',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#F2F6FF',
  },
  capacityTitle: {
    fontWeight: '700',
  },
  capacitySubtitle: {
    color: '#6A6A6A',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  detailCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    backgroundColor: '#F8FAFF',
  },
  detailIcon: {
    marginBottom: Spacing.one,
  },
  detailText: {
    color: '#3C3C3C',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  summaryText: {
    fontWeight: '700',
  },
  summarySubtext: {
    color: '#6A6A6A',
  },
  mapButton: {
    marginTop: Spacing.one,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginTop: Spacing.two,
  },
  description: {
    lineHeight: 28,
    marginBottom: Spacing.three,
    fontSize: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  tag: {
    borderRadius: Spacing.three,
    backgroundColor: '#F3F5FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  authorCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9F2',
  },
  sectionTitle: {fontWeight: '700'},
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  authorInfo: {flex: 1, gap: Spacing.half},
  authorAvatar: {
    backgroundColor: '#E7EEFF',
  },
  avatarLabel: {
    color: '#1C3D7A',
  },
  closeMapButton: {
    marginTop: Spacing.three,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#FAFBFF',
    borderTopWidth: 1,
    borderTopColor: '#E6E9F2',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  bottomButton: {
    width: '100%',
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
    marginBottom: Spacing.two,
    fontWeight: '700',
  },
  modalMeta: {
    color: '#4A4A4A',
    marginBottom: Spacing.two,
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
