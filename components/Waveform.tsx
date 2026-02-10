import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, interpolate } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface WaveformProps {
    isListening: boolean;
    metering?: number; // dB value, typically -160 to 0
}

export const Waveform: React.FC<WaveformProps> = ({ isListening, metering = -160 }) => {
    // Create 5 bars for the waveform
    const bars = [0, 1, 2, 3, 4];
    // Shared values for each bar's height
    const heights = bars.map(() => useSharedValue(10));

    useEffect(() => {
        if (isListening) {
            // Normalize metering (-160 to 0) to a 0-1 scae roughly
            // Good speech is usually around -30dB to -10dB. Silence is < -50dB.
            const intensity = Math.max(0, (metering + 60) / 60); // Clamp to 0-1 range for effective audio levels

            heights.forEach((height, index) => {

                const baseHeight = 15;
                const variableHeight = 50 * intensity;

                // Add some randomness so they don't move in valid unison
                const randomFactor = Math.random() * 0.5 + 0.5;

                // Center bars (2) might be taller naturally
                const centerFactor = index === 2 ? 1.5 : (index === 1 || index === 3) ? 1.2 : 1.0;

                const targetHeight = baseHeight + (variableHeight * randomFactor * centerFactor);

                height.value = withSpring(targetHeight, { damping: 10, stiffness: 100 });
            });
        } else {
            heights.forEach((height) => {
                height.value = withTiming(10, { duration: 300 });
            });
        }
    }, [isListening, metering]);

    return (
        <View style={styles.container}>
            {bars.map((i) => {
                const animatedStyle = useAnimatedStyle(() => {
                    return {
                        height: heights[i].value,
                    };
                });

                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.bar,
                            animatedStyle,
                            { opacity: isListening ? 1 : 0.5 } // Dim when idle
                        ]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
    },
    bar: {
        width: 8,
        backgroundColor: Colors.tertiary1,
        marginHorizontal: 4,
        borderRadius: 4,
    },
});
