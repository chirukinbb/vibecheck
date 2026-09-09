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
import {useAuthStore, useEventsStore} from '@/stores';

// Проверяем, запущено ли приложение в Expo Go
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

type TabType = 'fetchEvents' | 'fetchOrganizingEvents' | 'fetchAttendingEvents';

export default function EventsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hasPendingRefreshRef = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>('fetchEvents');
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
  const fetchMap: Record<TabType, (page?: number) => Promise<void>> = {
    fetchEvents,
    fetchOrganizingEvents,
    fetchAttendingEvents,
  };

  const screenMap: Record<TabType, '' | 'organizing' | 'attending'> = {
    fetchEvents: '',
    fetchOrganizingEvents: 'organizing',
    fetchAttendingEvents: 'attending',
  };

  // 2. Перезагружаем данные при изменении активного таба
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    const loadData = fetchMap[activeTab];
    if (loadData) {
      void loadData(1);
    }
  }, [activeTab, fetchEvents, fetchOrganizingEvents, fetchAttendingEvents, isAuthenticated]);

  const handleTabChange = (v: string) => {
    const nextTab = v as TabType;
    hasPendingRefreshRef.current = false;
    setHasPendingRefresh(false);
    setScreen(screenMap[nextTab]);
    setActiveTab(nextTab);
  };

  // 3. Подписка на уведомления (только вне Expo Go)
  useEffect(() => {
    // 2. Если это Expo Go, полностью прерываем выполнение hook'а
    if (isExpoGo) {
      return;
    }

    let isMounted = true;
    let receivedSubscription: any;
    let responseSubscription: any;

    const setupNotifications = async () => {
      // 3. Динамически импортируем только когда уверены, что это Dev Build / Standalone
      const Notifications = await import('expo-notifications');

      if (!isMounted) return;

      const handleNotificationData = (data: { action?: string; screen?: string; event_id?: number } | undefined) => {
        if (data?.screen === 'single_event' && typeof data.event_id === 'number') {
          void router.push(`/event/${data.event_id}`);
          return;
        }

        if (data?.action === 'refresh' && data?.screen === 'events' && !hasPendingRefreshRef.current) {
          hasPendingRefreshRef.current = true;
          setHasPendingRefresh(true);
        }
      };

      receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as { action?: string; screen?: string; event_id?: number } | undefined;
        handleNotificationData(data);
      });

      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as { action?: string; screen?: string; event_id?: number } | undefined;
        handleNotificationData(data);
      });
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
    await fetchMap[activeTab](1);
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
            /* Pull-to-refresh вызывают функцию текущего выбранного таба */
            onRefresh={() => void fetchMap[activeTab](1)}
            ListEmptyComponent={
              isLoadingList ? null : (
                  <View style={styles.emptyState}>
                    <Text variant="bodyLarge" style={{color: theme.colors.onSurfaceVariant}}>
                      Событий пока нет
                    </Text>
                  </View>
              )
            }
            renderItem={({item}) => {
              const slotsLeft = item.slots - (item.reserved ?? 0);
              const isFull = slotsLeft <= 0;
              const isAlmostFull = slotsLeft <= 3;

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
  list: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
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
    paddingBottom: Spacing.three,
    paddingRight: Spacing.three,
    paddingLeft: Spacing.three,
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