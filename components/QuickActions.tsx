import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface Action {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
}

interface QuickActionsProps {
    actions: Action[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
    return (
        <View style={styles.container}>
            {actions.map((action, index) => (
                <Animated.View
                    key={action.label}
                    entering={FadeInDown.delay(index * 80).springify()}
                    style={styles.wrapper}
                >
                    <TouchableOpacity
                        style={styles.button}
                        onPress={action.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconCircle,
                            action.color ? { backgroundColor: action.color + '18' } : {}
                        ]}>
                            <Ionicons
                                name={action.icon}
                                size={24}
                                color={action.color || Colors.primary}
                            />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.label}>{action.label}</Text>
                </Animated.View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    wrapper: {
        alignItems: 'center',
        flex: 1,
    },
    button: {
        marginBottom: 8,
    },
    iconCircle: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    label: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        color: Colors.text,
    },
});
