import {useChatStore} from '@/stores';
import {router} from 'expo-router';
import {Platform} from 'react-native';

type NotificationsModule = {
    setNotificationHandler?: (handler: any) => void;
    addNotificationReceivedListener?: (listener: (notification: any) => void) => { remove: () => void };
    addNotificationResponseReceivedListener?: (listener: (response: any) => void) => { remove: () => void };
    getLastNotificationResponseAsync?: () => Promise<any>;
    scheduleNotificationAsync?: (notification: any) => Promise<any>;
    requestPermissionsAsync?: () => Promise<{ status: 'granted' | 'denied' | 'undetermined' | string }>;
    getDevicePushTokenAsync?: () => Promise<{ data: string | null | undefined }>;
    setNotificationChannelAsync?: (channelId: string, options: any) => Promise<any>;
    AndroidNotificationPriority?: { DEFAULT: number | string; MAX: number | string };
    AndroidImportance?: { DEFAULT: number | string; MAX: number | string };
    AndroidNotificationVisibility?: { PUBLIC: number | string };
};

const createWebNotificationsStub = (): NotificationsModule => ({
    setNotificationHandler: () => undefined,
    addNotificationReceivedListener: () => ({remove: () => undefined}),
    addNotificationResponseReceivedListener: () => ({remove: () => undefined}),
    getLastNotificationResponseAsync: async () => undefined,
    scheduleNotificationAsync: async () => undefined,
    requestPermissionsAsync: async () => ({status: 'granted'}),
    getDevicePushTokenAsync: async () => ({data: null}),
    setNotificationChannelAsync: async () => undefined,
    AndroidNotificationPriority: {DEFAULT: 0, MAX: 1},
    AndroidImportance: {DEFAULT: 0, MAX: 1},
    AndroidNotificationVisibility: {PUBLIC: 1},
});

export async function loadNotificationsApi(): Promise<NotificationsModule> {
    if (Platform.OS === 'web') {
        return createWebNotificationsStub();
    }

    try {
        return (await import('expo-notifications')) as unknown as NotificationsModule;
    } catch {
        return createWebNotificationsStub();
    }
}

export type NotificationRouteTarget =
    | {
    pathname: '/event/[id]';
    params: { id: string };
}
    | {
    pathname: '/event/chat/[id]';
    params: { id: string };
}
    | null;

export function parseNotificationData(data: unknown): unknown {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }

    return data;
}

export function getNotificationRoute(data: unknown): NotificationRouteTarget {
    const parsed = parseNotificationData(data);

    if (!parsed || typeof parsed !== 'object') {
        return null;
    }

    const payload = parsed as Record<string, unknown>;
    const screen = typeof payload.screen === 'string' ? payload.screen : undefined;
    const eventId = typeof payload.event_id === 'string' || typeof payload.event_id === 'number'
        ? String(payload.event_id)
        : typeof payload.eventId === 'string' || typeof payload.eventId === 'number'
            ? String(payload.eventId)
            : undefined;
    const chatId = typeof payload.chat_id === 'string' || typeof payload.chat_id === 'number'
        ? String(payload.chat_id)
        : typeof payload.chatId === 'string' || typeof payload.chatId === 'number'
            ? String(payload.chatId)
            : undefined;
    const messageId = typeof payload.message_id === 'string' || typeof payload.message_id === 'number'
        ? String(payload.message_id)
        : typeof payload.messageId === 'string' || typeof payload.messageId === 'number'
            ? String(payload.messageId)
            : undefined;

    if (screen === 'single_event' && eventId) {
        return {
            pathname: '/event/[id]',
            params: {id: eventId},
        };
    }

    if (screen === 'chat' && chatId) {
        return {
            pathname: '/event/chat/[id]',
            params: {id: chatId},
        };
    }

    if (screen === 'chat' && messageId && !chatId) {
        return {
            pathname: '/event/chat/[id]',
            params: {id: messageId},
        };
    }

    return null;
}

function isDataOnlySilentNotification(notification: { request?: { content?: { title?: unknown; body?: unknown } } }): boolean {
    const title = notification?.request?.content?.title;
    const body = notification?.request?.content?.body;

    const isEmpty = (value: unknown) => value === null || value === undefined || String(value).trim() === '';

    return isEmpty(title) && isEmpty(body);
}

export async function setupGlobalNotificationRouting(): Promise<{ remove: () => void }> {
    const Notifications = await loadNotificationsApi();

    Notifications.setNotificationHandler?.({
        handleNotification: async (notification: any) => {
            const route = getNotificationRoute(notification.request.content.data);
            const isSilent = isDataOnlySilentNotification(notification);
            const androidPriority = Notifications.AndroidNotificationPriority ?? {DEFAULT: 0, MAX: 1};

            return {
                shouldShowBanner: !isSilent,
                shouldShowList: !isSilent,
                shouldPlaySound: !isSilent,
                shouldSetBadge: false,
                priority: isSilent
                    ? androidPriority.DEFAULT
                    : androidPriority.MAX,
                ...(route ? {triggerId: String(Date.now())} : {}),
            };
        },
    });

    const handleNotificationResponse = (response: any) => {
        if (!response) return;

        const route = getNotificationRoute(response.notification?.request?.content?.data);
        if (route) {
            router.push(route);
        }
    };

    const lastResponse = await Notifications.getLastNotificationResponseAsync?.();
    if (lastResponse) {
        handleNotificationResponse(lastResponse);
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener?.((notification) => {
        const route = getNotificationRoute(notification.request.content.data);

        const isSilent = isDataOnlySilentNotification(notification);
        const parsed = parseNotificationData(notification.request.content.data) as Record<string, any> | undefined;

        // Handle chat-specific actions coming from server data payloads.
        try {
            const action = parsed?.action as string | undefined;
            const chatIdRaw = parsed?.chat_id ?? parsed?.chatId ?? parsed?.event_id ?? parsed?.eventId ?? parsed?.chat;
            const messageIdRaw = parsed?.message_id ?? parsed?.messageId ?? parsed?.id;

            const chatId = chatIdRaw ? Number(chatIdRaw) : NaN;
            const messageId = messageIdRaw ? Number(messageIdRaw) : NaN;

            if (!Number.isNaN(chatId)) {
                // update/create -> refresh messages for this chat
                if (action === 'update_chat_message' || action === 'create_chat_message' || parsed?.screen === 'chat') {
                    // fetch fresh messages into the store (page 1)
                    void useChatStore.getState().fetchMessages(chatId, 1);
                }

                // delete -> remove message from local store without calling API
                if (action === 'delete_chat_message' && !Number.isNaN(messageId)) {
                    useChatStore.setState((state) => ({
                        messages: state.messages.filter((m) => m.id !== messageId),
                    }));
                }
            }
        } catch {
            // swallow errors — notification handling must not crash app
        }

        // Re-present silent notifications as local banners on Android
        if (isSilent) {
            try {
                const title = (parsed && (parsed.title || parsed.t || parsed.head)) ?? 'Новое уведомление';
                const body = (parsed && (parsed.body || parsed.b || parsed.message)) ?? (route ? (route.pathname.includes('/chat') ? 'Новое сообщение в чате' : 'Новое событие') : 'Откройте приложение для подробностей');

                const channelId = route && 'pathname' in route
                    ? route.pathname.includes('/chat') ? 'chats' : 'events'
                    : 'high_importance';
                const androidPriority = Notifications.AndroidNotificationPriority ?? {DEFAULT: 0, MAX: 1};

                void Notifications.scheduleNotificationAsync?.({
                    content: ({
                        title: String(title),
                        body: String(body),
                        data: notification.request.content.data,
                        android: {
                            channelId,
                            priority: androidPriority.MAX,
                        },
                    } as any),
                    trigger: null,
                });
            } catch {
                // ignore failures to re-present
            }
        }

        if (route) {
            router.push(route);
        }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener?.((response) => {
        handleNotificationResponse(response);
    });

    return {
        remove: () => {
            receivedSubscription?.remove();
            responseSubscription?.remove();
        },
    };
}

export function subscribeToEventListNotifications(
    onEvent: (eventId: number) => void,
    onRefresh: () => void,
): Promise<{ remove: () => void }> {
    return (async () => {
        const Notifications = await loadNotificationsApi();

        const handleNotificationData = (data: { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined) => {
            handleListNotificationData(data, onEvent, onRefresh);
        };

        const receivedSubscription = Notifications.addNotificationReceivedListener?.((notification) => {
            const data = notification.request.content.data as { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined;
            handleNotificationData(data);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener?.((response) => {
            const data = response.notification.request.content.data as { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined;
            handleNotificationData(data);
        });

        return {
            remove: () => {
                receivedSubscription?.remove();
                responseSubscription?.remove();
            },
        };
    })();
}

export function handleListNotificationData(
    data: { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined,
    onEvent: (eventId: number) => void,
    onRefresh: () => void,
): void {
    if (!data) {
        return;
    }

    const eventIdValue =
        typeof data.event_id === 'number' || typeof data.event_id === 'string'
            ? Number(data.event_id)
            : typeof data.eventId === 'number' || typeof data.eventId === 'string'
                ? Number(data.eventId)
                : NaN;

    if (data.screen === 'single_event' && Number.isFinite(eventIdValue)) {
        onEvent(eventIdValue);
        return;
    }

    if (data.action === 'refresh' && data.screen === 'events') {
        onRefresh();
    }
}

export async function requestDeviceFirebaseToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return null;
    }

    try {
        const Notifications = await loadNotificationsApi();

        if (Platform.OS === 'android') {
            // General high importance fallback
            await Notifications.setNotificationChannelAsync?.('high_importance', {
                name: 'Важные уведомления',
                importance: Notifications.AndroidImportance?.MAX,
                vibrationPattern: [0, 250, 250, 250],
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
            });

            // Channel for event-related notifications
            await Notifications.setNotificationChannelAsync?.('events', {
                name: 'События',
                importance: Notifications.AndroidImportance?.DEFAULT,
                vibrationPattern: [0, 150, 100],
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
            });

            // Channel for chat messages
            await Notifications.setNotificationChannelAsync?.('chats', {
                name: 'Чаты',
                importance: Notifications.AndroidImportance?.MAX,
                vibrationPattern: [0, 250, 250],
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
            });
        }

        const {status} = await Notifications.requestPermissionsAsync?.() ?? {status: 'granted'};
        if (status !== 'granted') {
            return null;
        }

        const token = (await Notifications.getDevicePushTokenAsync?.())?.data;
        return typeof token === 'string' && token.length > 0 ? token : null;
    } catch {
        return null;
    }
}
