import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Modal, Portal, useTheme } from 'react-native-paper';

import { requestDeviceFirebaseToken } from '@/lib/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { useLanguagesStore } from '@/stores/languagesStore';
import { useTagsStore } from '@/stores/tagsStore';

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

    const isEmptyValue = (val: unknown): boolean => {
        if (val === null || val === undefined) return true;
        if (typeof val === 'string') return val.trim() === '';
        if (Array.isArray(val)) return val.length === 0;
        if (typeof val === 'object') return Object.keys(val as object).length === 0;
        return false;
    };

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
                const isFilterEmpty = !filter || Object.values(filter).every(isEmptyValue);

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
                if (currentUser.id != null && currentUser.profile && isFilterEmpty) {
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
            <Portal>
                <Modal
                    visible={filterPopupVisible}
                    onDismiss={() => {
                        setFilterPopupVisible(false);
                        router.replace('/(tabs)');
                    }}
                    contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}
                >
                    <Text style={[styles.modalTitle, {color: theme.colors.onSurface}]}>Настройте фильтр</Text>
                    <Text style={[styles.modalText, {color: theme.colors.onSurfaceVariant}]}>
                        Чтобы начать пользоваться событиями, задайте фильтры по вашим интересам и предпочтениям. Это поможет приложению показывать только актуальные и подходящие вам мероприятия.
                    </Text>

                    <View style={styles.modalActions}>
                        <Button
                            mode="text"
                            onPress={() => {
                                setFilterPopupVisible(false);
                                router.replace('/(tabs)');
                            }}
                            textColor={theme.colors.onSurfaceVariant}
                        >
                            Позже
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setFilterPopupVisible(false);
                                router.replace('/(tabs)/profile');
                            }}
                        >
                            Настроить
                        </Button>
                    </View>
                </Modal>
            </Portal>

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