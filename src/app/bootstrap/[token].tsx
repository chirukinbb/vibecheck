import Constants from 'expo-constants';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTheme} from 'react-native-paper';

import AppPopup from '@/components/app-popup';

import {isFilterEmpty} from '@/lib/filter';
import {requestDeviceFirebaseToken} from '@/lib/notifications';
import {useAuthStore} from '@/stores/authStore';
import {useCategoriesStore} from '@/stores/categoriesStore';
import {useDeviceStore} from '@/stores/deviceStore';
import {useLanguagesStore} from '@/stores/languagesStore';
import {useTagsStore} from '@/stores/tagsStore';

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
    const [filterPopupVisible, setFilterPopupVisible] = useState(false);
    const didRunRef = useRef(false);
    const theme = useTheme();

    const getCurrentUserState = () => {
        const state = useAuthStore.getState();
        return {
            id: state.id,
            filter: state.filter,
            profile: state.profile,
            name: state.name,
        };
    };
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

                // 1. Сохраняем токен и заполняем user data из /me
                await loginWithToken(token);

                const currentUser = getCurrentUserState();

                // 2. После логина проверяем актуальные поля auth-store, а не старое состояние до запроса
                const filter = currentUser.filter;
                const hasEmptyFilter = isFilterEmpty(filter);

                const deviceToken = await requestDeviceFirebaseToken();
                if (deviceToken) {
                    await registerToken(deviceToken);
                }

                // 3. Искусственная задержка для плавности UI
                await new Promise((resolve) => setTimeout(resolve, 500));

                // 4. Загружаем базовые справочники после успешной авторизации
                await Promise.all([
                    fetchCategories(),
                    fetchLanguages(),
                    fetchTags()
                ]);

                // 5. Если фильтр пустой, показываем popup с кнопкой, чтобы пользователь настроил его
                if (currentUser.id != null && currentUser.profile && hasEmptyFilter) {
                    setFilterPopupVisible(true);
                    return;
                }

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

    const appVersion = (Constants as any)?.manifest?.version ?? (Constants as any)?.expoConfig?.version ?? 'unknown';

    return (
        <View style={styles.container}>
            <AppPopup
                visible={filterPopupVisible}
                onDismiss={() => {
                    setFilterPopupVisible(false);
                    router.replace('/(tabs)');
                }}
                header="Выберите свои интересы"
                body={
                    <Text style={[styles.modalText, {color: theme.colors.onSurfaceVariant}]}>
                        Чтобы находить интересные события и тусовки рядом с вами, укажите свои предпочтения. Это займет
                        всего пару секунд!
                    </Text>
                }
                actions={[
                    {
                        label: 'Пропустить',
                        onPress: () => {
                            setFilterPopupVisible(false);
                            router.replace('/(tabs)');
                        },
                        mode: 'text',
                        textColor: theme.colors.onSurfaceVariant,
                    },
                    {
                        label: 'Выбрать интересы',
                        onPress: () => {
                            setFilterPopupVisible(false);
                            router.replace({
                                pathname: '/(tabs)/profile',
                                params: {redirectAfterSave: '1'},
                            });
                        },
                        mode: 'contained',
                    },
                ]}
                style={[styles.modal, {backgroundColor: theme.colors.surface}]}
            />

            {loading ? (
                <>
                    <ActivityIndicator size="large"/>
                    <Text style={styles.title}>Подготовка аккаунта…</Text>
                    <Text style={styles.subtitle}>Версия приложения: {appVersion}</Text>
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
    modal: {
        margin: 24,
        padding: 16,
        borderRadius: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
    },
});