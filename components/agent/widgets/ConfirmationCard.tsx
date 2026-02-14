import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

interface ConfirmationField {
    label: string;
    value: string;
}

interface ConfirmationCardData {
    title: string;
    fields: ConfirmationField[];
}

interface ConfirmationCardProps {
    data: ConfirmationCardData;
    onAction: (action: string, payload?: any) => void;
}

export default function ConfirmationCard({ data, onAction }: ConfirmationCardProps) {
    return (
        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#D97706" />
                </View>
                <Text style={styles.title}>{data.title || 'Confirm Action'}</Text>
            </View>

            {/* Key-Value Pairs */}
            <View style={styles.body}>
                {data.fields?.map((field, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(index * 50).springify()}
                        style={styles.row}
                    >
                        <Text style={styles.rowLabel}>{field.label}</Text>
                        <Text style={styles.rowValue} numberOfLines={1}>{field.value}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => onAction('cancel')}
                >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => onAction('confirm')}
                >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#D9770620',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        color: Colors.text,
    },
    body: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLabel: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    rowValue: {
        fontFamily: Fonts.semiBold,
        fontSize: 13,
        color: Colors.text,
        maxWidth: '60%',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#FBBF2420',
        marginVertical: 14,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        paddingVertical: 11,
        gap: 6,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cancelText: {
        fontFamily: Fonts.semiBold,
        fontSize: 14,
        color: '#EF4444',
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 11,
        gap: 6,
    },
    confirmText: {
        fontFamily: Fonts.semiBold,
        fontSize: 14,
        color: '#FFFFFF',
    },
});
