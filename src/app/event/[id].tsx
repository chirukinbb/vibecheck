// src/app/event/[id].tsx — детальная страница события
import * as Clipboard from 'expo-clipboard';
import {router, useLocalSearchParams} from 'expo-router';
import {useEffect, useState} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Chip,
  IconButton,
  ProgressBar,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import AppPopup from '@/components/app-popup';
import EventFooter from '@/components/event-footer';
import SegmentedToggle from '@/components/segmented-toggle';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {getAddressFromCoordinates, getStaticMapUrl} from '@/api';
import PageLayout from '@/components/page-layout';
import {formatDate} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useAuthStore, useEventsStore} from '@/stores';

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
    unsubscribe,
    feedbackMember,
  } = useEventsStore();
  const {profile} = useAuthStore();

  const [addressName, setAddressName] = useState<string>('Определение адреса…');
  const [mapVisible, setMapVisible] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewsListVisible, setReviewsListVisible] = useState(false);
  const [linkPopupVisible, setLinkPopupVisible] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMark, setReviewMark] = useState(8);
  const [reviewHappened, setReviewHappened] = useState(true);

  useEffect(() => {
    if (!id) return;
    clearSelected();
    void fetchEvent(Number(id));
  }, [clearSelected, fetchEvent, id]);

  const event = selectedEvent;
  const eventLink = event?.link?.trim();
  const qrCodeUrl = eventLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(eventLink)}`
      : null;

  const handleCopyLink = async () => {
    if (!eventLink) return;
    try {
      await Clipboard.setStringAsync(eventLink);
    } catch (e) {
      console.warn('Не удалось скопировать ссылку', e);
    }
  };

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
  const conditionLabel = event.condition === 'paid' ? 'Платно' : event.condition === 'free' ? 'Бесплатно' : 'Не указано';
  const formattedPrice = event.price != null && event.price !== ''
      ? `${Number(event.price).toLocaleString('uk-UA')} ₴`
      : '—';
  const hasApprovalIssue = event.approved === false;
  const isArchivedEvent = (() => {
    if (!event.planing_time) return false;

    const ms = Number(event.planing_time) * 1000;
    return Number.isFinite(ms) && ms < Date.now();
  })();

  const getCommentText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.comment === 'string') return obj.comment;
      if (typeof obj.text === 'string') return obj.text;
      if (typeof obj.value === 'string') return obj.value;
    }
    return value != null ? String(value) : '';
  };

  const reviewList = Array.isArray(event.comments)
      ? (event.comments as Array<{
        id?: number | string | null;
        comment?: unknown;
        mark?: string | number | null;
        is_happened?: number | boolean | null;
      }>).filter((item) => {
        const text = getCommentText(item?.comment).trim();
        const hasComment = text.length > 0;
        const hasMark = item?.mark !== null && item?.mark !== undefined && String(item.mark).trim() !== '';
        return hasComment || hasMark;
      })
      : [];
  const existingEventReview = reviewList[0] ?? (event.comment ? {
    comment: getCommentText(event.comment),
    mark: event.mark,
    is_happened: event.is_happened,
  } : null);
  const isOrganizer = Boolean(
      profile?.id != null &&
      event.author?.id != null &&
      Number(profile.id) === Number(event.author.id)
  );
  const hasExistingReview = Boolean(existingEventReview);

  const openReviewForm = () => {
    setReviewsListVisible(false);
    const review = existingEventReview;

    if (review) {
      const nextComment = getCommentText(review.comment);
      const nextMark = Number(review.mark ?? 5);

      setReviewComment(nextComment);
      setReviewMark(Number.isFinite(nextMark) ? nextMark : 5);
      setReviewHappened(review.is_happened === false ? false : true);
    }
    setReviewVisible(true);
  };

  const openReviewsList = () => {
    setReviewVisible(false);
    setReviewsListVisible(true);
  };

  const handleReviewSubmit = async () => {
    if (!event?.id || !event.member) return;

    const comment = typeof reviewComment === 'string'
        ? reviewComment.trim()
        : String(reviewComment ?? '').trim();

    if (!comment) {
      return;
    }

    const result = await feedbackMember(event.id, Number(event.member), {
      is_happened: reviewHappened,
      comment,
      mark: reviewMark,
    });

    if (result) {
      setReviewVisible(false);
      setReviewComment('');
      setReviewMark(8);
      setReviewHappened(true);
      await fetchEvent(event.id);
    }
  };

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
                {paddingBottom: Spacing.six + insets.bottom + 100},
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

            {hasApprovalIssue && (
                <Surface
                    elevation={0}
                    style={[
                      styles.approvalBanner,
                      {
                        backgroundColor: theme.colors.errorContainer,
                        borderColor: theme.colors.error,
                      }
                    ]}
                >
                  <Text variant="labelLarge" style={[styles.approvalTitle, {color: theme.colors.onErrorContainer}]}>
                    Событие не подтверждено
                  </Text>
                  {event.reason && (
                      <Text variant="bodyMedium" style={[styles.approvalText, {color: theme.colors.onErrorContainer}]}>
                        Причина: {event.reason}
                      </Text>
                  )}
                  <Text variant="bodyMedium" style={[styles.approvalText, {color: theme.colors.onErrorContainer}]}>
                    {event.reason
                        ? 'Ты можешь обновить событие и отправить его на повторную проверку.'
                        : 'Ожидайте подтверждения модератором.'}
                  </Text>
                </Surface>
            )}

            <Text variant="headlineSmall" style={[styles.eventTitle, {color: theme.colors.onSurface}]}>
              {event.title}
            </Text>

            {event.distance_km != null && (
                <Text variant="bodyMedium" style={[styles.distanceText, {color: theme.colors.primary}]}>
                  📍 Расстояние: {event.distance_km} км
                </Text>
            )}

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

            <Surface
                elevation={0}
                style={[
                  styles.metaBlock,
                  {backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant},
                ]}
            >
              <View style={styles.metaRow}>
                <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant}}>
                  Условия
                </Text>
                <Text variant="bodyMedium" style={{color: theme.colors.onSurface, fontWeight: '600'}}>
                  {conditionLabel}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text variant="labelMedium" style={{color: theme.colors.onSurfaceVariant}}>
                  Цена
                </Text>
                <Text variant="bodyMedium" style={{color: theme.colors.onSurface, fontWeight: '600'}}>
                  {event.condition === 'paid' ? formattedPrice : '—'}
                </Text>
              </View>
            </Surface>

            {eventLink && (
                <Button mode="outlined" onPress={() => setLinkPopupVisible(true)} style={styles.linkButton}>
                  Ссылка / QR-код
                </Button>
            )}

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

            {!isOrganizer && (
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
            )}

            <AppPopup
                visible={linkPopupVisible}
                onDismiss={() => setLinkPopupVisible(false)}
                header="Ссылка на событие"
                body={
                  <View style={styles.linkPopupContent}>
                    <Text variant="bodyMedium" style={[styles.linkText, {color: theme.colors.onSurfaceVariant}]}
                          numberOfLines={4}>
                      {eventLink}
                    </Text>

                    <View style={styles.linkActions}>
                      <Button mode="outlined" onPress={handleCopyLink} compact>
                        Копировать
                      </Button>
                    </View>

                    {qrCodeUrl && (
                        <View style={styles.qrWrap}>
                          <Image
                              source={{uri: qrCodeUrl}}
                              style={styles.qrImage}
                              resizeMode="contain"
                          />
                        </View>
                    )}
                  </View>
                }
                actions={[{label: 'Закрыть', onPress: () => setLinkPopupVisible(false), mode: 'contained'}]}
                style={[styles.modal, {backgroundColor: theme.colors.elevation.level3}]}
            />

            <AppPopup
                visible={mapVisible}
                onDismiss={() => setMapVisible(false)}
                header="Адрес на карте"
                body={
                  <>
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
                  </>
                }
                actions={[{label: 'Закрыть', onPress: () => setMapVisible(false), mode: 'contained'}]}
                style={[styles.modal, {backgroundColor: theme.colors.elevation.level3}]}
            />

            <AppPopup
                visible={reviewsListVisible}
                onDismiss={() => setReviewsListVisible(false)}
                header={reviewList.length > 0 ? 'Отзывы' : 'Пока нет отзывов'}
                body={
                  reviewList.length > 0 ? (
                      <View style={styles.reviewListContainer}>
                        {reviewList.map((item, index) => {
                          const itemText = getCommentText(item.comment).trim();
                          const itemMark = Number(item.mark ?? 0);

                          return (
                              <View key={`${item.id ?? item.comment ?? index}`} style={styles.reviewListItem}>
                                <View style={styles.reviewListHeader}>
                                  <Text variant="labelLarge" style={{color: theme.colors.onSurface}}>
                                    Оценка: {Number.isFinite(itemMark) && itemMark > 0 ? itemMark : 0}/5
                                  </Text>
                                  <Text variant="labelLarge" style={{color: theme.colors.primary}}>
                                    {'★'.repeat(Math.max(0, Math.min(5, Number.isFinite(itemMark) ? itemMark : 0)))}
                                  </Text>
                                </View>
                                <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                                  {itemText || 'Без текста'}
                                </Text>
                              </View>
                          );
                        })}
                      </View>
                  ) : (
                      <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                        У этого события ещё нет отзывов.
                      </Text>
                  )
                }
                actions={[{label: 'Закрыть', onPress: () => setReviewsListVisible(false), mode: 'contained'}]}
                style={[styles.modal, {backgroundColor: theme.colors.elevation.level3}]}
            />

            <AppPopup
                visible={reviewVisible}
                onDismiss={() => setReviewVisible(false)}
                header={hasExistingReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
                body={
                  <>
                    <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                      Расскажите, как прошло событие.
                    </Text>

                    <SegmentedToggle
                        options={[
                          {label: 'Было', value: true},
                          {label: 'Не было', value: false},
                        ]}
                        value={reviewHappened}
                        onChange={setReviewHappened}
                        style={styles.reviewToggleRow}
                        buttonStyle={styles.reviewToggleButton}
                    />

                    <Text variant="labelLarge" style={{color: theme.colors.onSurface}}>
                      Оценка: {reviewMark}/5
                    </Text>

                    <View style={styles.ratingRow}>
                      {Array.from({length: 5}, (_, index) => {
                        const value = index + 1;
                        const isActive = reviewMark >= value;

                        return (
                            <IconButton
                                key={value}
                                icon={isActive ? 'star' : 'star-outline'}
                                size={28}
                                onPress={() => setReviewMark(value)}
                                style={styles.starButton}
                                iconColor={isActive ? theme.colors.primary : theme.colors.outline}
                            />
                        );
                      })}
                    </View>

                    <TextInput
                        value={reviewComment}
                        onChangeText={setReviewComment}
                        mode="outlined"
                        label="Комментарий"
                        multiline
                        numberOfLines={5}
                        style={styles.reviewInput}
                        placeholder="Например: всё прошло отлично, команда была организована и атмосфера была очень тёплой"
                    />
                  </>
                }
                actions={[
                  {label: 'Отмена', onPress: () => setReviewVisible(false), mode: 'text'},
                  {
                    label: isMutating ? 'Сохраняем…' : hasExistingReview ? 'Сохранить' : 'Отправить',
                    onPress: handleReviewSubmit,
                    mode: 'contained',
                    disabled: isMutating || !reviewComment.trim(),
                  },
                ]}
                style={[styles.modal, {backgroundColor: theme.colors.elevation.level3}]}
            />
          </ScrollView>

          <EventFooter
              variant={isOrganizer ? 'organizer' : event.member ? 'member' : 'guest'}
              isArchivedEvent={isArchivedEvent}
              isMutating={isMutating}
              isFull={isFull}
              hasExistingReview={hasExistingReview}
              insetsBottom={insets.bottom}
              onEdit={openReviewForm}
              onSubscribe={async () => {
                await subscribe(event.id);
              }}
              onUnsubscribe={async () => {
                await unsubscribe(event.id);
              }}
              onOpenChat={() => router.push(`/event/chat/${event.member ? event.chat_id : event.id}`)}
              onOpenReview={openReviewForm}
              onOpenReviews={openReviewsList}
          />
        </View>
      </PageLayout>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flexButton: {
    flex: 1,
  },
  devActionWrap: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  devActionButton: {
    width: '100%',
  },
  devBadge: {
    textAlign: 'center',
    fontWeight: '600',
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
  approvalBanner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  approvalTitle: {
    fontWeight: '700',
  },
  approvalText: {
    lineHeight: 22,
  },
  eventTitle: {
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  distanceText: {
    marginBottom: Spacing.two,
    fontWeight: '600',
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
  metaBlock: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  linkButton: {
    marginBottom: Spacing.three,
  },
  linkPopupContent: {
    gap: Spacing.two,
  },
  linkText: {
    lineHeight: 22,
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.one,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: Spacing.two,
    backgroundColor: '#fff',
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
  reviewToggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  reviewToggleButton: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: Spacing.two,
  },
  starButton: {
    margin: 0,
    padding: 0,
    flex: 1,
  },
  reviewListContainer: {
    gap: Spacing.two,
  },
  reviewListItem: {
    borderWidth: 1,
    borderColor: '#dfe3ea',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  reviewListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reviewInput: {
    marginTop: Spacing.two,
  },
  errorText: {
    marginBottom: Spacing.two,
  },
});