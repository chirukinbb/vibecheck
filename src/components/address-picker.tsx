// src/components/address-picker.tsx — адрес с модальным выбором и TomTom-подсказками
import {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {ActivityIndicator, Modal, Portal, Searchbar, Text, TextInput, useTheme} from 'react-native-paper';

interface AddressSuggestion {
  id: string;
  label: string;
  fullAddress: string;
}

interface AddressPickerProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onUseCurrentLocation: () => void | Promise<void>;
  locationLoading?: boolean;
}

const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || process.env.TOMTOM_API_KEY || 'BHEiGUcbB06ofsGybuUFTFReGMYYkoy9';

export default function AddressPicker({
                                        label,
                                        placeholder,
                                        value,
                                        onChangeText,
                                        onUseCurrentLocation,
                                        locationLoading = false,
                                      }: AddressPickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const text = inputValue.trim();
    if (!text || text.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setErrorText('');
      return;
    }

    setLoading(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(text)}.json?key=${TOMTOM_API_KEY}&language=ru-RU&typeahead=true&limit=6`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('TomTom request failed');
        }

        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        const nextSuggestions = results
            .map((item: any, index: number) => {
              const address = item.address || {};
              const label =
                  address.freeformAddress ||
                  address.streetName ||
                  address.municipality ||
                  address.country ||
                  item.poi?.name ||
                  item.name ||
                  'Адрес';

              if (!label) {
                return null;
              }

              return {
                id: `${item.id || item.type || 'suggestion'}-${index}`,
                label,
                fullAddress: label,
              } as AddressSuggestion;
            })
            .filter((item: AddressSuggestion | null): item is AddressSuggestion => Boolean(item));

        setSuggestions(nextSuggestions);
        setErrorText(nextSuggestions.length > 0 ? '' : '');
      } catch (error) {
        setSuggestions([]);
        setErrorText('Не удалось получить подсказки. Проверьте соединение или попробуйте позже.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, visible]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    onChangeText(text);
  };

  const handleSelectSuggestion = (text: string) => {
    handleTextChange(text);
    setVisible(false);
  };

  return (
      <View style={styles.container}>
        <Pressable onPress={() => setVisible(true)} style={styles.pressableField}>
          <TextInput
              mode="outlined"
              label={label}
              value={inputValue}
              onChangeText={handleTextChange}
              editable={false}
              pointerEvents="none"
              placeholder={placeholder}
              right={
                <TextInput.Icon
                    icon="crosshairs-gps"
                    onPress={onUseCurrentLocation}
                    loading={locationLoading}
                />
              }
          />
        </Pressable>

        <Portal>
          <Modal
              visible={visible}
              onDismiss={() => setVisible(false)}
              contentContainerStyle={[styles.modal, {backgroundColor: theme.colors.surface}]}
          >
            <Searchbar
                placeholder="Начните вводить адрес..."
                value={inputValue}
                onChangeText={handleTextChange}
                style={styles.searchbar}
                autoFocus
            />

            {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator animating size="small"/>
                  <Text style={styles.loadingText}>Ищем адреса...</Text>
                </View>
            ) : null}

            <ScrollView style={styles.list} nestedScrollEnabled>
              {!loading && suggestions.length === 0 && inputValue.trim().length >= 2 ? (
                  <Text style={styles.emptyText}>{errorText || 'Подходящих вариантов нет'}</Text>
              ) : null}

              {suggestions.map((suggestion) => (
                  <Pressable
                      key={suggestion.id}
                      onPress={() => handleSelectSuggestion(suggestion.fullAddress)}
                      style={({pressed}) => [
                        styles.suggestion,
                        pressed && styles.suggestionPressed,
                      ]}
                  >
                    <Text style={styles.suggestionTitle}>{suggestion.label}</Text>
                  </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.hint}>Выберите вариант, чтобы подставить адрес в поле</Text>
          </Modal>
        </Portal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: 8},
  pressableField: {width: '100%'},
  modal: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    maxHeight: '80%',
  },
  searchbar: {marginBottom: 8},
  list: {maxHeight: 260, flexGrow: 0},
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  suggestionPressed: {
    backgroundColor: '#F3F4F6',
  },
  suggestionTitle: {fontSize: 14},
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#6B7280',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {color: '#6B7280'},
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});
