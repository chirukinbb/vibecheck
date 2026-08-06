import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {useEffect, useState} from 'react';
import {Platform, Pressable, View} from 'react-native';
import {TextInput} from 'react-native-paper';

type DirectPickerProps = {
    label?: string;
    value: Date | null;
    onChange: (value: Date | null) => void;
};

const DirectPicker = ({label = 'Дата и время', value, onChange}: DirectPickerProps) => {
    const [date, setDate] = useState<Date | null>(value ?? null);
    const [draftDate, setDraftDate] = useState<Date | null>(value ?? null);
    const [show, setShow] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime' | null>(null);

    useEffect(() => {
        const nextValue = value ?? null;
        setDate(nextValue);
        setDraftDate(nextValue);
    }, [value]);

    const displayValue = date
        ? date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : '';

    const openPicker = () => {
        setDraftDate(date ?? new Date());
        setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
        setShow(true);
    };

    const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShow(false);
            setPickerMode(null);
            return;
        }

        if (!selectedDate) {
            return;
        }

        if (Platform.OS === 'ios') {
            setDate(selectedDate);
            onChange(selectedDate);
            setShow(false);
            setPickerMode(null);
            return;
        }

        if (pickerMode === 'date') {
            const nextValue = new Date(selectedDate);
            nextValue.setHours(draftDate?.getHours() ?? 0);
            nextValue.setMinutes(draftDate?.getMinutes() ?? 0);
            nextValue.setSeconds(0);
            setDraftDate(nextValue);
            setPickerMode('time');
            return;
        }

        const nextValue = new Date(selectedDate);
        const current = draftDate ?? new Date();
        nextValue.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
        nextValue.setSeconds(0);
        setDate(nextValue);
        onChange(nextValue);
        setShow(false);
        setPickerMode(null);
    };

    return (
        <View>
            <Pressable onPress={openPicker}>
                <TextInput
                    mode="outlined"
                    label={label}
                    value={displayValue}
                    editable={false}
                    placeholder="Выберите дату и время"
                    pointerEvents="none"
                    right={<TextInput.Icon icon="calendar"/>}
                />
            </Pressable>
            {show && (
                <DateTimePicker
                    value={draftDate ?? date ?? new Date()}
                    mode={Platform.OS === 'ios' ? 'datetime' : pickerMode ?? 'date'}
                    display="default"
                    locale="ru-RU"
                    onChange={onPickerChange}
                />
            )}
        </View>
    );
};

export default DirectPicker;