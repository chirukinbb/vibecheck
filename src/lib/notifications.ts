import {router} from 'expo-router';
import {Platform} from 'react-native';

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
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
            const route = getNotificationRoute(notification.request.content.data);
            const isSilent = isDataOnlySilentNotification(notification);

            return {
                shouldShowBanner: !isSilent,
                shouldShowList: !isSilent,
                shouldPlaySound: !isSilent,
                shouldSetBadge: false,
                priority: isSilent
                    ? Notifications.AndroidNotificationPriority.DEFAULT
                    : Notifications.AndroidNotificationPriority.MAX,
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

    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
        handleNotificationResponse(lastResponse);
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const route = getNotificationRoute(notification.request.content.data);
        if (route) {
            router.push(route);
        }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
    });

    return {
        remove: () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        },
    };
}

export function subscribeToEventListNotifications(
    onEvent: (eventId: number) => void,
    onRefresh: () => void,
): Promise<{ remove: () => void }> {
    return (async () => {
        const Notifications = await import('expo-notifications');

        const handleNotificationData = (data: { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined) => {
            handleListNotificationData(data, onEvent, onRefresh);
        };

        const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data as { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined;
            handleNotificationData(data);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as { action?: string; screen?: string; event_id?: number | string; eventId?: number | string } | undefined;
            handleNotificationData(data);
        });

        return {
            remove: () => {
                receivedSubscription.remove();
                responseSubscription.remove();
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
        const Notifications = await import('expo-notifications');

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('high_importance', {
                name: 'Важные уведомления',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            });
        }

        const {status} = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            return null;
        }

        const token = (await Notifications.getDevicePushTokenAsync()).data;
        return typeof token === 'string' && token.length > 0 ? token : null;
    } catch {
        return null;
    }
}
