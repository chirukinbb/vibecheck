// src/app/(auth)/login.tsx — экран входа / регистрации
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView, Platform, StyleSheet, View} from 'react-native';
import {Button, Divider, SegmentedButtons, Surface, Text, TextInput, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {MOCK_AUTH_RESPONSE} from '@/constants/mock-data';
import {Spacing} from '@/constants/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    // Хардкод — сразу логинимся и переходим на табы
    console.log('Auth success:', MOCK_AUTH_RESPONSE);
    router.replace('/(tabs)');
  };

  return (
      <Surface style={styles.root} mode="flat">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.keyboard, {paddingTop: insets.top + Spacing.five}]}
        >
          <View style={styles.content}>
            {/* Заголовок */}
            <Text variant="headlineMedium" style={styles.title}>
              Events
            </Text>
            <Text
                variant="bodyLarge"
                style={{color: theme.colors.onSurfaceVariant, textAlign: 'center'}}
            >
              Находите интересные события{'\n'}и знакомьтесь с новыми людьми
            </Text>

            {/* Переключатель Вход / Регистрация */}
            <SegmentedButtons
                value={mode}
                onValueChange={(v) => setMode(v as 'login' | 'register')}
                style={styles.segmented}
                buttons={[
                  {value: 'login', label: 'Вход'},
                  {value: 'register', label: 'Регистрация'},
                ]}
            />

            {/* Форма */}
            <View style={styles.form}>
              {mode === 'register' && (
                  <TextInput
                      mode="outlined"
                      label="Имя"
                      value={name}
                      onChangeText={setName}
                  />
              )}

              <TextInput
                  mode="outlined"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
              />

              <TextInput
                  mode="outlined"
                  label="Пароль"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
              />

              <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitBtn}
              >
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </View>

            {/* Разделитель */}
            <View style={styles.dividerRow}>
              <Divider/>
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                или
              </Text>
              <Divider/>
            </View>

            {/* OAuth-кнопки */}
            <View style={styles.oauthRow}>
              <Button
                  mode="contained"
                  buttonColor="#DB4437"
                  textColor="#FFFFFF"
                  onPress={handleSubmit}
                  style={styles.oauthBtn}
              >
                G Google
              </Button>

              <Button
                  mode="contained"
                  buttonColor="#1877F2"
                  textColor="#FFFFFF"
                  onPress={handleSubmit}
                  style={styles.oauthBtn}
              >
                f Facebook
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Surface>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  keyboard: {flex: 1},
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {fontWeight: '700'},
  segmented: {width: '100%'},
  form: {width: '100%', gap: Spacing.three},
  submitBtn: {marginTop: Spacing.two},
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  oauthRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  oauthBtn: {flex: 1},
});
