// src/app/(tabs)/index.tsx — список событий
import Constants, {AppOwnership} from 'expo-constants';
import {router} from 'expo-router';
import {useEffect, useRef, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {Button, Card, Chip, Icon, ProgressBar, SegmentedButtons, Text, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {formatDate} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {subscribeToEventListNotifications} from '@/lib/notifications';
import {useAuthStore, useEventsStore} from '@/stores';

// Проверяем, запущено ли приложение в Expo Go
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

type TabType = 'fetchEvents' | 'fetchOrganizingEvents' | 'fetchAttendingEvents';

export default function EventsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hasPendingRefreshRef = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>('fetchEvents');
  const [secondaryTab, setSecondaryTab] = useState<'upcoming' | 'archive'>('upcoming');
  const [hasPendingRefresh, setHasPendingRefresh] = useState(false);

  // 1. Достаем нужные методы из store
  const {
    events,
    meta,
    isLoadingList,
    setScreen,
    fetchEvents,
    fetchOrganizingEvents,
    fetchAttendingEvents,
    fetchNextPage,
  } = useEventsStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Карта сопоставления значений табов с функциями загрузки
  const fetchMap: Record<TabType, (page?: number, status?: 'upcoming' | 'archive') => Promise<void>> = {
    fetchEvents,
    fetchOrganizingEvents,
    fetchAttendingEvents,
  };

  const screenMap: Record<TabType, '' | 'organizing' | 'attending'> = {
    fetchEvents: '',
    fetchOrganizingEvents: 'organizing',
    fetchAttendingEvents: 'attending',
  };

  const isSecondaryTabVisible = activeTab === 'fetchOrganizingEvents' || activeTab === 'fetchAttendingEvents';

  // 2. Перезагружаем данные при изменении активного таба
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    const loadData = fetchMap[activeTab];
    if (loadData) {
      void loadData(1, isSecondaryTabVisible ? secondaryTab : undefined);
    }
  }, [activeTab, fetchEvents, fetchOrganizingEvents, fetchAttendingEvents, isAuthenticated, isSecondaryTabVisible, secondaryTab]);

  const handleTabChange = (v: string) => {
    const nextTab = v as TabType;
    hasPendingRefreshRef.current = false;
    setHasPendingRefresh(false);
    setScreen(screenMap[nextTab]);
    setActiveTab(nextTab);
    setSecondaryTab('upcoming');
  };

  // 3. Подписка на уведомления (только вне Expo Go)
  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    let isMounted = true;
    let receivedSubscription: any;
    let responseSubscription: any;

    const setupNotifications = async () => {
      if (!isMounted) return;

      const cleanup = await subscribeToEventListNotifications(
          (eventId) => {
            void router.push(`/event/${eventId}`);
          },
          () => {
            if (!hasPendingRefreshRef.current) {
              hasPendingRefreshRef.current = true;
              setHasPendingRefresh(true);
            }
          },
      );

      receivedSubscription = cleanup;
      responseSubscription = cleanup;
    };

    void setupNotifications();

    return () => {
      isMounted = false;
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, []);

  const handleShowNewEvents = async () => {
    hasPendingRefreshRef.current = false;
    setHasPendingRefresh(false);
    await fetchMap[activeTab](1, isSecondaryTabVisible ? secondaryTab : undefined);
  };

  return (
      <PageLayout title="События">
        <SegmentedButtons
            value={activeTab}
            onValueChange={handleTabChange}
            style={[styles.segmented, {backgroundColor: theme.colors.surface}]}
            buttons={[
              {value: 'fetchEvents', label: 'Лента'},
              {value: 'fetchOrganizingEvents', label: 'Автор'},
              {value: 'fetchAttendingEvents', label: 'Гость'},
            ]}
        />

        {/* Вторичный уровень: тот же компонент, но компактнее */}
        {isSecondaryTabVisible && (
            <SegmentedButtons
                value={secondaryTab}
                onValueChange={(v) => setSecondaryTab(v as 'upcoming' | 'archive')}
                density="high"
                style={[styles.segmented, styles.secondarySegmented, {backgroundColor: theme.colors.surface}]}
                theme={{roundness: 4}}
                buttons={[
                  {
                    value: 'upcoming',
                    label: 'Предстоящие',
                    style: styles.secondaryButton,
                    labelStyle: styles.secondaryLabel,
                    showSelectedCheck: false,
                  },
                  {
                    value: 'archive',
                    label: 'Архив',
                    style: styles.secondaryButton,
                    labelStyle: styles.secondaryLabel,
                    showSelectedCheck: false,
                  },
                ]}
            />
        )}

        <FlatList
            data={events}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.list,
              {paddingBottom: insets.bottom + Spacing.four + 72},
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={isLoadingList}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (!isLoadingList && meta && meta.current_page < meta.last_page) {
                void fetchNextPage();
              }
            }}
            onRefresh={() => void fetchMap[activeTab](1, isSecondaryTabVisible ? secondaryTab : undefined)}
            ListEmptyComponent={
              isLoadingList ? null : (
                  <View style={styles.emptyState}>
                    <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant}}>
                      {secondaryTab === 'upcoming' ? 'Предстоящих событий пока нет' : 'Архивных событий пока нет'}
                    </Text>
                  </View>
              )
            }
            renderItem={({item}) => {
              const slotsLeft = item.slots - (item.reserved ?? 0);
              const isFull = slotsLeft <= 0;
              const isAlmostFull = slotsLeft <= 3;
              const distanceText = item.distance_km != null ? `≈ ${item.distance_km} км` : null;

              const statusColor = isFull
                  ? theme.colors.error
                  : isAlmostFull
                      ? theme.colors.error
                      : theme.colors.primary;

              return (
                  <Card
                      mode="outlined"
                      onPress={() => router.push(`/event/${item.id}`)}
                      style={styles.card}
                  >
                    <Card.Cover
                        source={{uri: item.thumbnail_url}}
                        style={styles.thumb}
                    />

                    <Card.Content style={styles.cardBody}>
                      <Card.Content style={styles.badgeRow}>
                        <Chip
                            compact
                            mode="flat"
                            style={{
                              backgroundColor: theme.colors.secondaryContainer,
                            }}
                            textStyle={{
                              color: theme.colors.onSecondaryContainer,
                            }}
                        >
                          {item.category}
                        </Chip>
                      </Card.Content>

                      <Text variant="titleLarge" style={styles.cardTitle}>
                        {item.title}
                      </Text>

                      <Text
                          variant="bodyMedium"
                          numberOfLines={2}
                          style={{color: theme.colors.onSurfaceVariant}}
                      >
                        {item.description}
                      </Text>

                      {distanceText && (
                          <View style={styles.distanceRow}>
                            <Icon
                                source="map-marker-distance"
                                size={16}
                                color={theme.colors.primary}
                            />
                            <Text variant="bodyMedium" style={{color: theme.colors.primary}}>
                              {distanceText}
                            </Text>
                          </View>
                      )}

                      <View style={styles.cardFooter}>
                        <View style={styles.dateContainer}>
                          <Icon
                              source="calendar"
                              size={18}
                              color={theme.colors.onSurfaceVariant}
                          />
                          <Text
                              variant="bodyMedium"
                              style={{color: theme.colors.onSurfaceVariant}}
                          >
                            {formatDate(item.planing_time)}
                          </Text>
                        </View>

                        <Text
                            variant="labelLarge"
                            style={{color: statusColor, fontWeight: '600'}}
                        >
                          {isFull
                              ? 'Мест нет'
                              : `${slotsLeft} из ${item.slots} мест`}
                        </Text>
                      </View>

                      <ProgressBar
                          progress={(item.reserved ?? 0) / (item.slots || 1)}
                          color={statusColor}
                          style={styles.progressBar}
                      />
                    </Card.Content>
                  </Card>
              );
            }}
        />

        {hasPendingRefresh && (
            <View style={[styles.fabContainer, {bottom: 24 + insets.bottom}]} pointerEvents="box-none">
              <Button
                  mode="contained"
                  icon="refresh"
                  onPress={handleShowNewEvents}
                  style={styles.fabButton}
                  contentStyle={styles.fabContent}
              >
                Показать новые
              </Button>
            </View>
        )}
      </PageLayout>
  );
}

const styles = StyleSheet.create({
  /* Вторичный уровень */
  secondarySegmented: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four, // уже, чем основной: визуально «внутри» него
  },
  secondaryButton: {
    minHeight: 30,
  },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  list: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two, // Ритм отступов (12px до списка)
    gap: Spacing.three,
  },
  card: {
    overflow: 'hidden',
  },
  thumb: {
    height: 180,
    borderRadius: 0,
  },
  cardBody: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  segmented: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },


  /* Компактный вторичный уровень табов */
  secondaryContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two, // 12px до списка контента
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  secondaryWrapper: {
    flexDirection: 'row',
    borderRadius: 999, // Полная таблетка
    borderWidth: 1, // Единая обводка 1px
    padding: 2,
    width: '100%',
  },

  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  fabButton: {
    borderRadius: 999,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  fabContent: {
    height: 48,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.one,
  },
});