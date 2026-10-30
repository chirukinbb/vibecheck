import type {ReactNode} from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Button, Modal, Portal} from 'react-native-paper';

export type PopupAction = {
    label: string;
    onPress?: () => void;
    mode?: 'text' | 'contained' | 'outlined';
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textColor?: string;
    buttonColor?: string;
};

type AppPopupProps = {
    visible: boolean;
    onDismiss: () => void;
    header?: ReactNode;
    body?: ReactNode;
    actions?: PopupAction[];
    style?: StyleProp<ViewStyle>;
};

export default function AppPopup({
                                     visible,
                                     onDismiss,
                                     header,
                                     body,
                                     actions = [],
                                     style,
                                 }: AppPopupProps) {
    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.container, style]}
            >
                {header !== undefined && header !== null && (
                    <View style={styles.header}>
                        {typeof header === 'string' ? <Text style={styles.headerText}>{header}</Text> : header}
                    </View>
                )}

                {body !== undefined && body !== null && <View style={styles.body}>{body}</View>}

                {actions.length > 0 && (
                    <View style={styles.actionsRow}>
                        {actions.map((action, index) => (
                            <Button
                                key={`${action.label}-${index}`}
                                mode={action.mode ?? 'outlined'}
                                onPress={action.onPress}
                                disabled={action.disabled}
                                style={[styles.actionButton, action.style]}
                                compact
                                textColor={action.textColor}
                                buttonColor={action.buttonColor}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </View>
                )}
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 24,
        padding: 18,
        borderRadius: 16,
    },
    header: {
        marginBottom: 8,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
    },
    body: {
        gap: 8,
        marginBottom: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        minWidth: 96,
        flexGrow: 1,
    },
});
