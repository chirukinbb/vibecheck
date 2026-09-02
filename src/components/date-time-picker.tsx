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
        const minDate = new Date(Date.now() + 6 * 60 * 60 * 1000);
        const initial = date ?? new Date();
        const initialTime = initial.getTime() < minDate.getTime() ? new Date(minDate) : new Date(initial);
        setDraftDate(initialTime);
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
            const minDate = new Date(Date.now() + 6 * 60 * 60 * 1000);
            let nextIos = new Date(selectedDate);
            if (nextIos.getTime() < minDate.getTime()) nextIos = new Date(minDate);
            setDate(nextIos);
            onChange(nextIos);
            setShow(false);
            setPickerMode(null);
            return;
        }

        const minDate = new Date(Date.now() + 6 * 60 * 60 * 1000);

        if (pickerMode === 'date') {
            const nextValue = new Date(selectedDate);
            // determine base time (from draftDate), but ensure it's not earlier than minDate when the same day
            const base = draftDate ?? new Date();
            if (nextValue.toDateString() === minDate.toDateString()) {
                // if selected day equals min day, ensure time >= min time
                const safeBase = base.getTime() < minDate.getTime() ? minDate : base;
                nextValue.setHours(safeBase.getHours());
                nextValue.setMinutes(safeBase.getMinutes());
            } else {
                nextValue.setHours(base.getHours());
                nextValue.setMinutes(base.getMinutes());
            }
            nextValue.setSeconds(0);
            setDraftDate(nextValue);
            setPickerMode('time');
            return;
        }

        const nextValue = new Date(selectedDate);
        const current = draftDate ?? new Date();
        nextValue.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
        nextValue.setSeconds(0);
        if (nextValue.getTime() < minDate.getTime()) {
            // enforce minimum
            setDate(minDate);
            onChange(minDate);
        } else {
            setDate(nextValue);
            onChange(nextValue);
        }
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
                    minimumDate={new Date(Date.now() + 6 * 60 * 60 * 1000)}
                />
            )}
        </View>
    );
};

export default DirectPicker;