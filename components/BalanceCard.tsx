import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface BalanceCardProps {
    balance: number | null;
    availableBalance?: number | null;
    currency: string;
    accountNumber?: string;
    status?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
    balance,
    availableBalance,
    currency,
    accountNumber,
    status,
}) => {
    const maskedAccount = accountNumber
        ? `**** **** **** ${accountNumber.slice(-4)}`
        : '**** **** **** ----';

    return (
        <Animated.View entering={FadeInDown.springify()}>
            <LinearGradient
                colors={[Colors.primary, '#1e4b8f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {status && (
                    <View style={styles.statusBadge}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: status === 'ACTIVE' ? '#4ADE80' : Colors.tertiary1 }
                        ]} />
                        <Text style={styles.statusText}>
                            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                        </Text>
                    </View>
                )}

                <Text style={styles.label}>Available Balance</Text>
                <Text style={styles.amount}>
                    {balance !== null
                        ? `${currency} ${(availableBalance ?? balance).toLocaleString()}`
                        : 'Loading...'}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{maskedAccount}</Text>
                    <Text style={styles.footerText}>{currency}</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 25,
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: Fonts.medium,
        fontSize: 11,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: Fonts.body,
        fontSize: 14,
        marginBottom: 8,
    },
    amount: {
        color: 'white',
        fontFamily: Fonts.bold,
        fontSize: 34,
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    holderName: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.medium,
        fontSize: 15,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        color: 'rgba(255,255,255,0.65)',
        fontFamily: Fonts.medium,
        fontSize: 13,
    },
});
