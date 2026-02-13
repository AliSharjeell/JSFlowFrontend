import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    interpolateColor,
} from 'react-native-reanimated';

const BAR_COUNT = 16;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const MAX_HEIGHT = 48;
const MIN_HEIGHT = 6;

interface VoiceWaveProps {
    isPlaying: boolean;
    isProcessing: boolean;
    /** 'idle' | 'listening' | 'processing' | 'speaking' */
    phase?: 'idle' | 'listening' | 'processing' | 'speaking';
}

const PHASE_COLORS: Record<string, readonly [string, string]> = {
    idle: ['#6B7280', '#9CA3AF'] as const,
    listening: ['#EAB308', '#F59E0B'] as const,
    processing: ['#3B82F6', '#6366F1'] as const,
    speaking: ['#10B981', '#34D399'] as const,
};

function Bar({ index, isPlaying, phase }: { index: number; isPlaying: boolean; phase: string }) {
    const height = useSharedValue(MIN_HEIGHT);
    const colorProgress = useSharedValue(0);

    useEffect(() => {
        if (isPlaying) {
            const delay = index * 50;
            const peakHeight = MIN_HEIGHT + (Math.sin((index / BAR_COUNT) * Math.PI) + 0.5) * (MAX_HEIGHT - MIN_HEIGHT) * 0.8;

            height.value = withDelay(
                delay,
                withRepeat(
                    withSequence(
                        withTiming(peakHeight + Math.random() * 12, {
                            duration: 300 + Math.random() * 200,
                            easing: Easing.out(Easing.cubic),
                        }),
                        withTiming(MIN_HEIGHT + Math.random() * 8, {
                            duration: 250 + Math.random() * 150,
                            easing: Easing.in(Easing.cubic),
                        })
                    ),
                    -1,
                    true
                )
            );
        } else {
            height.value = withTiming(MIN_HEIGHT, { duration: 600, easing: Easing.out(Easing.quad) });
        }
    }, [isPlaying, index]);

    useEffect(() => {
        const phaseIndex = ['idle', 'listening', 'processing', 'speaking'].indexOf(phase);
        colorProgress.value = withTiming(phaseIndex >= 0 ? phaseIndex : 0, { duration: 500 });
    }, [phase]);

    const animatedStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(
            colorProgress.value,
            [0, 1, 2, 3],
            [PHASE_COLORS.idle[0], PHASE_COLORS.listening[0], PHASE_COLORS.processing[0], PHASE_COLORS.speaking[0]]
        );
        return {
            height: height.value,
            backgroundColor: bg,
        };
    });

    return <Animated.View style={[styles.bar, animatedStyle]} />;
}

export default function VoiceWave({ isPlaying, isProcessing, phase = 'idle' }: VoiceWaveProps) {
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0);

    useEffect(() => {
        if (isProcessing) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.3, { duration: 800, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
                ),
                -1,
                false
            );
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.25, { duration: 800 }),
                    withTiming(0, { duration: 800 })
                ),
                -1,
                false
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 400 });
            pulseOpacity.value = withTiming(0, { duration: 400 });
        }
    }, [isProcessing]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP;

    return (
        <View style={[styles.container, { width: totalWidth + 40, height: MAX_HEIGHT + 40 }]}>
            {/* Pulse ring */}
            <Animated.View style={[styles.pulseRing, pulseStyle, { width: totalWidth + 40, height: MAX_HEIGHT + 40 }]} />
            {/* Bars */}
            <View style={styles.barsRow}>
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                    <Bar key={i} index={i} isPlaying={isPlaying} phase={phase} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    barsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: BAR_GAP,
    },
    bar: {
        width: BAR_WIDTH,
        borderRadius: BAR_WIDTH / 2,
    },
});
