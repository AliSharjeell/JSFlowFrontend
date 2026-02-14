import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

interface SelectionItem {
    id: string;
    title: string;
    subtitle?: string;
}

interface SelectionListData {
    title: string;
    items: SelectionItem[];
}

interface SelectionListProps {
    data: SelectionListData;
    onAction: (action: string, payload?: any) => void;
}

export default function SelectionList({ data, onAction }: SelectionListProps) {
    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconWrap}>
                    <Ionicons name="list-outline" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.title}>{data.title || 'Select an Option'}</Text>
            </View>

            {/* Items */}
            <View style={styles.body}>
                {data.items?.map((item, index) => (
                    <Animated.View
                        key={item.id}
                        entering={FadeInDown.delay(index * 60).springify()}
                    >
                        <TouchableOpacity
                            style={styles.itemRow}
                            onPress={() => onAction('select', item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                {item.subtitle ? (
                                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                                ) : null}
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#F5F0FF',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#7C3AED20',
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
        gap: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E9E3F5',
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.text,
    },
    itemSubtitle: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
