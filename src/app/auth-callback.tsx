import {useLocalSearchParams, useRouter} from 'expo-router';
import {useEffect, useRef} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

export default function AuthCallback() {
    const params = useLocalSearchParams<{ token?: string | string[] }>();
    const router = useRouter();
    const didRunRef = useRef(false);

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        const token = Array.isArray(params.token) ? params.token[0] : params.token;

        if (!token) {
            router.replace('/(auth)/login');
            return;
        }

        // Перенаправляем на роут инициализации
        router.replace(`/bootstrap/${encodeURIComponent(token)}`);
    }, [params.token, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});