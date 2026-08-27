// src/app/(tabs)/index.tsx — список событий
import {router} from 'expo-router';
import {useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {Card, Chip, Icon, ProgressBar, SegmentedButtons, Text, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {formatDate} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';
import {useAuthStore, useEventsStore} from '@/stores';

type TabType = 'fetchEvents' | 'fetchOrganizingEvents' | 'fetchAttendingEvents';

export default function EventsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('fetchEvents');

  // 1. Достаем нужные методы из store
  const {
    events,
    isLoadingList,
    fetchEvents,
    fetchOrganizingEvents,
    fetchAttendingEvents
  } = useEventsStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Карта сопоставления значений табов с функциями загрузки
  const fetchMap: Record<TabType, () => Promise<void>> = {
    fetchEvents,
    fetchOrganizingEvents,
    fetchAttendingEvents,
  };

  // 2. Перезагружаем данные при изменении активного таба
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    const loadData = fetchMap[activeTab];
    if (loadData) {
      void loadData();
    }
  }, [activeTab, fetchEvents, fetchOrganizingEvents, fetchAttendingEvents, isAuthenticated]);

  const handleTabChange = (v: string) => {
    const nextTab = v as TabType;
    setActiveTab(nextTab);
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
              {paddingBottom: insets.bottom + Spacing.four},
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={isLoadingList}
            /* 3. Pull-to-refresh вызывают функцию текущего выбранного таба */
            onRefresh={() => void fetchMap[activeTab]()}
            ListEmptyComponent={
              isLoadingList
                  ? null
                  : (
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
    paddingLeft: Spacing.three
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