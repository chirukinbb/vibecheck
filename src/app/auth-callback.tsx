import {useLocalSearchParams, usePathname, useRouter} from 'expo-router';
import {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {getCurrentUser, handleOAuthToken} from '../api/auth';

export default function AuthCallback() {
    const params = useLocalSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function finishAuth() {
            try {
                const maybeToken = (params as any).token ?? (params as any).access_token ?? (params as any).t;
                if (maybeToken) {
                    handleOAuthToken(String(maybeToken));
                }

                const resp = await getCurrentUser();
                console.log('Current user response:', resp);
                // Попробуем несколько вариантов структуры ответа, чтобы найти профиль
                const profile = (resp as any).profile ?? (resp as any).user?.profile ?? (resp as any).user ?? null;

                const isEmptyProfile =
                    !profile ||
                    (typeof profile === 'object' && Object.keys(profile).length === 0) ||
                    (!profile?.firstName && !profile?.lastName && !profile?.name && !profile?.email && !profile?.displayName);

                if (!mounted) return;
                if (isEmptyProfile) {
                    router.replace('/profile');
                } else {
                    router.replace('/');
                }
            } catch (e) {
                if (router) router.replace('/profile');
            } finally {
                if (mounted) setLoading(false);
            }
        }

        finishAuth();
        return () => {
            mounted = false;
        };
    }, [params, router, pathname]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large"/>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});