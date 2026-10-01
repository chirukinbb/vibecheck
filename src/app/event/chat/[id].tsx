import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Dimensions, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View,} from 'react-native';

import {Bubble, GiftedChat, type IMessage, InputToolbar,} from 'react-native-gifted-chat';

import {Text, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {Spacing} from '@/constants/theme';
import {getNotificationRoute} from '@/lib/notifications';
import {useEventsStore} from '@/stores';
import {useChatStore} from '@/stores/chatStore';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

const MIN_INPUT_HEIGHT = 40;
const MAX_INPUT_HEIGHT = 116;
const INPUT_LINE_HEIGHT = 20;

function mapChatMessages(
    messages: ReturnType<typeof useChatStore.getState>['messages']
): IMessage[] {
    return messages.map((message) => ({
        _id: String(message.id),
        text: message.content,
        createdAt: new Date(Number(message.created_at) * 1000),
        user: {
            _id: message.author.id,
            name: message.author.profile.name,
            avatar: message.author.profile.avatar_url ?? undefined,
        },
    }));
}

export default function EventChatScreen() {
    const {id} = useLocalSearchParams<{ id: string }>();

    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const {
        messages: chatMessages,
        fetchMessages,
        sendMessage,
        editMessage,
        deleteMessage,
    } = useChatStore();

    const {selectedEvent} = useEventsStore();

    const headerHeight = 56 + insets.top;
    const bottomInset = Math.max(insets.bottom, 8);

    const [composerText, setComposerText] = useState('');
    const [editingMessageId, setEditingMessageId] =
        useState<number | null>(null);

    const [inputHeight, setInputHeight] =
        useState(MIN_INPUT_HEIGHT);

    const messages = useMemo(
        () => mapChatMessages(chatMessages),
        [chatMessages]
    );

    const messageTitle = useMemo(
        () => `Чат события ${selectedEvent?.title ?? '...'}`,
        [selectedEvent?.title]
    );

    useEffect(() => {
        const eventId = Number(id);

        if (!id || Number.isNaN(eventId)) {
            return;
        }

        void fetchMessages(eventId, 1);
    }, [fetchMessages, id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        let cleanup: (() => void) | undefined;

        const refreshIfCurrentChat = (notificationData: unknown) => {
            const route = getNotificationRoute(notificationData);
            const targetId = route && 'params' in route ? String(route.params.id) : undefined;

            if (targetId && targetId === String(id)) {
                void fetchMessages(Number(id), 1);
            }
        };

        const loadNotifications = async () => {
            const Notifications = await import('expo-notifications');

            const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
                refreshIfCurrentChat(notification.request.content.data);
            });

            const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
                refreshIfCurrentChat(response.notification?.request?.content?.data);
            });

            cleanup = () => {
                receivedSubscription.remove();
                responseSubscription.remove();
            };
        };

        void loadNotifications();

        return () => {
            cleanup?.();
        };
    }, [fetchMessages, id]);

    const handleDeleteMessage = useCallback(
        (messageId: string) => {
            const eventId = Number(id);

            if (!id || Number.isNaN(eventId)) {
                return;
            }

            Alert.alert(
                'Удалить сообщение?',
                'Это действие нельзя будет отменить.',
                [
                    {
                        text: 'Отмена',
                        style: 'cancel',
                    },
                    {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteMessage(
                                eventId,
                                Number(messageId)
                            );
                        },
                    },
                ]
            );
        },
        [deleteMessage, id]
    );

    const handleEditMessage = useCallback(
        (messageId: string) => {
            const target = chatMessages.find(
                (message) =>
                    String(message.id) === messageId
            );

            if (!target) {
                return;
            }

            setEditingMessageId(Number(messageId));
            setComposerText(target.content || '');
            setInputHeight(MIN_INPUT_HEIGHT);
        },
        [chatMessages]
    );

    const handleLongPress = useCallback(
        (_context: unknown, message: IMessage) => {
            const currentUserId = Number(id);

            if (currentUserId === 0) {
                return;
            }

            // Редактировать и удалять можно только свои сообщения.
            if (message.user._id !== currentUserId) {
                return;
            }

            Alert.alert('Сообщение', '', [
                {
                    text: 'Редактировать',
                    onPress: () => {
                        handleEditMessage(
                            String(message._id)
                        );
                    },
                },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: () => {
                        handleDeleteMessage(
                            String(message._id)
                        );
                    },
                },
                {
                    text: 'Отмена',
                    style: 'cancel',
                },
            ]);
        },
        [
            handleDeleteMessage,
            handleEditMessage,
            id,
        ]
    );

    const handleSend = useCallback(
        async (newMessages: IMessage[] = []) => {
            const rawText = (
                newMessages[0]?.text ??
                composerText
            ).trim();

            if (!rawText) {
                return;
            }

            const eventId = Number(id);

            if (!id || Number.isNaN(eventId)) {
                return;
            }

            setComposerText('');
            setInputHeight(MIN_INPUT_HEIGHT);

            if (editingMessageId !== null) {
                await editMessage(
                    eventId,
                    editingMessageId,
                    {
                        content: rawText,
                    }
                );

                setEditingMessageId(null);

                return;
            }

            await sendMessage(eventId, {
                content: rawText,
            });
        },
        [
            composerText,
            editMessage,
            editingMessageId,
            id,
            sendMessage,
        ]
    );

    /**
     * Отправка по обычному Pressable.
     *
     * Здесь мы не используем Send из GiftedChat.
     * Это важно для корректного touch на реальном Android/iOS.
     */
    const handleSendPress = useCallback(() => {
        const text = composerText.trim();

        if (!text) {
            return;
        }

        const message: IMessage = {
            _id: String(Date.now()),
            text,
            createdAt: new Date(),
            user: {
                _id: Number(id) || 0,
                name: 'Вы',
            },
        };

        void handleSend([message]);
    }, [composerText, handleSend, id]);

    /**
     * Автоматически изменяем высоту TextInput
     * при добавлении новых строк.
     */
    const handleInputContentSizeChange = useCallback(
        (event: {
            nativeEvent: {
                contentSize: {
                    height: number;
                };
            };
        }) => {
            const contentHeight =
                event.nativeEvent.contentSize.height;

            const nextHeight = Math.min(
                Math.max(
                    MIN_INPUT_HEIGHT,
                    contentHeight
                ),
                MAX_INPUT_HEIGHT
            );

            setInputHeight(nextHeight);
        },
        []
    );

    return (
        <PageLayout
            title={messageTitle}
            icon="arrow-left"
            onIconPress={() => router.back()}
        >
            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
                keyboardVerticalOffset={
                    Platform.OS === 'ios'
                        ? 60
                        : 0
                }
            >
                <View
                    style={[
                        styles.flexOne,
                        {
                            backgroundColor:
                            theme.colors.background,
                        },
                    ]}
                >
                    <GiftedChat
                        messages={messages}
                        onSend={handleSend}
                        text={composerText}
                        onLongPressMessage={
                            handleLongPress
                        }

                        isUserAvatarVisible

                        keyboardAvoidingViewProps={{
                            keyboardVerticalOffset:
                                headerHeight +
                                bottomInset,
                        }}

                        // @ts-ignore
                        bottomOffset={bottomInset}

                        /**
                         * Toolbar
                         */
                        renderInputToolbar={(props) => (
                            <InputToolbar
                                {...props}
                                containerStyle={[
                                    styles.inputToolbar,
                                    {
                                        backgroundColor:
                                        theme.colors
                                            .surface,

                                        borderTopColor:
                                        theme.colors
                                            .surfaceVariant,

                                        paddingBottom:
                                            bottomInset + 6,

                                        paddingTop: 8,
                                    },
                                ]}
                                primaryStyle={
                                    styles.inputToolbarPrimary
                                }
                            />
                        )}

                        /**
                         * Кастомный TextInput.
                         *
                         * Высота автоматически растёт
                         * от 40 до 116 px.
                         */
                        renderComposer={() => (
                            <TextInput
                                value={composerText}
                                onChangeText={
                                    setComposerText
                                }

                                placeholder={
                                    editingMessageId
                                        ? 'Редактируйте сообщение...'
                                        : 'Напишите сообщение...'
                                }

                                placeholderTextColor={
                                    theme.colors
                                        .onSurfaceVariant
                                }

                                multiline

                                scrollEnabled={
                                    inputHeight >=
                                    MAX_INPUT_HEIGHT
                                }

                                onContentSizeChange={
                                    handleInputContentSizeChange
                                }

                                textAlignVertical="center"

                                style={[
                                    styles.composer,
                                    {
                                        height: inputHeight,

                                        color:
                                        theme.colors
                                            .onSurface,

                                        backgroundColor:
                                        theme.colors
                                            .surfaceVariant,
                                    },
                                ]}
                            />
                        )}

                        /**
                         * Сообщения
                         */
                        renderBubble={(props) => (
                            <Bubble
                                {...props}

                                usernameStyle={{
                                    color:
                                    theme.colors
                                        .primary,

                                    fontSize: 12,
                                    fontWeight: '600',
                                    marginBottom: 2,

                                    maxWidth:
                                    MAX_BUBBLE_WIDTH,
                                }}

                                containerStyle={{
                                    left: {
                                        maxWidth:
                                        MAX_BUBBLE_WIDTH,

                                        marginVertical: 4,
                                    },

                                    right: {
                                        maxWidth:
                                        MAX_BUBBLE_WIDTH,

                                        marginVertical: 4,
                                    },
                                }}

                                wrapperStyle={{
                                    left: {
                                        backgroundColor:
                                        theme.colors
                                            .surfaceVariant,

                                        borderRadius: 18,

                                        borderBottomLeftRadius:
                                            4,
                                    },

                                    right: {
                                        backgroundColor:
                                        theme.colors
                                            .primary,

                                        borderRadius: 18,

                                        borderBottomRightRadius:
                                            4,
                                    },
                                }}

                                textStyle={{
                                    left: {
                                        color:
                                        theme.colors
                                            .onSurfaceVariant,

                                        fontSize: 15,
                                        lineHeight: 20,
                                    },

                                    right: {
                                        color:
                                        theme.colors
                                            .onPrimary,

                                        fontSize: 15,
                                        lineHeight: 20,
                                    },
                                }}
                            />
                        )}

                        /**
                         * Своя кнопка отправки.
                         *
                         * Не используем Send из GiftedChat.
                         */
                        renderSend={() => (
                            <Pressable
                                onPress={
                                    handleSendPress
                                }

                                disabled={
                                    !composerText.trim()
                                }

                                hitSlop={8}

                                style={({
                                            pressed,
                                        }) => [
                                    styles.sendButton,

                                    {
                                        backgroundColor:
                                            composerText.trim()
                                                ? theme
                                                    .colors
                                                    .primary
                                                : theme
                                                    .colors
                                                    .surfaceVariant,

                                        opacity:
                                            pressed
                                                ? 0.7
                                                : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.sendButtonText,
                                        {
                                            color:
                                                composerText.trim()
                                                    ? theme
                                                        .colors
                                                        .onPrimary
                                                    : theme
                                                        .colors
                                                        .onSurfaceVariant,
                                        },
                                    ]}
                                >
                                    {editingMessageId
                                        ? 'Сохранить'
                                        : 'Отправить'}
                                </Text>
                            </Pressable>
                        )}

                        user={{
                            _id: Number(id) || 0,
                            name: 'Вы',
                        }}

                        listProps={{
                            contentContainerStyle:
                            styles.listContent,

                            showsVerticalScrollIndicator:
                                false,
                        }}

                        locale="ru"

                        isSendButtonAlwaysVisible
                    />
                </View>
            </KeyboardAvoidingView>
        </PageLayout>
    );
}

const styles = StyleSheet.create({
    flexOne: {
        flex: 1,
    },

    listContent: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.two,
    },

    inputToolbar: {
        borderTopWidth: 1,

        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
    },

    inputToolbarPrimary: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    composer: {
        flex: 1,

        fontSize: 15,
        lineHeight: INPUT_LINE_HEIGHT,

        borderRadius: 20,

        paddingHorizontal: Spacing.two,
        paddingVertical: 8,

        marginRight: Spacing.two,

        minHeight: MIN_INPUT_HEIGHT,
        maxHeight: MAX_INPUT_HEIGHT,
    },

    sendButton: {
        minHeight: 40,

        paddingHorizontal: Spacing.two,
        paddingVertical: 10,

        borderRadius: 20,

        alignItems: 'center',
        justifyContent: 'center',
    },

    sendButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});