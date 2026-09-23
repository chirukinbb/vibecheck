import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {Bubble, GiftedChat, type IMessage, InputToolbar, Send} from 'react-native-gifted-chat';
import {Text, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {Spacing} from '@/constants/theme';
import {useEventsStore} from "@/stores";
import {useChatStore} from '@/stores/chatStore';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

function mapChatMessages(messages: ReturnType<typeof useChatStore.getState>['messages']): IMessage[] {
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
    const {messages: chatMessages, fetchMessages, sendMessage, editMessage, deleteMessage} = useChatStore();
    const {selectedEvent} = useEventsStore();

    // Заменяем useHeaderHeight(): базовый Header равен ~56px + верхний inset устройства
    const headerHeight = 56 + insets.top;

    const [composerText, setComposerText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

    const messages = useMemo(() => mapChatMessages(chatMessages), [chatMessages]);
    const messageTitle = useMemo(() => `Чат события ${selectedEvent?.title ?? '...'}`, [selectedEvent?.title]);

    useEffect(() => {
        const eventId = Number(id);
        if (!id || Number.isNaN(eventId)) return;

        void fetchMessages(eventId, 1);
    }, [fetchMessages, id]);

    const handleDeleteMessage = useCallback((messageId: string) => {
        const eventId = Number(id);
        if (!id || Number.isNaN(eventId)) return;

        Alert.alert('Удалить сообщение?', 'Это действие нельзя будет отменить.', [
            {text: 'Отмена', style: 'cancel'},
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: async () => {
                    await deleteMessage(eventId, Number(messageId));
                },
            },
        ]);
    }, [deleteMessage, id]);

    const handleEditMessage = useCallback((messageId: string) => {
        const target = chatMessages.find((message) => String(message.id) === messageId);
        if (!target) return;

        setEditingMessageId(Number(messageId));
        setComposerText(target.content || '');
    }, [chatMessages]);

    const handleLongPress = useCallback((context: unknown, message: IMessage) => {
        if (message.user._id !== Number(id)) {
            const currentUserId = Number(id);
            if (currentUserId === 0) return;
        }

        Alert.alert('Сообщение', '', [
            {
                text: 'Редактировать',
                onPress: () => handleEditMessage(String(message._id)),
            },
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: () => handleDeleteMessage(String(message._id)),
            },
            {text: 'Отмена', style: 'cancel'},
        ]);
    }, [handleDeleteMessage, handleEditMessage, id]);

    const handleSend = useCallback(async (newMessages: IMessage[] = []) => {
        const rawText = (newMessages[0]?.text ?? composerText).trim();
        if (!rawText) return;

        const eventId = Number(id);
        if (!id || Number.isNaN(eventId)) return;

        if (editingMessageId !== null) {
            await editMessage(eventId, editingMessageId, {content: rawText});
            setEditingMessageId(null);
            setComposerText('');
            return;
        }

        await sendMessage(eventId, {content: rawText});
        setComposerText('');
    }, [composerText, editMessage, editingMessageId, id, sendMessage]);

    return (
        <PageLayout title={messageTitle} icon="arrow-left" onIconPress={() => router.back()}>
            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={[styles.flexOne, {backgroundColor: theme.colors.background}]}>
                        <GiftedChat
                            messages={messages}
                            onSend={handleSend}
                            text={composerText}
                            onLongPressMessage={handleLongPress}
                            isUserAvatarVisible
                            keyboardAvoidingViewProps={{keyboardVerticalOffset: headerHeight}}
                            // @ts-ignore GiftedChat types may not include bottomOffset but runtime uses it
                            bottomOffset={insets.bottom}
                            renderInputToolbar={(props) => (
                                <InputToolbar
                                    {...props}
                                    containerStyle={[
                                        styles.inputToolbar,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderTopColor: theme.colors.surfaceVariant,
                                            marginBottom: insets.bottom > 0 ? 0 : 8,
                                        },
                                    ]}
                                    primaryStyle={styles.inputToolbarPrimary}
                                />
                            )}
                            renderBubble={(props) => (
                                <Bubble
                                    {...props}
                                    usernameStyle={{
                                        color: theme.colors.primary,
                                        fontSize: 12,
                                        fontWeight: '600',
                                        marginBottom: 2,
                                        maxWidth: MAX_BUBBLE_WIDTH,
                                    }}
                                    containerStyle={{
                                        left: {
                                            maxWidth: MAX_BUBBLE_WIDTH,
                                            marginVertical: 4,
                                        },
                                        right: {
                                            maxWidth: MAX_BUBBLE_WIDTH,
                                            marginVertical: 4,
                                        },
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
                                        left: {color: theme.colors.onSurfaceVariant, fontSize: 15, lineHeight: 20},
                                        right: {color: theme.colors.onPrimary, fontSize: 15, lineHeight: 20},
                                    }}
                                />
                            )}
                            textInputProps={{
                                value: composerText,
                                onChangeText: setComposerText,
                                placeholder: editingMessageId ? 'Редактируйте сообщение...' : 'Напишите сообщение...',
                                placeholderTextColor: theme.colors.onSurfaceVariant,
                                style: {
                                    flex: 1,
                                    color: theme.colors.onSurface,
                                    fontSize: 15,
                                    backgroundColor: theme.colors.surfaceVariant,
                                    borderRadius: 20,
                                    paddingHorizontal: Spacing.two,
                                    paddingVertical: 8,
                                    marginRight: Spacing.two,
                                    minHeight: 40,
                                },
                            }}
                            renderSend={(props) => (
                                <Send {...props} containerStyle={styles.sendContainer} isSendButtonAlwaysVisible>
                                    <View style={[styles.sendButton, {backgroundColor: theme.colors.primary}]}>
                                        <Text style={[styles.sendButtonText, {color: theme.colors.onPrimary}]}>
                                            {editingMessageId ? 'Сохранить' : 'Отправить'}
                                        </Text>
                                    </View>
                                </Send>
                            )}
                            user={{_id: Number(id) || 0, name: 'Вы'}}
                            listProps={{
                                contentContainerStyle: styles.listContent,
                                showsVerticalScrollIndicator: false,
                            }}
                            locale="ru"
                            isSendButtonAlwaysVisible
                        />
                    </View>
                </TouchableWithoutFeedback>
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
    avatarContainer: {
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: Spacing.one,
        marginBottom: 0,
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
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {
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