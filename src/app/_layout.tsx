// src/app/_layout.tsx — корневой layout: PaperProvider + Stack
import {router, Stack} from 'expo-router';
import {useEffect} from 'react';
import {Linking, useColorScheme} from 'react-native';
import {PaperProvider} from 'react-native-paper';

import {useAuthStore} from '@/stores/authStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {paperDarkTheme, paperLightTheme} from '@/theme/paper-theme';

export default function RootLayout() {
    const scheme = useColorScheme();
    const themeMode = useSettingsStore((state) => state.themeMode);
    const {hydrate, loginWithToken} = useAuthStore();

    useEffect(() => {
      //  void hydrate();
    }, [hydrate]);

    useEffect(() => {
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;

            try {
                const parsed = new URL(url);
                const tokenFromUrl = parsed.searchParams.get('token');

                if (parsed.protocol === 'events:' && parsed.hostname === 'auth-callback' && tokenFromUrl) {
                    router.replace({ pathname: '/auth-callback', params: { token: tokenFromUrl } });
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

        return () => subscription.remove();
    }, [loginWithToken]);

    const resolvedScheme = themeMode === 'system' ? scheme : themeMode;
    const paperTheme = resolvedScheme === 'dark' ? paperDarkTheme : paperLightTheme;

    return (
        <PaperProvider theme={paperTheme}>
            <Stack screenOptions={{headerShown: false}}>
                <Stack.Screen name="index"/>
                <Stack.Screen name="(auth)"/>
                <Stack.Screen name="(tabs)"/>
                <Stack.Screen
                    name="event/[id]"
                />
            </Stack>
        </PaperProvider>
    );
}
