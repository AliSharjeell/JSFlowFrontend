import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { PremiumCard } from './PremiumCard';

interface TransactionItemProps {
    description: string;
    amount: number;
    date: string;
    type?: string;
    category?: string;
    currency?: string;
    index?: number;
    status?: string;
}

const getCategoryIcon = (category?: string, type?: string): keyof typeof Ionicons.glyphMap => {
    const cat = (category || type || '').toUpperCase();
    if (cat.includes('TRANSFER') || cat.includes('SEND')) return 'swap-horizontal';
    if (cat.includes('BILL') || cat.includes('PAYMENT')) return 'receipt-outline';
    if (cat.includes('CARD')) return 'card-outline';
    if (cat.includes('SALARY') || cat.includes('INCOME') || cat.includes('CREDIT')) return 'arrow-down';
    if (cat.includes('FOOD') || cat.includes('GROCERY')) return 'fast-food-outline';
    if (cat.includes('SHOPPING')) return 'bag-outline';
    return 'swap-horizontal-outline';
};

const isCredit = (type?: string, category?: string, amount?: number): boolean => {
    if (type?.toLowerCase() === 'credit') return true;
    if (category?.toUpperCase().includes('INCOME') || category?.toUpperCase().includes('SALARY')) return true;
    if (amount && amount > 0 && type?.toLowerCase() !== 'debit') return true;
    return false;
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
    description,
    amount,
    date,
    type,
    category,
    currency = 'PKR',
    index = 0,
    status,
}) => {
    const credit = isCredit(type, category, amount);
    const displayAmount = Math.abs(amount);
    const iconName = getCategoryIcon(category, type);

    const formatDate = (d: string) => {
        try {
            const dt = new Date(d);
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return d;
        }
    };

    return (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <PremiumCard style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: credit ? '#E8F8EF' : '#FFF3E8' }]}>
                    <Ionicons
                        name={iconName}
                        size={22}
                        color={credit ? Colors.success : Colors.tertiary2}
                    />
                </View>
                <View style={styles.details}>
                    <Text style={styles.title} numberOfLines={1}>{description}</Text>
                    <View style={styles.meta}>
                        <Text style={styles.date}>{formatDate(date)}</Text>
                        {category && (
                            <>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.category}>{category}</Text>
                            </>
                        )}
                    </View>
                </View>
                <View style={styles.amountCol}>
                    <Text style={[styles.amount, { color: credit ? Colors.success : Colors.text }]}>
                        {credit ? '+' : '-'} {currency} {displayAmount.toLocaleString()}
                    </Text>
                    {status && (
                        <Text style={[
                            styles.statusText,
                            { color: status === 'completed' ? Colors.success : Colors.tertiary2 }
                        ]}>
                            {status}
                        </Text>
                    )}
                </View>
            </PremiumCard>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 8,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    details: {
        flex: 1,
    },
    title: {
        fontFamily: Fonts.medium,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 4,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    dot: {
        marginHorizontal: 6,
        color: Colors.textSecondary,
        fontSize: 10,
    },
    category: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.textSecondary,
        textTransform: 'capitalize',
    },
    amountCol: {
        alignItems: 'flex-end',
    },
    amount: {
        fontFamily: Fonts.bold,
        fontSize: 15,
    },
    statusText: {
        fontFamily: Fonts.body,
        fontSize: 10,
        marginTop: 2,
        textTransform: 'capitalize',
    },
});
