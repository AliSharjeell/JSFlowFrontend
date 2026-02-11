import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BalanceCard } from '../../components/BalanceCard';
import { QuickActions } from '../../components/QuickActions';
import { TransactionItem } from '../../components/TransactionItem';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { BalanceData, BankingApi, SpendingAnalytics, Transaction } from '../../services/bankingApi';

export default function Dashboard() {
    const router = useRouter();
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [bal, txn, spend] = await Promise.all([
                BankingApi.getBalance().catch((e) => { console.log('❌ Balance error:', e?.message, e?.response?.status, e?.response?.data); return null; }),
                BankingApi.getTransactions(8).catch((e) => { console.log('❌ Transactions error:', e?.message, e?.response?.status, e?.response?.data); return []; }),
                BankingApi.getSpendingAnalytics('last_month').catch((e) => { console.log('❌ Analytics error:', e?.message, e?.response?.status, e?.response?.data); return null; }),
            ]);
            console.log('📦 Balance response:', JSON.stringify(bal));
            console.log('📦 Transactions response:', JSON.stringify(txn));
            console.log('📦 Analytics response:', JSON.stringify(spend));
            if (bal) setBalance(bal);
            if (Array.isArray(txn)) setTransactions(txn);
            if (spend) setAnalytics(spend);
        } catch (e: any) {
            setError('Could not connect to bank. Pull down to retry.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const quickActions = [
        {
            label: 'Send',
            icon: 'paper-plane-outline' as keyof typeof Ionicons.glyphMap,
            onPress: () => router.push('/(tabs)/payments'),
            color: Colors.primary,
        },
        {
            label: 'Cards',
            icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
            onPress: () => router.push('/(tabs)/cards'),
            color: '#8B5CF6',
        },
        {
            label: 'Bills',
            icon: 'receipt-outline' as keyof typeof Ionicons.glyphMap,
            onPress: () => router.push('/(tabs)/payments'),
            color: Colors.tertiary2,
        },
        {
            label: 'Analytics',
            icon: 'pie-chart-outline' as keyof typeof Ionicons.glyphMap,
            onPress: () => { },
            color: Colors.success,
        },
    ];

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={require('@/assets/logos/logo-black-transparent.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.headerRight}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.username}>
                            User
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                U
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

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
                {error && (
                    <Animated.View entering={FadeInDown} style={styles.errorBanner}>
                        <Ionicons name="cloud-offline-outline" size={18} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                )}

                {/* Balance Card */}
                <BalanceCard
                    balance={balance?.ledger_balance ?? null}
                    availableBalance={balance?.available_balance}
                    currency={balance?.currency || 'PKR'}
                    accountNumber={balance?.account_id}
                    status={balance?.status}
                />

                {/* Quick Actions */}
                <QuickActions actions={quickActions} />

                {/* Spending Summary */}
                {analytics && (
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <View style={styles.spendingSummary}>
                            <Text style={styles.sectionTitle}>This Month</Text>
                            <View style={styles.spendingRow}>
                                <View style={styles.spendingItem}>
                                    <Text style={styles.spendingLabel}>Spent</Text>
                                    <Text style={[styles.spendingValue, { color: Colors.tertiary2 }]}>
                                        {balance?.currency || 'PKR'} {analytics.total_spend?.toLocaleString() || '0'}
                                    </Text>
                                </View>
                                <View style={styles.spendingDivider} />
                                <View style={styles.spendingItem}>
                                    <Text style={styles.spendingLabel}>Top Category</Text>
                                    <Text style={[styles.spendingValue, { color: Colors.primary, fontSize: 16 }]}>
                                        {analytics.top_category ? analytics.top_category.charAt(0).toUpperCase() + analytics.top_category.slice(1) : '-'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {transactions.length > 0 ? (
                    transactions.map((txn, index) => (
                        <TransactionItem
                            key={txn.id || index}
                            description={txn.recipient_name || txn.category}
                            amount={txn.amount}
                            date={txn.date}
                            type={txn.type}
                            category={txn.category}
                            currency={balance?.currency || 'PKR'}
                            index={index}
                            status={txn.status}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No recent transactions</Text>
                    </View>
                )}

                <View style={{ height: 24 }} />
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
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerLeft: {
        marginBottom: 12,
    },
    headerLogo: {
        width: 120,
        height: 36,
    },
    headerRight: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.textSecondary,
    },
    username: {
        fontFamily: Fonts.bold,
        fontSize: 24,
        color: Colors.text,
    },
    profileButton: {
        padding: 2,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.white,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.error,
        flex: 1,
    },
    spendingSummary: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
    },
    spendingRow: {
        flexDirection: 'row',
        marginTop: 12,
    },
    spendingItem: {
        flex: 1,
        alignItems: 'center',
    },
    spendingDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    spendingLabel: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    spendingValue: {
        fontFamily: Fonts.bold,
        fontSize: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: 19,
        color: Colors.text,
    },
    seeAll: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 12,
    },
});
