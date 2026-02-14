import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors'; // Assuming this exists
import { Fonts } from '../../../constants/Fonts';   // Assuming this exists
import { Ionicons } from '@expo/vector-icons';

// Types
interface LiveReceiptProps {
    data: {
        recipient?: string;
        amount?: string | number;
        description?: string;
        status?: 'pending' | 'success' | 'failed';
    };
    onConfirm?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function LiveReceipt({ data }: LiveReceiptProps) {
    const { recipient = 'Unknown', amount = '0.00', description = 'Transfer', status = 'pending' } = data;

    // Formatting currency
    const formattedAmount = typeof amount === 'number'
        ? `$${amount.toFixed(2)}`
        : `${amount}`;

    return (
        <Animated.View
            entering={FadeInDown.springify().damping(12)}
            exiting={FadeOutUp}
            style={styles.container}
        >
            <View style={styles.receiptHeader}>
                <Ionicons name="receipt-outline" size={24} color="#64748B" />
                <Text style={styles.receiptTitle}>Transaction Receipt</Text>
            </View>

            <View style={styles.paperTear} />

            <View style={styles.content}>
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.row}>
                    <Text style={styles.label}>Type</Text>
                    <Text style={styles.value}>Transfer</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.row}>
                    <Text style={styles.label}>To</Text>
                    <Text style={styles.value}>{recipient}</Text>
                </Animated.View>

                <View style={styles.divider} />

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalValue}>{formattedAmount}</Text>
                </Animated.View>

                {status === 'success' && (
                    <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.stampContainer}>
                        <View style={styles.stamp}>
                            <Text style={styles.stampText}>PAID</Text>
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Ragged bottom paper effect */}
            <View style={styles.jaggedBottom}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <View key={i} style={styles.jaggedTriangle} />
                ))}
            </View>

        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        alignSelf: 'center',
        marginTop: 20,
        overflow: 'hidden',
    },
    receiptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    receiptTitle: {
        fontFamily: Fonts.medium,
        fontSize: 16,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    paperTear: {
        height: 1,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        marginHorizontal: 10,
        marginTop: -1,
        zIndex: 1,
    },
    content: {
        padding: 24,
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontFamily: Fonts.regular,
        fontSize: 15,
        color: '#94A3B8',
    },
    value: {
        fontFamily: Fonts.medium,
        fontSize: 16,
        color: '#1E293B',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    totalLabel: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: '#1E293B',
    },
    totalValue: {
        fontFamily: Fonts.bold,
        fontSize: 32,
        color: Colors.text, // Assuming primary color or dark text
    },
    stampContainer: {
        position: 'absolute',
        top: '40%',
        right: 20,
        transform: [{ rotate: '-15deg' }],
        opacity: 0.8,
    },
    stamp: {
        borderWidth: 4,
        borderColor: '#22C55E', // Green
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    stampText: {
        fontFamily: Fonts.bold,
        fontSize: 24,
        color: '#22C55E',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    jaggedBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        height: 10,
        overflow: 'hidden',
        marginTop: -1, // Overlap slightly to hide background
    },
    jaggedTriangle: {
        width: CARD_WIDTH / 20,
        height: 10,
        backgroundColor: '#FFFFFF',
        transform: [{ translateY: -5 }, { rotate: '45deg' }], // Simple trick for jagged edge
        // A proper jagged edge usually uses SVG, but this is a quick native hack
        // Actually, this hack might look weird. 
        // Better to just have a clean bottom or use a mask.
        // Let's simplified it to just be white background for now, 
        // as jagged edges are hard without SVG masks.
        display: 'none',
    }
});
