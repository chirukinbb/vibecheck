// src/app/_layout.tsx — корневой layout: PaperProvider + Stack
import {router, Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {Linking, useColorScheme} from 'react-native';
import {PaperProvider} from 'react-native-paper';

import {useAuthStore} from '@/stores/authStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {paperDarkTheme, paperLightTheme} from '@/theme/paper-theme';

// Проверяем, запущено ли приложение в Expo Go
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

type NotificationRouteTarget =
    | {
    pathname: '/event/[id]';
    params: { id: string };
}
    | null;

function getNotificationRoute(data: unknown): NotificationRouteTarget {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const payload = data as Record<string, unknown>;
    const screen = typeof payload.screen === 'string' ? payload.screen : undefined;
    const eventId = typeof payload.event_id === 'string' || typeof payload.event_id === 'number'
        ? String(payload.event_id)
        : typeof payload.eventId === 'string' || typeof payload.eventId === 'number'
            ? String(payload.eventId)
            : undefined;

    if (screen === 'single_event' && eventId) {
        return {
            pathname: '/event/[id]',
            params: {id: eventId},
        };
    }

    return null;
}

export default function RootLayout() {
    const scheme = useColorScheme();
    const themeMode = useSettingsStore((state) => state.themeMode);
    const {loginWithToken} = useAuthStore();

    useEffect(() => {
        let responseSubscription: { remove: () => void } | undefined;
        let isMounted = true;

        // 1. Асинхронная инициализация Push-уведомлений
        // const setupNotifications = async () => {
        //     // Если это Expo Go — мгновенно выходим, НЕ импортируя модуль
        //     if (isExpoGo) return;
        //
        //     // Импорт выполняется строго после проверки окружения
        //     const Notifications = await import('expo-notifications');
        //
        //     if (!isMounted) return;
        //
        //     Notifications.setNotificationHandler({
        //         handleNotification: async (notification) => {
        //             const route = getNotificationRoute(notification.request.content.data);
        //             return {
        //                 shouldShowBanner: true,
        //                 shouldShowList: true,
        //                 shouldPlaySound: true,
        //                 shouldSetBadge: false,
        //                 priority: Notifications.AndroidNotificationPriority.MAX,
        //                 ...(route ? {triggerId: String(Date.now())} : {}),
        //             };
        //         },
        //     });
        //
        //     const isPushNotificationTarget = (response: any) => {
        //         if (!response) return false;
        //
        //         const raw = response.notification.request.content.data;
        //         const parsed = typeof raw === 'string' ? (() => {
        //             try {
        //                 return JSON.parse(raw);
        //             } catch {
        //                 return raw;
        //             }
        //         })() : raw;
        //
        //         const route = getNotificationRoute(parsed);
        //         if (!route) return false;
        //
        //         router.push(route);
        //         return true;
        //     };
        //
        //     const lastResponse = await Notifications.getLastNotificationResponseAsync();
        //     if (lastResponse && isMounted) {
        //         isPushNotificationTarget(lastResponse);
        //     }
        //
        //     if (isMounted) {
        //         responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        //             isPushNotificationTarget(response);
        //         });
        //     }
        // };
        //
        // void setupNotifications();

        // 2. Логика обработки Deep Link (Работает всегда, включая Expo Go)
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;

            try {
                const parsed = new URL(url);
                const tokenFromUrl = parsed.searchParams.get('token');

                if (parsed.protocol === 'events:' && parsed.hostname === 'auth-callback' && tokenFromUrl) {
                    router.replace({pathname: '/auth-callback', params: {token: tokenFromUrl}});
                    return;
                }

                if (parsed.protocol === 'events:' && parsed.hostname === 'auth-callback' && !tokenFromUrl) {
                    router.replace('/(auth)/login');
                }
            } catch {
                // игнорируем невалидный deep-link
            }
        };

        const subscription = Linking.addEventListener('url', ({url}) => {
            void handleDeepLink(url);
        });

        Linking.getInitialURL().then((url) => {
            void handleDeepLink(url);
        });

        return () => {
            isMounted = false;
            responseSubscription?.remove();
            subscription?.remove();
        };
    }, [loginWithToken]);

    const resolvedScheme = themeMode === 'system' ? scheme : themeMode;
    const paperTheme = resolvedScheme === 'dark' ? paperDarkTheme : paperLightTheme;

    return (
        <PaperProvider theme={paperTheme}>
            <StatusBar/>
            <Stack screenOptions={{headerShown: false}}>
                <Stack.Screen name="index"/>
                <Stack.Screen name="(auth)"/>
                <Stack.Screen name="(tabs)"/>
                <Stack.Screen name="event/[id]"/>
                <Stack.Screen name="event/chat/[id]"/>
            </Stack>
        </PaperProvider>
    );
}