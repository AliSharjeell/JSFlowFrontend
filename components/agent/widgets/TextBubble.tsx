import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MarkdownRenderer } from '../../MarkdownRenderer';

interface TextBubbleData {
    markdown: string;
}

interface TextBubbleProps {
    data: TextBubbleData;
}

export default function TextBubble({ data }: TextBubbleProps) {
    if (!data?.markdown) return null;

    return (
        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
            <MarkdownRenderer>{data.markdown}</MarkdownRenderer>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        marginTop: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
});
