// src/app/_layout.tsx — корневой layout: PaperProvider + Stack
import {router, Stack} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {Linking, useColorScheme} from 'react-native';
import {PaperProvider} from 'react-native-paper';

import {setupGlobalNotificationRouting} from '@/lib/notifications';
import {useAuthStore} from '@/stores/authStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {paperDarkTheme, paperLightTheme} from '@/theme/paper-theme';

export default function RootLayout() {
    const scheme = useColorScheme();
    const themeMode = useSettingsStore((state) => state.themeMode);
    const {loginWithToken} = useAuthStore();

    useEffect(() => {
        let notificationCleanup: { remove: () => void } | undefined;
        let isMounted = true;

        const setupNotifications = async () => {
            if (!isMounted) return;
            notificationCleanup = await setupGlobalNotificationRouting();
        };

        const checkStoredTokenAndBootstrap = async () => {
            try {
                const stored = await SecureStore.getItemAsync('auth_token');
                if (stored) {
                    // if token exists, reuse bootstrap flow
                    router.replace(`/bootstrap/${encodeURIComponent(stored)}`);
                    return;
                }
            } catch {
                // ignore SecureStore errors
            }

            void setupNotifications();
        };

        void checkStoredTokenAndBootstrap();

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
            notificationCleanup?.remove();
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