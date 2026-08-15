// src/components/page-layout.tsx — переиспользуемый лейаут страницы с Appbar
import {StyleSheet, View} from 'react-native';
import {Appbar, Surface, useTheme} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Spacing} from '@/constants/theme';

interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
  icon?: string;
  onIconPress?: () => void;
}

export default function PageLayout({title, children, icon, onIconPress}: PageLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
      <Surface style={[styles.root, {paddingTop: insets.top}]} mode="flat">
        <Appbar.Header>
          {icon && (
              <Appbar.Action icon={icon} onPress={onIconPress}/>
          )}
          {title ? (
              <Appbar.Content
                  title={title}
                  titleStyle={[
                    styles.appbarTitle,
                    {color: theme.colors.onSurface},
                  ]}
              />
          ) : null}
        </Appbar.Header>

        <View style={styles.content}>{children}</View>
      </Surface>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  appbarTitle: {
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  content: {
    flex: 1,
  },
});
