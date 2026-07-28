// src/app/(tabs)/_layout.tsx
import {Tabs} from 'expo-router';
import {CommonActions} from '@react-navigation/native';
import {BottomNavigation, Icon} from 'react-native-paper';

export default function TabsLayout() {
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
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!event.defaultPrevented) {
                            navigation.dispatch({
                                ...CommonActions.navigate(route.name, route.params),
                                target: state.key,
                            });
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
                        <Icon source="calendar-text" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    tabBarLabel: 'Создать',
                    tabBarIcon: ({color, size}) => (
                        <Icon source="plus-circle-outline" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarLabel: 'Профиль',
                    tabBarIcon: ({color, size}) => (
                        <Icon source="account-outline" size={size} color={color}/>
                    ),
                }}
            />
        </Tabs>
    );
}