// src/components/phone-input.tsx — компонент ввода номера телефона
import {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Menu, TextInput, useTheme} from 'react-native-paper';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  defaultCountryCode?: string;
  onCountryCodeChange?: (code: string, iso: string) => void;
}

interface Country {
  code: string;
  label: string;
  mask: string;
  digits: number;
  iso: string;
}

const COUNTRIES: Country[] = [
  {code: '+7', label: '+7 (RU)', mask: '(###) ###-##-##', digits: 10, iso: 'RU'},
  {code: '+1', label: '+1 (US)', mask: '(###) ###-####', digits: 10, iso: 'US'},
  {code: '+44', label: '+44 (UK)', mask: '#### ### ####', digits: 10, iso: 'GB'},
  {code: '+49', label: '+49 (DE)', mask: '#### #######', digits: 9, iso: 'DE'},
  {code: '+33', label: '+33 (FR)', mask: '# ## ## ## ##', digits: 9, iso: 'FR'},
  {code: '+86', label: '+86 (CN)', mask: '### #### ####', digits: 11, iso: 'CN'},
  {code: '+91', label: '+91 (IN)', mask: '##### #####', digits: 10, iso: 'IN'},
  {code: '+81', label: '+81 (JP)', mask: '##-####-####', digits: 10, iso: 'JP'},
];

export default function PhoneInput({
                                     value,
                                     onChangeText,
                                     defaultCountryCode = '+7',
                                     onCountryCodeChange,
                                   }: PhoneInputProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const inputRef = useRef<any>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Синхронизируем внутренний код страны с внешним пропом
  useEffect(() => {
    setCountryCode(defaultCountryCode);
  }, [defaultCountryCode]);

  const formatPhoneNumber = (digits: string): string => {
    const maxDigits = selectedCountry.digits;
    const cleanDigits = digits.replace(/\D/g, '').slice(0, maxDigits);
    let result = '';
    let digitIndex = 0;

    for (let i = 0; i < selectedCountry.mask.length && digitIndex < cleanDigits.length; i++) {
      if (selectedCountry.mask[i] === '#') {
        result += cleanDigits[digitIndex];
        digitIndex++;
      } else {
        result += selectedCountry.mask[i];
      }
    }

    return result;
  };

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const formatted = formatPhoneNumber(digits);
    onChangeText(formatted);
  };

  const handleCountrySelect = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    if (country) {
      setCountryCode(code);
      onCountryCodeChange?.(code, country.iso);
      // Очищаем номер при смене страны
      onChangeText('');
      setMenuVisible(false);
      inputRef.current?.focus();
    }
  };

  return (
      <View style={styles.container}>
        <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.countryButton}>
                {selectedCountry.code}
              </Button>
            }
        >
          {COUNTRIES.map((country) => (
              <Menu.Item
                  key={country.code}
                  onPress={() => handleCountrySelect(country.code)}
                  title={country.label}
              />
          ))}
        </Menu>

        <TextInput
            ref={inputRef}
            mode="outlined"
            label="Телефон"
            value={value}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            style={styles.phoneInput}
            placeholder={selectedCountry.mask}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryButton: {
    minWidth: 80,
  },
  phoneInput: {
    flex: 1,
  },
});
