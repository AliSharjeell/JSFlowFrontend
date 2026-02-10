import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../constants/Colors';

interface PremiumCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ children, style }) => {
    return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 20,
        shadowColor: Colors.text,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
});
