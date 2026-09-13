import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useMemo, useState} from 'react';
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
import {Bubble, GiftedChat, type IMessage, InputToolbar, Send,} from 'react-native-gifted-chat';
import {Text, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import PageLayout from '@/components/page-layout';
import {MOCK_CHAT_MESSAGES} from '@/constants/mock-data';
import {Spacing} from '@/constants/theme'; // Подключаем константу Spacing[cite: 2, 3]

const CURRENT_USER_ID = 1;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

function mapMockMessages(): IMessage[] {
    return MOCK_CHAT_MESSAGES.map((message) => ({
        _id: String(message.id),
        text: message.content,
        createdAt: new Date(message.created_at * 1000),
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

    const [messages, setMessages] = useState<IMessage[]>(() => mapMockMessages());
    const [composerText, setComposerText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const messageTitle = useMemo(() => `Чат события #${id ?? '...'}`, [id]);

    const handleDeleteMessage = useCallback((messageId: string) => {
        Alert.alert('Удалить сообщение?', 'Это действие нельзя будет отменить.', [
            {text: 'Отмена', style: 'cancel'},
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: () => {
                    setMessages((currentMessages) =>
                        currentMessages.filter((message) => String(message._id) !== messageId),
                    );
                },
            },
        ]);
    }, []);

    const handleEditMessage = useCallback((messageId: string) => {
        const target = messages.find((message) => String(message._id) === messageId);
        if (!target) return;

        setEditingMessageId(messageId);
        setComposerText(target.text || '');
    }, [messages]);

    const handleLongPress = useCallback((context: unknown, message: IMessage) => {
        if (message.user._id !== CURRENT_USER_ID) return;

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
    }, [handleDeleteMessage, handleEditMessage]);

    const handleSend = useCallback((newMessages: IMessage[] = []) => {
        const rawText = (newMessages[0]?.text ?? composerText).trim();
        if (!rawText) return;

        if (editingMessageId) {
            setMessages((currentMessages) =>
                currentMessages.map((message) =>
                    String(message._id) === editingMessageId
                        ? {...message, text: rawText, createdAt: new Date()}
                        : message,
                ),
            );
            setEditingMessageId(null);
            setComposerText('');
            return;
        }

        setMessages((currentMessages) => [
            {
                _id: String(Date.now()),
                text: rawText,
                createdAt: new Date(),
                user: {
                    _id: CURRENT_USER_ID,
                    name: 'Вы',
                },
            },
            ...currentMessages,
        ]);
        setComposerText('');
    }, [composerText, editingMessageId]);

    return (
        <PageLayout title={messageTitle} icon="arrow-left" onIconPress={() => router.back()}>
            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={[styles.flexOne, {backgroundColor: theme.colors.background}]}>
                        <GiftedChat
                            messages={messages}
                            onSend={handleSend}
                            text={composerText}
                            onLongPressMessage={handleLongPress}
                            showUserAvatar
                            renderUsernameOnMessage // Отображает имена авторов сообщений
                            renderAvatarOnTop={false}
                            bottomOffset={insets.bottom}
                            avatarProps={{
                                containerStyle: {
                                    left: styles.avatarContainer,
                                    right: styles.avatarContainer,
                                },
                            }}
                            renderInputToolbar={(props) => (
                                <InputToolbar
                                    {...props}
                                    containerStyle={[
                                        styles.inputToolbar,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderTopColor: theme.colors.surfaceVariant,
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
                                    }}
                                    containerStyle={{
                                        left: {marginVertical: 4},
                                        right: {marginVertical: 4},
                                    }}
                                    wrapperStyle={{
                                        left: {
                                            maxWidth: MAX_BUBBLE_WIDTH,
                                            backgroundColor: theme.colors.surfaceVariant,
                                            borderRadius: 18,
                                            borderBottomLeftRadius: 4,
                                            paddingHorizontal: Spacing.two, // Отступ Spacing.two внутри бабла[cite: 2, 3]
                                            paddingVertical: Spacing.one,
                                        },
                                        right: {
                                            maxWidth: MAX_BUBBLE_WIDTH,
                                            backgroundColor: theme.colors.primary,
                                            borderRadius: 18,
                                            borderBottomRightRadius: 4,
                                            paddingHorizontal: Spacing.two, // Отступ Spacing.two внутри бабла[cite: 2, 3]
                                            paddingVertical: Spacing.one,
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
                            user={{_id: CURRENT_USER_ID, name: 'Вы'}}
                            listViewProps={{
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
        paddingHorizontal: Spacing.two, // Боковые отступы Spacing.two[cite: 2, 3]
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
        paddingHorizontal: Spacing.two, // Боковые отступы Spacing.two[cite: 2, 3]
        paddingVertical: 6,
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