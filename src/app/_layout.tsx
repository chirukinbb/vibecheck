// src/app/_layout.tsx — корневой layout: PaperProvider + Stack
import {Stack} from 'expo-router';
import {useColorScheme} from 'react-native';
import {PaperProvider} from 'react-native-paper';

import {paperDarkTheme, paperLightTheme} from '@/theme/paper-theme';

export default function RootLayout() {
    const scheme = useColorScheme();
    const paperTheme = scheme === 'dark' ? paperDarkTheme : paperLightTheme;

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
