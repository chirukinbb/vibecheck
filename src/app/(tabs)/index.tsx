// src/app/(tabs)/index.tsx — список событий
import {router} from 'expo-router';
import {FlatList, StyleSheet, View} from 'react-native';
import {Card, Chip, ProgressBar, Surface, Text, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {formatDate, MOCK_EVENTS} from '@/constants/mock-data';
import {MaxContentWidth, Spacing} from '@/constants/theme';

export default function EventsListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
      <Surface style={styles.root} mode="flat">
        <FlatList
            data={MOCK_EVENTS}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.list,
              {
                paddingTop: insets.top + Spacing.three,
                paddingBottom: insets.bottom + 100,
              },
            ]}
            ListHeaderComponent={
              <Text variant="headlineMedium" style={styles.pageTitle}>
                События
              </Text>
            }
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              const slotsLeft = item.slots - item.reserved;
              const isFull = slotsLeft <= 0;
              const isAlmostFull = slotsLeft <= 3;

              return (
                  <Card
                      onPress={() => router.push(`/event/${item.id}`)}
                      style={styles.card}
                  >
                    <Card.Cover
                        source={{uri: item.thumbnail_url}}
                        style={styles.thumb}
                    />

                    <Card.Content style={styles.cardBody}>
                      {/* Категория */}
                      <Chip
                          compact
                          style={styles.categoryBadge}
                          textStyle={styles.categoryText}
                      >
                        {item.category}
                      </Chip>

                      {/* Заголовок */}
                      <Text variant="bodyLarge" style={{fontWeight: '700'}}>
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
                        <Text
                            variant="bodyMedium"
                            style={{color: theme.colors.onSurfaceVariant}}
                        >
                          📅 {formatDate(item.planing_time)}
                        </Text>
                        <Text
                            variant="labelLarge"
                            style={{
                              color: isAlmostFull
                                  ? theme.colors.error
                                  : theme.colors.primary,
                            }}
                        >
                          {isFull
                              ? 'Мест нет'
                              : `${slotsLeft} из ${item.slots} мест`}
                        </Text>
                      </View>

                      {/* Прогресс-бар */}
                      <ProgressBar
                          progress={item.reserved / item.slots}
                          color={
                            isFull ? theme.colors.error : theme.colors.primary
                          }
                          style={styles.progressBar}
                      />
                    </Card.Content>
                  </Card>
              );
            }}
        />
      </Surface>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  list: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  pageTitle: {
    fontWeight: '700',
    paddingVertical: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  thumb: {height: 180},
  cardBody: {
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  categoryBadge: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    height: 28,
    alignSelf: 'flex-start',
  },
  categoryText: {color: '#FFFFFF', fontSize: 12},
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.one,
  },
});
