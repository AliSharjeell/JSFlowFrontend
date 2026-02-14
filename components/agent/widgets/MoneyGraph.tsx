import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedProps, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

interface MoneyGraphProps {
    data: {
        balance: string | number;
        currency?: string;
        trend?: 'up' | 'down' | 'neutral';
        history?: number[]; // Array of values for the graph
    };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const GRAPH_HEIGHT = 150;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function MoneyGraph({ data }: MoneyGraphProps) {
    const { balance, currency = '$', trend = 'up', history = [100, 120, 140, 130, 160, 180, 200] } = data;

    // Normalize data for SVG path
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;

    // Generate Path Data
    const points = history.map((value, index) => {
        const x = (index / (history.length - 1)) * CARD_WIDTH;
        const y = GRAPH_HEIGHT - ((value - min) / range) * (GRAPH_HEIGHT - 40) - 20; // 20px padding
        return `${x},${y}`;
    }).join(' ');

    // Smooth curve (simple bezier approximation or just polyline)
    // For simplicity, using polyline format "M x y L x y ..."
    const d = `M ${points.replace(/ /g, ' L ')}`;

    // Animation state
    const progress = useSharedValue(0);

    React.useEffect(() => {
        progress.value = withDelay(300, withTiming(1, { duration: 1500 }));
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: 1000 * (1 - progress.value),
    }));

    return (
        <Animated.View entering={FadeInDown.springify()} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>Total Balance</Text>
                <Animated.Text entering={FadeInDown.delay(200)} style={styles.balance}>
                    {currency}{typeof balance === 'number' ? balance.toLocaleString() : balance}
                </Animated.Text>
                <View style={[styles.trendBadge, trend === 'up' ? styles.trendUp : styles.trendDown]}>
                    <Text style={[styles.trendText, trend === 'up' ? styles.textUp : styles.textDown]}>
                        {trend === 'up' ? '▲ +2.4%' : '▼ -1.2%'}
                    </Text>
                </View>
            </View>

            <View style={styles.graphContainer}>
                <Svg width={CARD_WIDTH} height={GRAPH_HEIGHT}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={Colors.primary || '#3B82F6'} stopOpacity="0.2" />
                            <Stop offset="1" stopColor={Colors.primary || '#3B82F6'} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* Gradient Fill Area - simplified */}
                    {/* For now, just the line animation */}

                    <AnimatedPath
                        d={d}
                        fill="none"
                        stroke={Colors.primary || '#3B82F6'}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={[1000, 1000]}
                        animatedProps={animatedProps}
                    />
                </Svg>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Last 7 Days</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
        marginBottom: 20,
    },
    header: {
        marginBottom: 20,
    },
    label: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    balance: {
        fontFamily: Fonts.bold,
        fontSize: 36,
        color: '#0F172A',
        marginBottom: 8,
    },
    trendBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    trendUp: {
        backgroundColor: '#DCFCE7',
    },
    trendDown: {
        backgroundColor: '#FEE2E2',
    },
    trendText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
    },
    textUp: {
        color: '#16A34A',
    },
    textDown: {
        color: '#DC2626',
    },
    graphContainer: {
        height: GRAPH_HEIGHT,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    footer: {
        marginTop: 10,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: Fonts.regular,
        fontSize: 13,
        color: '#94A3B8',
    },
});
