import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { BankingApi, Transaction } from '../../services/bankingApi';

const CATEGORIES = ['All', 'TRANSFER', 'BILL_PAY', 'CARD', 'FOOD', 'TRANSPORT', 'OTHER'];

const CATEGORY_ICONS: Record<string, string> = {
    TRANSFER: 'swap-horizontal',
    BILL_PAY: 'receipt',
    CARD: 'card',
    FOOD: 'fast-food',
    TRANSPORT: 'car',
    OTHER: 'ellipsis-horizontal',
};

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            const cat = filter === 'All' ? undefined : filter;
            const data = await BankingApi.getTransactions(50, cat);
            setTransactions(data);
        } catch (e) {
            console.log('Transactions error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchTransactions();
    }, [fetchTransactions]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTransactions();
    }, [fetchTransactions]);

    const formatDate = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Transactions</Text>

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.chip, filter === cat && styles.chipActive]}
                        onPress={() => setFilter(cat)}
                    >
                        <Text style={[styles.chipText, filter === cat && styles.chipTextActive]}>
                            {cat === 'BILL_PAY' ? 'Bills' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                ) : (
                    transactions.map((tx, idx) => {
                        const iconName = CATEGORY_ICONS[tx.type?.toUpperCase() || 'OTHER'] || 'ellipsis-horizontal';
                        const isDebit = (tx.amount || 0) < 0;
                        return (
                            <Animated.View
                                key={tx.id || idx}
                                entering={FadeInDown.delay(idx * 60).springify()}
                                style={styles.txRow}
                            >
                                <View style={styles.txIcon}>
                                    <Ionicons name={iconName as any} size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={styles.txDesc} numberOfLines={1}>
                                        {tx.recipient_name || tx.type || 'Transaction'}
                                    </Text>
                                    <Text style={styles.txDate}>
                                        {tx.date ? formatDate(tx.date) : ''}
                                    </Text>
                                </View>
                                <Text style={[styles.txAmount, isDebit ? styles.debit : styles.credit]}>
                                    {isDebit ? '' : '+'}PKR {Math.abs(tx.amount || 0).toLocaleString()}
                                </Text>
                            </Animated.View>
                        );
                    })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 60,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: Fonts.medium,
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 16,
    },
    headerTitle: {
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.text,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    chipScroll: {
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.surface,
    },
    chipActive: {
        backgroundColor: Colors.primary,
    },
    chipText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    chipTextActive: {
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 12,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txDesc: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.text,
        marginBottom: 2,
    },
    txDate: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    txAmount: {
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    debit: {
        color: '#EF4444',
    },
    credit: {
        color: '#10B981',
    },
});
