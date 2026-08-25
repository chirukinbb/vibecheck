import {useLocalSearchParams, useRouter} from 'expo-router';
import {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import {useAuthStore} from '@/stores/authStore';
import {useCategoriesStore} from '@/stores/categoriesStore';
import {useLanguagesStore} from '@/stores/languagesStore';

export default function BootstrapScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const router = useRouter();

    const {loginWithToken} = useAuthStore();
    const fetchCategories = useCategoriesStore((state) => state.fetchCategories);
    const fetchLanguages = useLanguagesStore((state) => state.fetchLanguages);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const didRunRef = useRef(false);

    const filter = useAuthStore((state) => state.filter);

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

                // 2. Искусственная задержка для плавности UI (по желанию)
                await new Promise((resolve) => setTimeout(resolve, 500));

                // 3. Загружаем все базовые справочники параллельно
                await Promise.all([
                    fetchCategories(),
                    fetchLanguages(),
                ]);

                console.log('Bootstrap completed')
                console.log('Filter:', filter)

                if (filter === null)
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