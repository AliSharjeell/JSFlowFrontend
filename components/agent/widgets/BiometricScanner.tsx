import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeIn
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

interface BiometricScannerProps {
    status?: 'scanning' | 'success' | 'failed';
    onComplete?: () => void;
}

const { width } = Dimensions.get('window');
const SCAN_SIZE = 200;

export default function BiometricScanner({ status = 'scanning', onComplete }: BiometricScannerProps) {
    const scanLineY = useSharedValue(0);
    const circleScale = useSharedValue(1);
    const successOpacity = useSharedValue(0);

    useEffect(() => {
        if (status === 'scanning') {
            scanLineY.value = withRepeat(
                withSequence(
                    withTiming(SCAN_SIZE, { duration: 1500, easing: Easing.linear }),
                    withTiming(0, { duration: 1500, easing: Easing.linear })
                ),
                -1,
                true
            );
            circleScale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1000 }),
                    withTiming(1.0, { duration: 1000 })
                ),
                -1,
                true
            );
        } else if (status === 'success') {
            scanLineY.value = withTiming(SCAN_SIZE / 2); // Center it
            circleScale.value = withTiming(1);
            successOpacity.value = withTiming(1, { duration: 500 });

            if (onComplete) {
                setTimeout(onComplete, 1500);
            }
        }
    }, [status]);

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineY.value }],
        opacity: status === 'success' ? 0 : 1,
    }));

    const circleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: circleScale.value }],
        borderColor: status === 'success' ? '#22C55E' : Colors.primary || '#3B82F6',
    }));

    const successContainerStyle = useAnimatedStyle(() => ({
        opacity: successOpacity.value,
        transform: [{ scale: successOpacity.value }],
    }));

    return (
        <Animated.View entering={FadeIn} style={styles.container}>
            <Text style={styles.title}>
                {status === 'scanning' ? 'Verifying Identity...' : 'Identity Verified'}
            </Text>

            <View style={styles.scannerWrapper}>
                {/* Rotating outermost ring (optional, keeping simple for now) */}

                {/* Main Circle */}
                <Animated.View style={[styles.circle, circleStyle]}>
                    <Ionicons
                        name="finger-print"
                        size={100}
                        color={status === 'success' ? '#22C55E' : Colors.primary || '#3B82F6'}
                        style={{ opacity: 0.5 }}
                    />

                    {/* Scanning Line */}
                    <Animated.View style={[styles.scanLine, scanLineStyle]} />
                </Animated.View>

                {/* Success Checkmark Overlay */}
                <Animated.View style={[styles.successOverlay, successContainerStyle]}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
                    </View>
                </Animated.View>
            </View>

            <Text style={styles.instruction}>
                {status === 'scanning' ? 'Please wait while we verify your request' : 'Authorization Complete'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        color: '#1E293B',
        marginBottom: 30,
    },
    scannerWrapper: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    circle: {
        width: '100%',
        height: '100%',
        borderRadius: SCAN_SIZE / 2,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Clip the scan line
        backgroundColor: '#F8FAFC',
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: Colors.primary || '#3B82F6',
        shadowColor: Colors.primary || '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        width: '100%',
    },
    successOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    instruction: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: '#64748B',
    },
});
