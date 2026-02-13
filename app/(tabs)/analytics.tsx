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
import { BankingApi, SpendingAnalytics } from '../../services/bankingApi';

const PERIODS = [
    { key: 'last_week', label: 'Week' },
    { key: 'last_month', label: 'Month' },
    { key: 'last_3_months', label: '3 Months' },
];

const CATEGORY_COLORS: Record<string, string> = {
    transfer: '#3B82F6',
    bill_pay: '#F59E0B',
    food: '#EF4444',
    transport: '#10B981',
    shopping: '#8B5CF6',
    entertainment: '#EC4899',
    other: '#6B7280',
};

export default function AnalyticsScreen() {
    const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
    const [period, setPeriod] = useState('last_month');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        try {
            const data = await BankingApi.getSpendingAnalytics(period);
            setAnalytics(data);
        } catch (e) {
            console.log('Analytics error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => {
        setLoading(true);
        fetchAnalytics();
    }, [fetchAnalytics]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAnalytics();
    }, [fetchAnalytics]);

    const maxCategoryAmount = analytics
        ? Math.max(...Object.values(analytics.category_breakdown || {}), 1)
        : 1;

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Analytics</Text>

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
                {/* Period Selector */}
                <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.periodRow}>
                    {PERIODS.map((p) => (
                        <TouchableOpacity
                            key={p.key}
                            style={[styles.periodPill, period === p.key && styles.periodPillActive]}
                            onPress={() => setPeriod(p.key)}
                        >
                            <Text
                                style={[
                                    styles.periodPillText,
                                    period === p.key && styles.periodPillTextActive,
                                ]}
                            >
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {analytics && (
                    <>
                        {/* Total Spend Card */}
                        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.spendCard}>
                            <Text style={styles.spendLabel}>Total Spending</Text>
                            <Text style={styles.spendAmount}>
                                PKR {analytics.total_spend?.toLocaleString() || '0'}
                            </Text>
                            <View style={styles.spendMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="receipt-outline" size={14} color={Colors.textSecondary} />
                                    <Text style={styles.metaText}>
                                        {analytics.transaction_count} transactions
                                    </Text>
                                </View>
                                <View style={[styles.changeBadge,
                                analytics.change_vs_previous_period?.startsWith('+')
                                    ? styles.changeBadgeUp
                                    : styles.changeBadgeDown
                                ]}>
                                    <Ionicons
                                        name={analytics.change_vs_previous_period?.startsWith('+') ? 'trending-up' : 'trending-down'}
                                        size={12}
                                        color="#fff"
                                    />
                                    <Text style={styles.changeText}>
                                        {analytics.change_vs_previous_period || '0%'}
                                    </Text>
                                </View>
                            </View>
                            {analytics.top_category && analytics.top_category !== 'none' && (
                                <Text style={styles.topCategory}>
                                    Top: {analytics.top_category}
                                </Text>
                            )}
                        </Animated.View>

                        {/* Category Breakdown */}
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <Text style={styles.sectionTitle}>By Category</Text>
                            {Object.entries(analytics.category_breakdown || {}).map(
                                ([cat, amount], idx) => {
                                    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
                                    const pct = (amount / maxCategoryAmount) * 100;
                                    return (
                                        <Animated.View
                                            key={cat}
                                            entering={FadeInDown.delay(250 + idx * 80).springify()}
                                            style={styles.catRow}
                                        >
                                            <View style={styles.catLabelRow}>
                                                <View style={[styles.catDot, { backgroundColor: color }]} />
                                                <Text style={styles.catName}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                                                </Text>
                                                <Text style={styles.catAmount}>
                                                    PKR {amount.toLocaleString()}
                                                </Text>
                                            </View>
                                            <View style={styles.barBg}>
                                                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                                            </View>
                                        </Animated.View>
                                    );
                                }
                            )}
                        </Animated.View>
                    </>
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
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    periodRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    periodPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        alignItems: 'center',
    },
    periodPillActive: {
        backgroundColor: Colors.primary,
    },
    periodPillText: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    periodPillTextActive: {
        color: '#fff',
    },
    spendCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 22,
        marginBottom: 24,
    },
    spendLabel: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    spendAmount: {
        fontFamily: Fonts.bold,
        fontSize: 32,
        color: Colors.text,
        marginBottom: 12,
    },
    spendMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    changeBadgeUp: {
        backgroundColor: '#EF4444',
    },
    changeBadgeDown: {
        backgroundColor: '#10B981',
    },
    changeText: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        color: '#fff',
    },
    topCategory: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.primary,
        marginTop: 10,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.text,
        marginBottom: 14,
    },
    catRow: {
        marginBottom: 14,
    },
    catLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    catDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    catName: {
        flex: 1,
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.text,
    },
    catAmount: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    barBg: {
        height: 8,
        backgroundColor: Colors.surface,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: 8,
        borderRadius: 4,
    },
});
