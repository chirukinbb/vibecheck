// src/app/(tabs)/index.tsx — список событий
import {router} from 'expo-router';
import {FlatList, StyleSheet, View} from 'react-native';
import {Card, Chip, Icon, ProgressBar, Text, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {formatDate, MOCK_EVENTS} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';

export default function EventsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
      <PageLayout title="События">
        <FlatList
            data={MOCK_EVENTS}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.list,
              {paddingBottom: insets.bottom + Spacing.four},
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              const slotsLeft = item.slots - item.reserved;
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
                      {/* Категория с динамическими цветами из темы */}
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

                      {/* Заголовок по гайдлайнам M3 для Cards */}
                      <Text variant="titleLarge" style={styles.cardTitle}>
                        {item.title}
                      </Text>

                      {/* Описание */}
                      <Text
                          variant="bodyMedium"
                          numberOfLines={2}
                          style={{color: theme.colors.onSurfaceVariant}}
                      >
                        {item.description}
                      </Text>

                      {/* Дата + места */}
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

                      {/* Прогресс-бар */}
                      <ProgressBar
                          progress={item.reserved / item.slots}
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
    borderRadius: 0, // Чтобы обложка красиво подходила к краям карточки M3
  },
  cardBody: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
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
