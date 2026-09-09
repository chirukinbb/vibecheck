import {useLocalSearchParams, useRouter} from 'expo-router';
import {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Platform, StyleSheet, Text, View} from 'react-native';

import {useAuthStore} from '@/stores/authStore';
import {useCategoriesStore} from '@/stores/categoriesStore';
import {useDeviceStore} from '@/stores/deviceStore';
import {useLanguagesStore} from '@/stores/languagesStore';
import {useTagsStore} from '@/stores/tagsStore';

async function requestDeviceFirebaseToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
        return null;
    }

    try {
        // Динамически подгружаем модуль только при вызове функции
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
        // Если запуск происходит в Expo Go, импорт упадет в catch и мягко вернет null
        return null;
    }
}

export default function BootstrapScreen() {
    const {token} = useLocalSearchParams<{ token: string }>();
    const router = useRouter();

    const {loginWithToken} = useAuthStore();
    const fetchCategories = useCategoriesStore((state) => state.fetchCategories);
    const fetchLanguages = useLanguagesStore((state) => state.fetchLanguages);
    const fetchTags = useTagsStore((state) => state.fetchTags);
    const registerToken = useDeviceStore((state) => state.registerToken);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const didRunRef = useRef(false);

    const filter = useAuthStore((state) => state.filter);
    const isFilterEmpty = !filter || Object.values(filter).every((val) => val === null || val === undefined);

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        if (!token) {
            router.replace('/(auth)/login');
            return;
        }

        const runBootstrap = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Сохраняем токен и настраиваем заголовки авторизации
                await loginWithToken(token);

                const deviceToken = await requestDeviceFirebaseToken();
                if (deviceToken) {
                    await registerToken(deviceToken);
                }

                // 2. Искусственная задержка для плавности UI
                await new Promise((resolve) => setTimeout(resolve, 500));

                // 3. Загружаем все базовые справочники параллельно
                await Promise.all([
                    fetchCategories(),
                    fetchLanguages(),
                    fetchTags()
                ]);

                if (isFilterEmpty)
                    router.replace('/(tabs)/profile');
                else
                    router.replace('/(tabs)');
            } catch (e: any) {
                setError(e?.message ?? 'Не удалось загрузить данные аккаунта');
                setTimeout(() => {
                    router.replace('/(auth)/login');
                }, 1500);
            } finally {
                setLoading(false);
            }
        };

        void runBootstrap();
    }, [fetchCategories, fetchLanguages, loginWithToken, token, router]);

    return (
        <View style={styles.container}>
            {loading ? (
                <>
                    <ActivityIndicator size="large" />
                    <Text style={styles.title}>Подготовка аккаунта…</Text>
                </>
            ) : (
                <Text style={styles.error}>{error ?? 'Ошибка загрузки'}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    title: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '600',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    error: {
        fontSize: 16,
        color: '#B91C1C',
        textAlign: 'center',
    },
});