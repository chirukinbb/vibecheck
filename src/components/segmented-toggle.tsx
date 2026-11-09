import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {Button} from 'react-native-paper';

export interface SegmentedToggleOption<T extends string | number | boolean> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string | number | boolean> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
}

export default function SegmentedToggle<T extends string | number | boolean>({
                                                                               options,
                                                                               value,
                                                                               onChange,
                                                                               compact = true,
                                                                               style,
                                                                               buttonStyle,
                                                                             }: SegmentedToggleProps<T>) {
  return (
      <View style={[styles.row, style]}>
        {options.map((option) => (
            <Button
                key={String(option.value)}
                mode={value === option.value ? 'contained' : 'outlined'}
                onPress={() => onChange(option.value)}
                compact={compact}
                style={[styles.button, buttonStyle]}
            >
              {option.label}
            </Button>
        ))}
      </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  button: {
    flex: 1,
  },
});
