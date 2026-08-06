// src/components/single-select.tsx — одиночный селектор с поиском
import {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Chip, Modal, Portal, Searchbar, Text, useTheme,} from 'react-native-paper';

interface Option<T> {
    code: T;
    label: string;
}

interface SingleSelectProps<T> {
    options: Option<T>[];
    selected: T | null;
    onChange: (selected: T | null) => void;
    label: string;
}

export default function SingleSelect<T>({options, selected, onChange, label,}: SingleSelectProps<T>) {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState('');

    const select = (code: T) => {
        onChange(code);
        setVisible(false);
    };

    const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase()),
    );

    const selectedOpt = options.find((o) => o.code === selected as T) || null;

    return (
        <View style={styles.container}>
            <Text variant="labelLarge" style={styles.label}>{label}</Text>

            <View style={styles.chipRow}>
                {selectedOpt ? (
                    <Chip onPress={() => onChange(null)} selected style={styles.chip}>
                        {selectedOpt.label}
                    </Chip>
                ) : null}
                <Button
                    mode="outlined"
                    onPress={() => {
                        setQuery('');
                        setVisible(true);
                    }}
                    style={styles.addButton}
                >
                    {selectedOpt ? 'Изменить' : '+ Выбрать'}
                </Button>
            </View>

            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    contentContainerStyle={[
                        styles.modal,
                        {backgroundColor: theme.colors.surface},
                    ]}
                >
                    <Searchbar
                        placeholder="Поиск..."
                        value={query}
                        onChangeText={setQuery}
                        style={styles.searchbar}
                        autoFocus
                    />

                    <ScrollView style={styles.list} nestedScrollEnabled>
                        {filtered.length === 0 && (
                            <Text style={styles.emptyText}>Ничего не найдено</Text>
                        )}
                        {filtered.map((opt, index) => (
                            <Chip
                                key={`${String(opt.code)}-${index}`}
                                selected={selected === opt.code}
                                onPress={() => select(opt.code)}
                                style={[
                                    styles.modalChip,
                                    {
                                        backgroundColor: selected === opt.code
                                            ? theme.colors.surfaceVariant
                                            : theme.colors.surface,
                                    },
                                ]}
                                showSelectedOverlay
                            >
                                {opt.label}
                            </Chip>
                        ))}
                    </ScrollView>

                    <Button
                        mode="contained"
                        onPress={() => setVisible(false)}
                        style={styles.doneButton}
                    >
                        Закрыть
                    </Button>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {gap: 8},
    label: {paddingBottom: 4},
    chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    chip: {borderRadius: 8},
    addButton: {alignSelf: 'flex-start'},
    modal: {margin: 24, padding: 16, borderRadius: 12},
    searchbar: {marginBottom: 8},
    list: {maxHeight: 200, flexGrow: 0},
    modalChip: {borderRadius: 8, width: '100%'},
    emptyText: {textAlign: 'center', paddingVertical: 16},
    doneButton: {marginTop: 12, alignSelf: 'flex-end'},
});
