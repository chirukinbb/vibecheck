import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Dimensions, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View,} from 'react-native';

import {Bubble, GiftedChat, type IMessage, InputToolbar} from 'react-native-gifted-chat';

import {Text, useTheme} from 'react-native-paper';

import AppPopup from '@/components/app-popup';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {Spacing} from '@/constants/theme';
import {getNotificationRoute, loadNotificationsApi} from '@/lib/notifications';
import {useEventsStore} from '@/stores';
import {useAuthStore} from '@/stores/authStore'; // <-- подставь свой стор с текущим пользователем
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
    const eventId = Number(id);
    const isEventIdValid = !!id && !Number.isNaN(eventId);

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

    // ID текущего пользователя (НЕ id события)
    const currentUserId = useAuthStore((state) => state.id);
    useAuthStore((state) => console.log(state)); // подписка на профиль, чтобы обновлялся при изменении

    const headerHeight = 56 + insets.top;
    const bottomInset = Math.max(insets.bottom, 8);

    const inputRef = useRef<TextInput>(null);

    const [composerText, setComposerText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
    const [popup, setPopup] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        actions: Array<{ text: string; onPress?: () => void | Promise<void>; style?: 'default' | 'cancel' | 'destructive' }>;
    }>({
        visible: false,
        title: '',
        actions: [],
    });

    const messages = useMemo(() => mapChatMessages(chatMessages), [chatMessages]);

    const messageTitle = useMemo(
        () => `Чат события ${selectedEvent?.title ?? '...'}`,
        [selectedEvent?.title]
    );

    const editingMessage = useMemo(
        () =>
            editingMessageId === null
                ? undefined
                : chatMessages.find((m) => m.id === editingMessageId),
        [chatMessages, editingMessageId]
    );

    const canSend = composerText.trim().length > 0;

    /* ----------------------------- загрузка ----------------------------- */

    useEffect(() => {
        if (!isEventIdValid) return;
        void fetchMessages(eventId, 1);
    }, [fetchMessages, eventId, isEventIdValid]);

    useEffect(() => {
        if (!id) return;

        let cleanup: (() => void) | undefined;
        let cancelled = false;

        const refreshIfCurrentChat = (notificationData: unknown) => {
            const route = getNotificationRoute(notificationData);
            const targetId =
                route && 'params' in route ? String(route.params.id) : undefined;

            if (targetId && targetId === String(id)) {
                void fetchMessages(Number(id), 1);
            }
        };

        const loadNotifications = async () => {
            const Notifications = await loadNotificationsApi();
            if (cancelled) return;

            const receivedSubscription = Notifications.addNotificationReceivedListener?.(
                (notification) => {
                    refreshIfCurrentChat(notification.request.content.data);
                }
            );

            const responseSubscription =
                Notifications.addNotificationResponseReceivedListener?.((response) => {
                    refreshIfCurrentChat(response.notification?.request?.content?.data);
                });

            cleanup = () => {
                receivedSubscription?.remove();
                responseSubscription?.remove();
            };
        };

        void loadNotifications();

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [fetchMessages, id]);

    /* ------------------------ редактирование/удаление ------------------------ */

    const cancelEditing = useCallback(() => {
        setEditingMessageId(null);
        setComposerText('');
        setInputHeight(MIN_INPUT_HEIGHT);
    }, []);

    const handleEditMessage = useCallback(
        (messageId: string) => {
            const target = chatMessages.find((m) => String(m.id) === messageId);
            if (!target) return;

            setEditingMessageId(target.id);
            setComposerText(target.content || '');
            setInputHeight(MIN_INPUT_HEIGHT);

            // даём стейту обновиться и фокусируем поле
            setTimeout(() => inputRef.current?.focus(), 50);
        },
        [chatMessages]
    );

    const showPopup = useCallback(
        (title: string, message?: string, actions: Array<{ text: string; onPress?: () => void | Promise<void>; style?: 'default' | 'cancel' | 'destructive' }> = []) => {
            setPopup({visible: true, title, message, actions});
        },
        []
    );

    const hidePopup = useCallback(() => {
        setPopup((prev) => ({...prev, visible: false}));
    }, []);

    const handleDeleteMessage = useCallback(
        (messageId: string) => {
            if (!isEventIdValid) return;

            showPopup('Удалить сообщение?', 'Это действие нельзя будет отменить.', [
                {text: 'Отмена', style: 'cancel', onPress: hidePopup},
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            hidePopup();
                            await deleteMessage(eventId, Number(messageId));

                            // если удалили сообщение, которое как раз редактировали
                            if (editingMessageId === Number(messageId)) {
                                cancelEditing();
                            }
                        } catch {
                            showPopup('Ошибка', 'Не удалось удалить сообщение', [
                                {text: 'Закрыть', onPress: hidePopup},
                            ]);
                        }
                    },
                },
            ]);
        },
        [cancelEditing, deleteMessage, editingMessageId, eventId, hidePopup, isEventIdValid, showPopup]
    );

    const openMessageActions = useCallback(
        (message?: unknown) => {
            if (currentUserId == null || !message) return;

            const typedMessage = message as Partial<IMessage> & {
                id?: number | string;
                author?: { id?: number | string };
                user?: { _id?: number | string };
                text?: string;
            };

            const messageAuthorId = typedMessage.author?.id ?? typedMessage.user?._id;
            if (String(messageAuthorId) !== String(currentUserId)) return;

            const messageId = String(typedMessage._id ?? typedMessage.id ?? '');
            if (!messageId) return;

            const preview = typeof typedMessage.text === 'string'
                ? typedMessage.text.trim()
                : '';

            showPopup(
                'Сообщение',
                preview
                    ? preview.length > 120
                        ? `${preview.slice(0, 120)}…`
                        : preview
                    : 'Выберите действие с этим сообщением.',
                [
                    {
                        text: 'Редактировать',
                        style: 'default',
                        onPress: () => handleEditMessage(messageId),
                    },
                    {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: () => handleDeleteMessage(messageId),
                    },
                ]
            );
        },
        [currentUserId, handleDeleteMessage, handleEditMessage, hidePopup, showPopup]
    );

    /**
     * Долгий тап: меню показываем только для своих сообщений.
     * GiftedChat передаёт IMessage, а серверные сообщения имеют author.id.
     */
    const handleLongPress = useCallback(
        (_context: unknown, message?: unknown) => {
            openMessageActions(message);
        },
        [openMessageActions]
    );

    const handleWebContextMenu = useCallback(
        (event: { preventDefault?: () => void }, message?: unknown) => {
            if (Platform.OS !== 'web') return;
            event?.preventDefault?.();
            openMessageActions(message);
        },
        [openMessageActions]
    );

    /* ------------------------------ отправка ------------------------------ */

    const submit = useCallback(async () => {
        const text = composerText.trim();
        if (!text || !isEventIdValid) return;

        const editId = editingMessageId;

        // Редактирование без изменений — просто выходим из режима
        if (editId !== null && editingMessage?.content === text) {
            cancelEditing();
            return;
        }

        setComposerText('');
        setInputHeight(MIN_INPUT_HEIGHT);
        setEditingMessageId(null);

        try {
            if (editId !== null) {
                await editMessage(eventId, editId, {content: text});
            } else {
                await sendMessage(eventId, {content: text});
            }
        } catch {
            // возвращаем текст, чтобы пользователь не потерял его
            setComposerText(text);
            setEditingMessageId(editId);
            showPopup(
                'Ошибка',
                editId !== null
                    ? 'Не удалось сохранить изменения'
                    : 'Не удалось отправить сообщение',
                [{text: 'Закрыть', onPress: hidePopup}]
            );
        }
    }, [
        cancelEditing,
        composerText,
        editMessage,
        editingMessage?.content,
        editingMessageId,
        eventId,
        isEventIdValid,
        hidePopup,
        sendMessage,
        showPopup,
    ]);

    const handleInputContentSizeChange = useCallback(
        (event: { nativeEvent: { contentSize: { height: number } } }) => {
            const contentHeight = event.nativeEvent.contentSize.height;
            setInputHeight(
                Math.min(Math.max(MIN_INPUT_HEIGHT, contentHeight), MAX_INPUT_HEIGHT)
            );
        },
        []
    );

    /* -------------------------------- render -------------------------------- */

    return (
        <PageLayout
            title={messageTitle}
            icon="arrow-left"
            onIconPress={() => router.back()}
        >
            <AppPopup
                visible={popup.visible}
                onDismiss={hidePopup}
                header={popup.title}
                body={
                    popup.message ? (
                        <Text variant="bodyMedium"
                              style={[styles.popupMessage, {color: theme.colors.onSurfaceVariant}]}>
                            {popup.message}
                        </Text>
                    ) : null
                }
                actions={popup.actions.map((action) => ({
                    label: action.text,
                    onPress: async () => {
                        hidePopup();
                        if (action.onPress) {
                            await action.onPress();
                        }
                    },
                    mode:
                        action.style === 'destructive'
                            ? 'contained'
                            : action.style === 'cancel'
                                ? 'text'
                                : 'outlined',
                    textColor:
                        action.style === 'destructive'
                            ? theme.colors.onError
                            : action.style === 'cancel'
                                ? theme.colors.onSurfaceVariant
                                : theme.colors.primary,
                    buttonColor:
                        action.style === 'destructive'
                            ? theme.colors.error
                            : action.style === 'cancel'
                                ? 'transparent'
                                : 'transparent',
                }))}
                style={[styles.popupContainer, {backgroundColor: theme.colors.surface}]}
            />

            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <View style={[styles.flexOne, {backgroundColor: theme.colors.background}]}>
                    <GiftedChat
                        messages={messages}
                        onSend={() => void submit()}
                        text={composerText}
                        onLongPressMessage={handleLongPress}
                        isUserAvatarVisible
                        isInverted={false}
                        keyboardAvoidingViewProps={{
                            keyboardVerticalOffset: headerHeight + bottomInset,
                        }}
                        // @ts-ignore
                        bottomOffset={bottomInset}
                        user={{
                            _id: currentUserId ?? 0,
                            name: 'Вы',
                        }}
                        locale="ru"
                        isSendButtonAlwaysVisible
                        listProps={{
                            contentContainerStyle: styles.listContent,
                            showsVerticalScrollIndicator: false,
                        }}
                        renderInputToolbar={(props) => (
                            <View>
                                {editingMessageId !== null && (
                                    <View
                                        style={[
                                            styles.editBanner,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderTopColor: theme.colors.surfaceVariant,
                                            },
                                        ]}
                                    >
                                        <View style={styles.flexOne}>
                                            <Text
                                                style={[
                                                    styles.editBannerTitle,
                                                    {color: theme.colors.primary},
                                                ]}
                                            >
                                                Редактирование
                                            </Text>
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    color: theme.colors.onSurfaceVariant,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {editingMessage?.content}
                                            </Text>
                                        </View>

                                        <Pressable onPress={cancelEditing} hitSlop={12}>
                                            <Text
                                                style={{
                                                    color: theme.colors.onSurfaceVariant,
                                                    fontSize: 20,
                                                }}
                                            >
                                                ✕
                                            </Text>
                                        </Pressable>
                                    </View>
                                )}

                                <InputToolbar
                                    {...props}
                                    containerStyle={[
                                        styles.inputToolbar,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderTopColor: theme.colors.surfaceVariant,
                                            paddingBottom: bottomInset + 6,
                                            paddingTop: 8,
                                        },
                                    ]}
                                    primaryStyle={styles.inputToolbarPrimary}
                                />
                            </View>
                        )}
                        renderComposer={() => (
                            <TextInput
                                ref={inputRef}
                                value={composerText}
                                onChangeText={setComposerText}
                                placeholder={
                                    editingMessageId !== null
                                        ? 'Редактируйте сообщение...'
                                        : 'Напишите сообщение...'
                                }
                                placeholderTextColor={theme.colors.onSurfaceVariant}
                                multiline
                                scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
                                onContentSizeChange={handleInputContentSizeChange}
                                textAlignVertical="center"
                                style={[
                                    styles.composer,
                                    {
                                        height: inputHeight,
                                        color: theme.colors.onSurface,
                                        backgroundColor: theme.colors.surfaceVariant,
                                    },
                                ]}
                            />
                        )}
                        renderBubble={(bubbleProps) => {
                            const currentMessage = bubbleProps.currentMessage as
                                | (Partial<IMessage> & {
                                id?: number | string;
                                author?: { id?: number | string };
                                user?: { _id?: number | string };
                            })
                                | undefined;

                            const ContextMenuWrapper = Pressable as unknown as React.ComponentType<any>;

                            return (
                                <ContextMenuWrapper
                                    onContextMenu={(event: any) => {
                                        if (Platform.OS === 'web') {
                                            handleWebContextMenu(event, currentMessage);
                                        }
                                    }}
                                >
                                    <Bubble
                                        {...bubbleProps}
                                        onLongPressMessage={handleLongPress}
                                        touchableProps={{
                                            delayLongPress: 450,
                                        }}
                                        usernameStyle={{
                                            color: theme.colors.primary,
                                            fontSize: 12,
                                            fontWeight: '600',
                                            marginBottom: 2,
                                            maxWidth: MAX_BUBBLE_WIDTH,
                                        }}
                                        containerStyle={{
                                            left: {maxWidth: MAX_BUBBLE_WIDTH, marginVertical: 4},
                                            right: {maxWidth: MAX_BUBBLE_WIDTH, marginVertical: 4},
                                        }}
                                        wrapperStyle={{
                                            left: {
                                                backgroundColor: theme.colors.surfaceVariant,
                                                borderRadius: 18,
                                                borderBottomLeftRadius: 4,
                                            },
                                            right: {
                                                backgroundColor: theme.colors.primary,
                                                borderRadius: 18,
                                                borderBottomRightRadius: 4,
                                            },
                                        }}
                                        textStyle={{
                                            left: {
                                                color: theme.colors.onSurfaceVariant,
                                                fontSize: 15,
                                                lineHeight: 20,
                                            },
                                            right: {
                                                color: theme.colors.onPrimary,
                                                fontSize: 15,
                                                lineHeight: 20,
                                            },
                                        }}
                                    />
                                </ContextMenuWrapper>
                            );
                        }}
                        renderSend={() => (
                            <Pressable
                                onPress={() => void submit()}
                                disabled={!canSend}
                                hitSlop={8}
                                style={({pressed}) => [
                                    styles.sendButton,
                                    {
                                        backgroundColor: canSend
                                            ? theme.colors.primary
                                            : theme.colors.surfaceVariant,
                                        opacity: pressed ? 0.7 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.sendButtonText,
                                        {
                                            color: canSend
                                                ? theme.colors.onPrimary
                                                : theme.colors.onSurfaceVariant,
                                        },
                                    ]}
                                >
                                    {editingMessageId !== null ? 'Сохранить' : 'Отправить'}
                                </Text>
                            </Pressable>
                        )}
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

    editBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingHorizontal: Spacing.two,
        paddingTop: 8,
        gap: 12,
    },

    editBannerTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    popupContainer: {
        margin: 20,
        padding: 20,
        borderRadius: 16,
        maxWidth: 420,
        width: '90%',
        alignSelf: 'center',
    },
    popupTitle: {
        marginBottom: 8,
        fontSize: 18,
        fontWeight: '700',
    },
    popupMessage: {
        marginBottom: 16,
        lineHeight: 22,
    },
    popupActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    popupActionButton: {
        borderRadius: 10,
        minWidth: 88,
    },
    popupActionLabel: {
        fontWeight: '600',
        letterSpacing: 0.1,
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