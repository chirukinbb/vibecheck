// src/theme/paper-theme.ts — Paper MD3 тема (светлая + тёмная)
import type {MD3Theme} from 'react-native-paper';
import {configureFonts, MD3DarkTheme, MD3LightTheme} from 'react-native-paper';

const fontConfig = configureFonts({
  config: {
    fontFamily: 'system-ui',
  },
});

const sharedColors = {
  primary: '#208AEF',
  error: '#E53935',
};

export const paperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...sharedColors,
    background: '#FFFFFF',
    surface: '#F0F0F3',
    surfaceVariant: '#E0E1E6',
    onSurface: '#000000',
    onSurfaceVariant: '#60646C',
    outline: '#C0C4CC',
    secondaryContainer: '#E3F0FD',
    onSecondaryContainer: '#1A6FC4',
  },
  fonts: fontConfig,
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...sharedColors,
    primary: '#4EA5F6',
    error: '#FF6B6B',
    background: '#000000',
    surface: '#212225',
    surfaceVariant: '#2E3135',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B0B4BA',
    outline: '#40444C',
    secondaryContainer: '#1A3A5C',
    onSecondaryContainer: '#8FC7FF',
  },
  fonts: fontConfig,
};
