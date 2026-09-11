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

import {getAddressFromCoordinates, getStaticMapUrl} from '@/api';
import PageLayout from '@/components/page-layout';
import {formatDate} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useEventsStore} from '@/stores';

export default function EventDetailScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
    const insets = useSafeAreaInsets();
    const {
        selectedEvent,
        isLoadingSingle,
        isMutating,
        error,
        fetchEvent,
        clearSelected,
        subscribe,
        unsubscribe
    } = useEventsStore();

  const [addressName, setAddressName] = useState<string>('Определение адреса…');
  const [mapVisible, setMapVisible] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    clearSelected();
    void fetchEvent(Number(id));
  }, [clearSelected, fetchEvent, id]);

  const event = selectedEvent;

  // Извлекаем широту и долготу из полей объекта
  const lat = event?.coordinate_lat ? parseFloat(event.coordinate_lat) : null;
  const lng = event?.coordinate_lng ? parseFloat(event.coordinate_lng) : null;

  // Определение адреса через сервис
  useEffect(() => {
    let isMounted = true;

    getAddressFromCoordinates(lat, lng).then((resolvedAddress) => {
      if (isMounted) {
        setAddressName(resolvedAddress);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  // Генерация карты через сервис
  const openMapModal = () => {
    setMapVisible(true);
    setMapLoading(true);
    setMapError(null);

    try {
      const staticMapUrl = getStaticMapUrl(lat, lng);
      setMapUrl(staticMapUrl);
    } catch (err: any) {
      setMapError(err?.message || 'Не удалось загрузить карту');
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
        <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
          <ScrollView
              contentContainerStyle={[
                styles.content,
                {paddingBottom: Spacing.six + insets.bottom + 60},
              ]}
              showsVerticalScrollIndicator={false}
          >
            <Card.Cover
                source={{uri: event.thumbnail_url}}
                style={styles.cover}
            />

            <Chip
                compact
                style={[styles.categoryBadge, {backgroundColor: theme.colors.primaryContainer}]}
                textStyle={{color: theme.colors.onPrimaryContainer, fontSize: 12}}
            >
              {event.category}
            </Chip>

            <Text variant="headlineSmall" style={[styles.eventTitle, {color: theme.colors.onSurface}]}>
              {event.title}
            </Text>

            <Surface
                elevation={2}
                style={[
                  styles.infoCard,
                  {backgroundColor: theme.colors.elevation.level2}
                ]}
            >
              <View style={styles.detailsRow}>
                <Surface
                    elevation={0}
                    style={[styles.detailCard, {backgroundColor: theme.colors.surfaceVariant}]}
                >
                  <Text variant="bodyLarge" style={styles.detailIcon}>
                    📅
                  </Text>
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}} numberOfLines={1}>
                    {formattedDate}
                  </Text>
                </Surface>

                <Surface
                    elevation={0}
                    style={[styles.detailCard, {backgroundColor: theme.colors.surfaceVariant}]}
                >
                  <Text variant="bodyLarge" style={styles.detailIcon}>
                    📍
                  </Text>
                  <Text
                      variant="bodyMedium"
                      style={{color: theme.colors.onSurfaceVariant}}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                  >
                    {addressName}
                  </Text>
                </Surface>
              </View>

              <Button mode="outlined" onPress={openMapModal} style={styles.mapButton}>
                📍 Посмотреть на карте
              </Button>

              <View style={styles.summaryRow}>
                <Text variant="titleMedium" style={[styles.summaryText, {color: theme.colors.onSurface}]}>
                  {occupancyText}
                </Text>
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
                  {event.reserved ?? 0}/{event.slots} занято
                </Text>
              </View>
              <ProgressBar
                  progress={(event.reserved ?? 0) / (event.slots || 1)}
                  color={isFull ? theme.colors.error : theme.colors.primary}
                  style={styles.progressBar}
              />
            </Surface>

            <Text variant="bodyLarge" style={[styles.description, {color: theme.colors.onSurface}]}>
              {event.description}
            </Text>

            {event.tags && event.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {event.tags.map((tag, idx) => (
                      <Chip
                          key={typeof tag === 'string' ? tag : tag.id ?? idx}
                          compact
                          style={[styles.tag, {backgroundColor: theme.colors.secondaryContainer}]}
                          textStyle={{color: theme.colors.onSecondaryContainer}}
                      >
                        #{typeof tag === 'string' ? tag : tag.name}
                      </Chip>
                  ))}
                </View>
            )}

            <Surface
                elevation={2}
                style={[
                  styles.authorCard,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  }
                ]}
            >
              <Text variant="labelLarge" style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                Организатор
              </Text>
              <View style={styles.authorRow}>
                {event.author?.avatar_url ? (
                    <Avatar.Image
                        size={48}
                        source={{uri: event.author.avatar_url}}
                        style={[styles.authorAvatar, {backgroundColor: theme.colors.primaryContainer}]}
                    />
                ) : (
                    <Avatar.Text
                        size={48}
                        label={event.author?.name ? event.author.name.charAt(0).toUpperCase() : '?'}
                        style={[styles.authorAvatar, {backgroundColor: theme.colors.primaryContainer}]}
                        labelStyle={{color: theme.colors.onPrimaryContainer}}
                    />
                )}
                <View style={styles.authorInfo}>
                  <Text variant="bodyLarge" style={{fontWeight: '700', color: theme.colors.onSurface}}>
                    {event.author?.name}
                  </Text>
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                    {event.author?.bio}
                  </Text>
                </View>
              </View>
            </Surface>

            <Portal>
              <Modal
                  visible={mapVisible}
                  onDismiss={() => setMapVisible(false)}
                  contentContainerStyle={[
                    styles.modal,
                    {backgroundColor: theme.colors.elevation.level3}
                  ]}
              >
                <Text variant="titleMedium" style={[styles.modalTitle, {color: theme.colors.onSurface}]}>
                  Адрес на карте
                </Text>
                <Text
                    variant="bodyMedium"
                    style={[styles.modalMeta, {color: theme.colors.onSurfaceVariant}]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                  {formattedDate}, {addressName}
                </Text>
                {mapLoading && (
                    <View style={styles.modalLoader}>
                      <ActivityIndicator animating size="large"/>
                    </View>
                )}
                {mapError && (
                    <Text variant="bodyMedium" style={[styles.errorText, {color: theme.colors.error}]}>
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

          {Array.isArray(event.members) ? (
              <Surface
                  elevation={2}
                  style={[
                    styles.footer,
                    {
                      paddingBottom: insets.bottom || Spacing.three,
                      backgroundColor: theme.colors.elevation.level2,
                      borderTopColor: theme.colors.outlineVariant,
                    },
                  ]}
              >
                <View style={styles.organizerActions}>
                  <Button
                      mode="outlined"
                      icon="pencil"
                      onPress={() => router.push(`/event/edit/${event.id}`)}
                      style={styles.organizerButton}
                      compact
                  >
                    Изменить
                  </Button>

                  <Button
                      mode="outlined"
                      icon="account-group"
                      onPress={() => router.push(`/event/members/${event.id}`)}
                      style={styles.organizerButton}
                      compact
                  >
                    Участники ({event.reserved ?? event.members.length})
                  </Button>

                  <Button
                      mode="contained"
                      icon="chat"
                      onPress={() => router.push(`/event/chat/${event.id}`)}
                      style={styles.organizerButton}
                      compact
                  >
                    Чат
                  </Button>
                </View>
              </Surface>
          ) : (
              <Surface
                  elevation={2}
                  style={[
                    styles.footer,
                    {
                      paddingBottom: insets.bottom || Spacing.three,
                      backgroundColor: theme.colors.elevation.level2,
                      borderTopColor: theme.colors.outlineVariant,
                    },
                  ]}
              >
                  <Button
                      mode={event.member ? 'outlined' : 'contained'}
                      onPress={async () => {
                          if (event.member) {
                              await unsubscribe(event.id);
                          } else {
                              await subscribe(event.id);
                          }
                      }}
                      loading={isMutating}
                      disabled={isMutating || (!event.member && isFull)}
                      style={styles.bottomButton}
                  >
                      {isMutating
                          ? event.member
                              ? 'Отписываем…'
                              : 'Записываем…'
                          : event.member
                              ? 'Отписаться'
                              : isFull
                                  ? 'Мест нет'
                                  : 'Записаться'}
                  </Button>
              </Surface>
          )}
        </View>
      </PageLayout>
  );
}

const styles = StyleSheet.create({
  organizerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.one,
  },
  organizerButton: {
    flex: 1,
  },
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
    borderRadius: Spacing.two,
    height: 28,
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
  },
  screen: {
    flex: 1,
  },
  infoCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  eventTitle: {
    fontWeight: '700',
    marginBottom: Spacing.three,
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
  },
  detailIcon: {
    marginBottom: Spacing.one,
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
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  authorCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
  },
  sectionTitle: {fontWeight: '700'},
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  authorInfo: {flex: 1, gap: Spacing.half},
  authorAvatar: {},
  closeMapButton: {
    marginTop: Spacing.three,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
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
    marginBottom: Spacing.two,
  },
  modalLoader: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: Spacing.two,
  },
});