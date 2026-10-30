// src/app/(tabs)/_layout.tsx
import {isFilterEmpty} from '@/lib/filter';
import {useAuthStore} from "@/stores";
import {Tabs} from 'expo-router';
import {useEffect} from "react";
import {BottomNavigation, Icon} from 'react-native-paper';

export default function TabsLayout() {
    const filter = useAuthStore((state) => state.filter);
    const shouldDisableMainTabs = isFilterEmpty(filter);

    useEffect(() => {
        console.log('shouldDisableMainTabs', shouldDisableMainTabs);
    }, [shouldDisableMainTabs]);

    const disableColor = '#ccc';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            tabBar={({navigation, state, descriptors, insets}) => (
                <BottomNavigation.Bar
                    navigationState={state}
                    safeAreaInsets={insets}
                    onTabPress={({route, preventDefault}) => {
                        // Блокируем клик ТОЛЬКО по задизейбленным табам, если фильтр пуст
                        const isBlockedTab = route.name === 'index' || route.name === 'create';

                        if (shouldDisableMainTabs && isBlockedTab) {
                            preventDefault();
                            return;
                        }

                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    }}
                    renderIcon={({route, focused, color}) => {
                        const {options} = descriptors[route.key];
                        if (options.tabBarIcon) {
                            return options.tabBarIcon({focused, color, size: 24});
                        }
                        return null;
                    }}
                    getLabelText={({route}) => {
                        const {options} = descriptors[route.key];
                        return options.tabBarLabel !== undefined
                            ? (options.tabBarLabel as string)
                            : options.title !== undefined
                                ? options.title
                                : route.name;
                    }}
                />
            )}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: 'События',
                    tabBarIcon: ({color, size}) => (
                        <Icon source="calendar-text" size={size}
                              color={shouldDisableMainTabs ? disableColor : String(color)}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    tabBarLabel: 'Создать',
                    tabBarIcon: ({color, size}) => (
                        <Icon source="plus-circle-outline" size={size}
                              color={shouldDisableMainTabs ? disableColor : String(color)}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarLabel: 'Профиль',
                    tabBarIcon: ({color, size}) => (
                        <Icon source="account-outline" size={size} color={String(color)}/>
                    ),
                }}
            />
        </Tabs>
    );
}