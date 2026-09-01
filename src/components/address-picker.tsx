// src/components/address-picker.tsx — адрес с модальным выбором и подсказками
import {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {ActivityIndicator, Modal, Portal, Searchbar, Text, TextInput, useTheme} from 'react-native-paper';

import {AddressSuggestion, Coordinates, fetchAddressSuggestions, getAddressFromCoordinates,} from '@/api';

export type {Coordinates};

interface AddressPickerProps {
  label: string;
  placeholder?: string;
  value: Coordinates | null;
  onChangeCoordinates: (coords: Coordinates, addressLabel?: string) => void;
  onUseCurrentLocation: () => void | Promise<void>;
  locationLoading?: boolean;
}

export default function AddressPicker({
                                        label,
                                        placeholder,
                                        value,
                                        onChangeCoordinates,
                                        onUseCurrentLocation,
                                        locationLoading = false,
                                      }: AddressPickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Получение человекочитаемого адреса по координатам через сервис
  useEffect(() => {
    if (!value || (value[0] === 0 && value[1] === 0)) {
      setDisplayText('');
      return;
    }

    let isMounted = true;
    const [lat, lng] = value;

    getAddressFromCoordinates(lat, lng).then((address) => {
      if (isMounted) {
        setDisplayText(address);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [value]);

  // 2. Открытие модального окна
  const handleOpenModal = () => {
    setInputText(displayText);
    setVisible(true);
  };

  // 3. Поиск подсказок адресов через сервис
  useEffect(() => {
    if (!visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const text = inputText.trim();
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
        const nextSuggestions = await fetchAddressSuggestions(text);
        setSuggestions(nextSuggestions);
        setErrorText('');
      } catch {
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
  }, [inputText, visible]);

  // 4. Выбор адреса из списка
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setDisplayText(suggestion.fullAddress);
    onChangeCoordinates(suggestion.coordinates, suggestion.fullAddress);
    setVisible(false);
  };

  return (
      <View style={styles.container}>
        <Pressable onPress={handleOpenModal} style={styles.pressableField}>
          <TextInput
              mode="outlined"
              label={label}
              value={displayText}
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
                value={inputText}
                onChangeText={setInputText}
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
              {!loading && suggestions.length === 0 && inputText.trim().length >= 2 ? (
                  <Text style={styles.emptyText}>{errorText || 'Подходящих вариантов нет'}</Text>
              ) : null}

              {suggestions.map((suggestion) => (
                  <Pressable
                      key={suggestion.id}
                      onPress={() => handleSelectSuggestion(suggestion)}
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