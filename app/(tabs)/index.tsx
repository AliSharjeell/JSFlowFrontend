import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { MockNeonDB, UserData } from '../../services/mockNeonDB';
import { PremiumCard } from '../../components/PremiumCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function Dashboard() {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        MockNeonDB.getUserData().then(setUserData);
    }, []);

    const renderTransaction = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <PremiumCard style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                    <Ionicons
                        name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                        size={24}
                        color={item.type === 'credit' ? Colors.success : Colors.error}
                    />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{item.description}</Text>
                    <Text style={styles.transactionDate}>{item.date}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: item.type === 'credit' ? Colors.success : Colors.text }]}>
                    {item.type === 'credit' ? '+' : '-'} {userData?.currency} {item.amount.toLocaleString()}
                </Text>
            </PremiumCard>
        </Animated.View>
    );

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
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={styles.username}>{userData?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <Animated.View entering={FadeInDown.springify()}>
                    <LinearGradient
                        colors={[Colors.primary, '#1e4b8f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <Text style={styles.balanceLabel}>Total Balance</Text>
                        <Text style={styles.balanceAmount}>
                            {userData ? `${userData.currency} ${userData.balance.toLocaleString()}` : 'Loading...'}
                        </Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardFooterText}>**** **** **** 1234</Text>
                            <Text style={styles.cardFooterText}>09/28</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Shortcuts */}
                <View style={styles.shortcutsContainer}>
                    {['Send', 'Request', 'Bills', 'More'].map((action, index) => (
                        <Animated.View key={action} entering={FadeInDown.delay(index * 100).springify()} style={styles.shortcutWrapper}>
                            <TouchableOpacity style={styles.shortcutButton}>
                                <Ionicons
                                    name={
                                        action === 'Send' ? 'paper-plane-outline' :
                                            action === 'Request' ? 'download-outline' :
                                                action === 'Bills' ? 'receipt-outline' : 'grid-outline'
                                    }
                                    size={24}
                                    color={Colors.primary}
                                />
                            </TouchableOpacity>
                            <Text style={styles.shortcutLabel}>{action}</Text>
                        </Animated.View>
                    ))}
                </View>

                {/* Recent Transactions */}
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {userData ? (
                    userData.recentTransactions.map((item, index) => (
                        <View key={item.id}>
                            {renderTransaction({ item, index })}
                        </View>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.textSecondary }}>Loading transactions...</Text>
                )}

                <View style={{ height: 20 }} />
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
        padding: 5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    balanceCard: {
        borderRadius: 20,
        padding: 25,
        marginBottom: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Fonts.body,
        fontSize: 14,
        marginBottom: 10,
    },
    balanceAmount: {
        color: 'white',
        fontFamily: Fonts.bold,
        fontSize: 36,
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardFooterText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Fonts.medium,
    },
    shortcutsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    shortcutWrapper: {
        alignItems: 'center',
    },
    shortcutButton: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    shortcutLabel: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        color: Colors.text,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        color: Colors.text,
        marginBottom: 15,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    transactionIcon: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontFamily: Fonts.medium,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
    },
    transactionDate: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    transactionAmount: {
        fontFamily: Fonts.bold,
        fontSize: 16,
    },
});
