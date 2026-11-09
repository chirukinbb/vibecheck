import {StyleSheet, View} from 'react-native';
import {Button, Surface, useTheme} from 'react-native-paper';

import {Spacing} from '@/constants/theme';

type EventFooterProps = {
  variant: 'organizer' | 'member' | 'guest';
  isArchivedEvent: boolean;
  isMutating: boolean;
  isFull: boolean;
  hasExistingReview: boolean;
  insetsBottom: number;
  onEdit?: () => void;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  onOpenChat?: () => void;
  onOpenReview?: () => void;
  onOpenReviews?: () => void;
};

export default function EventFooter({
                                      variant,
                                      isArchivedEvent,
                                      isMutating,
                                      isFull,
                                      hasExistingReview,
                                      insetsBottom,
                                      onEdit,
                                      onSubscribe,
                                      onUnsubscribe,
                                      onOpenChat,
                                      onOpenReview,
                                      onOpenReviews,
                                    }: EventFooterProps) {
  const theme = useTheme();

  console.log('EventFooter render', {
    variant,
    isArchivedEvent
  });

  return (
      <Surface
          elevation={2}
          style={[
            styles.footer,
            {
              paddingBottom: insetsBottom + Spacing.three,
              backgroundColor: theme.colors.elevation.level2,
              borderTopColor: theme.colors.outlineVariant,
            },
          ]}
      >
        {isArchivedEvent ? (
            variant === 'organizer' ? (
                <Button
                    mode="contained"
                    icon="star"
                    onPress={onOpenReviews}
                    style={styles.bottomButton}
                    compact
                >
                  Посмотреть отзывы
                </Button>
            ) : variant === 'member' ? (
                <Button
                    mode="contained"
                    icon="star"
                    onPress={onOpenReview}
                    style={styles.bottomButton}
                    compact
                >
                  {hasExistingReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
                </Button>
            ) : null
        ) : variant === 'organizer' ? (
            <View style={styles.actionRow}>
              <Button
                  mode="outlined"
                  icon="pencil"
                  onPress={onEdit}
                  style={styles.flexButton}
                  compact
              >
                Изменить
              </Button>

              <Button
                  mode="contained"
                  icon="chat"
                  onPress={onOpenChat}
                  style={styles.flexButton}
                  compact
              >
                Чат
              </Button>
            </View>
        ) : variant === 'member' ? (
            <View style={styles.actionRow}>
              <Button
                  mode="outlined"
                  onPress={onUnsubscribe}
                  loading={isMutating}
                  disabled={isMutating}
                  style={styles.flexButton}
                  compact
              >
                {isMutating ? 'Отписываем…' : 'Отписаться'}
              </Button>

              <Button
                  mode="contained"
                  icon="chat"
                  onPress={onOpenChat}
                  style={styles.flexButton}
                  compact
              >
                Чат
              </Button>
            </View>
        ) : (
            <Button
                mode="contained"
                onPress={onSubscribe}
                loading={isMutating}
                disabled={isMutating || isFull}
                style={styles.bottomButton}
            >
              {isMutating
                  ? 'Записываем…'
                  : isFull
                      ? 'Мест нет'
                      : 'Записаться'}
            </Button>
        )}
      </Surface>
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
});
