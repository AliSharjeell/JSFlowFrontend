import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

interface InfoTableData {
    title: string;
    headers: string[];
    rows: string[][];
}

interface InfoTableProps {
    data: InfoTableData;
}

export default function InfoTable({ data }: InfoTableProps) {
    const colCount = data.headers?.length || 0;

    return (
        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconWrap}>
                    <Ionicons name="grid-outline" size={18} color="#0891B2" />
                </View>
                <Text style={styles.title}>{data.title || 'Details'}</Text>
            </View>

            {/* Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.table}>
                    {/* Table Header Row */}
                    <View style={styles.tableHeaderRow}>
                        {data.headers?.map((h, i) => (
                            <View key={i} style={[styles.cell, { minWidth: 100 }]}>
                                <Text style={styles.headerText}>{h}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Table Data Rows */}
                    {data.rows?.map((row, rowIdx) => (
                        <View
                            key={rowIdx}
                            style={[
                                styles.tableRow,
                                rowIdx % 2 === 0 && styles.tableRowAlt,
                            ]}
                        >
                            {row.map((cell, colIdx) => (
                                <View key={colIdx} style={[styles.cell, { minWidth: 100 }]}>
                                    <Text style={styles.cellText} numberOfLines={2}>
                                        {cell}
                                    </Text>
                                </View>
                            ))}
                            {/* Fill remaining columns if row is short */}
                            {row.length < colCount &&
                                Array.from({ length: colCount - row.length }).map((_, i) => (
                                    <View key={`empty-${i}`} style={[styles.cell, { minWidth: 100 }]}>
                                        <Text style={styles.cellText}>—</Text>
                                    </View>
                                ))}
                        </View>
                    ))}

                    {(!data.rows || data.rows.length === 0) && (
                        <View style={styles.emptyRow}>
                            <Text style={styles.emptyText}>No data available</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ECFEFF',
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
        backgroundColor: '#0891B220',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        color: Colors.text,
    },
    table: {
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#0891B215',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
    },
    tableRowAlt: {
        backgroundColor: '#F8FDFE',
    },
    cell: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: '#E0F2FE',
    },
    headerText: {
        fontFamily: Fonts.semiBold,
        fontSize: 12,
        color: '#0E7490',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cellText: {
        fontFamily: Fonts.regular,
        fontSize: 13,
        color: Colors.text,
    },
    emptyRow: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
