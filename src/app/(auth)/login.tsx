// src/app/(auth)/login.tsx — экран входа / регистрации
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView, Linking, Platform, StyleSheet, View} from 'react-native';
import {Button, Divider, SegmentedButtons, Surface, Text, TextInput, useTheme,} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {loginWithEmail, loginWithOAuth, registerWithEmail} from '@/api/auth';
import {API_URL} from '@/api/client';
import {Spacing} from '@/constants/theme';
import {useAuthStore} from '@/stores/authStore';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {login} = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || (mode === 'register' ? !name.trim() : !password.trim())) {
      setFeedback({type: 'error', text: mode === 'register' ? 'Заполните имя и email' : 'Введите email и пароль'});
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = mode === 'login'
          ? await loginWithEmail({email: email.trim(), password})
          : await registerWithEmail({name: name.trim(), email: email.trim()});

      await login(response);
      setFeedback({
        type: 'success',
        text: mode === 'login' ? 'Вы успешно вошли в аккаунт' : 'Регистрация завершена успешно',
      });

      setIsSubmitting(true);

      try {
        router.replace(`/bootstrap/${response.data.token}`);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      let serverMessage = 'Не удалось выполнить вход';
      try {
        if (error?.response) {
          serverMessage = error.response?.data?.message ?? JSON.stringify(error.response?.data);
        } else if (error?.request) {
          serverMessage = 'Сервер не ответил (no response)';
        } else {
          serverMessage = error?.message ?? serverMessage;
        }
      } catch (e) {
      }

      setFeedback({type: 'error', text: serverMessage});

      // Safe stringify to avoid circular refs
      const safeStringify = (obj: any, space = 2) => {
        try {
          const seen = new WeakSet();
          return JSON.stringify(obj, function (_key, val) {
            if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
            if (val && typeof val === 'object') {
              if (seen.has(val)) return '[Circular]';
              seen.add(val);
            }
            return val;
          }, space);
        } catch (e) {
          try {
            return String(obj);
          } catch {
            return '[unserializable]';
          }
        }
      };

      const maskSensitive = (obj: any) => {
        try {
          const clone = JSON.parse(safeStringify(obj, 0));
          const redact = (o: any) => {
            if (o && typeof o === 'object') {
              for (const k of Object.keys(o)) {
                if (o[k] && typeof o[k] === 'object') redact(o[k]);
                if (/password|pass|token|refresh/i.test(k)) o[k] = '***';
              }
            }
          };
          redact(clone);
          return clone;
        } catch {
          return obj;
        }
      };

      const req = error?.config ?? {};
      let reqData: any = req.data;
      try {
        if (typeof reqData === 'string') {
          try {
            reqData = JSON.parse(reqData);
          } catch {
          }
        }
        reqData = maskSensitive(reqData);
      } catch {
      }

      console.error('Auth failed — message:', error?.message);
      console.error('Auth failed — stack:', error?.stack);
      console.error('Auth failed — isAxiosError:', Boolean(error?.isAxiosError));
      console.error('Auth failed — API_URL:', API_URL);
      console.error('Auth failed — request method/url/baseURL:', req.method, req.url, req.baseURL);
      console.error('Auth failed — request headers:', safeStringify(req.headers));
      console.error('Auth failed — request data (masked):', safeStringify(reqData));
      if (error?.response) {
        console.error('Auth failed — response status:', error.response.status, error.response.statusText);
        console.error('Auth failed — response headers:', safeStringify(error.response.headers));
        console.error('Auth failed — response data:', safeStringify(error.response.data));
      } else if (error?.request) {
        console.error('Auth failed — no response received, request object:', safeStringify(error.request));
      }
      console.error('Auth failed — full error object:', safeStringify(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const oauthUrl = await loginWithOAuth('google');
      Linking.openURL(oauthUrl);
    } catch (error) {
      console.error('OAuth failed:', error);
    }
  };

  return (
      <Surface style={[styles.root, styles.screen]} mode="flat">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.keyboard, {paddingTop: insets.top + Spacing.five}]}
        >
          <View style={styles.content}>
            <Surface elevation={2} style={styles.authCard}>
              <Text variant="headlineMedium" style={styles.title}>
                Events
              </Text>
              <Text
                  variant="bodyLarge"
                  style={{color: theme.colors.onSurfaceVariant, textAlign: 'center'}}
              >
                Находите интересные события{`\n`}и знакомьтесь с новыми людьми
              </Text>

              <SegmentedButtons
                  value={mode}
                  onValueChange={(v) => setMode(v as 'login' | 'register')}
                  style={styles.segmented}
                  buttons={[
                    {value: 'login', label: 'Вход'},
                    {value: 'register', label: 'Регистрация'},
                  ]}
              />

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

                {mode === 'login' && (
                    <TextInput
                        mode="outlined"
                        label="Пароль"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                )}

                {feedback && (
                    <Text
                        style={
                          feedback.type === 'success'
                              ? styles.feedbackSuccess
                              : styles.feedbackError
                        }
                    >
                      {feedback.text}
                    </Text>
                )}

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                  {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                </Button>
              </View>
            </Surface>

            <View style={styles.dividerRow}>
              <Divider style={styles.divider}/>
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                или
              </Text>
              <Divider style={styles.divider}/>
            </View>

            <View style={styles.oauthSection}>
              <Button
                  mode="contained"
                  buttonColor="#FFFFFF"
                  textColor="#1F2937"
                  onPress={handleGoogleLogin}
                  style={styles.googleButton}
                  labelStyle={styles.googleButtonLabel}
                  icon={() => (
                      <View style={styles.googleBadge}>
                        <Text style={styles.googleBadgeText}>G</Text>
                      </View>
                  )}
              >
                Google
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFBFF',
  },
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
  authCard: {
    width: '100%',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9F2',
  },
  title: {fontWeight: '700'},
  segmented: {width: '100%'},
  form: {width: '100%', gap: Spacing.three},
  feedbackSuccess: {
    color: '#15803d',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  feedbackError: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {marginTop: Spacing.two},
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  divider: {flex: 1},
  oauthSection: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 18,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  googleButtonLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  googleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  googleBadgeText: {
    color: '#EA4335',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
});
