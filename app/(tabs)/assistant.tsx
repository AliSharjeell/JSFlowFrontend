import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert,
    Image,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle, useSharedValue, withRepeat, withTiming
} from 'react-native-reanimated';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { Waveform } from '../../components/Waveform';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { AgentService } from '../../services/api';
import { BackendTTSService } from '../../services/backend_tts';
import { GroqService } from '../../services/groq';

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface ChatMessage {
    role: 'user' | 'agent';
    text: string;
    timestamp: number;
}

export default function AssistantScreen() {
    const [status, setStatus] = useState<AssistantStatus>('idle');
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [metering, setMetering] = useState(-160);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Status text animation
    const statusOpacity = useSharedValue(1);

    useEffect(() => {
        if (status === 'processing') {
            statusOpacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
        } else {
            statusOpacity.value = withTiming(1);
        }
    }, [status]);

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const animatedStatusStyle = useAnimatedStyle(() => ({
        opacity: statusOpacity.value,
    }));

    const getStatusText = () => {
        switch (status) {
            case 'idle': return 'Tap the mic to speak';
            case 'listening': return 'Listening...';
            case 'processing': return 'Thinking...';
            case 'speaking': return 'Speaking...';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'idle': return 'mic-outline';
            case 'listening': return 'radio-outline';
            case 'processing': return 'hardware-chip-outline';
            case 'speaking': return 'volume-high-outline';
        }
    };


    const handleMicPress = async () => {
        if (status === 'idle') {
            startListening();
        } else if (status === 'listening') {
            stopListening();
        } else if (status === 'speaking') {
            stopSpeaking();
        }
    };

    const stopSpeaking = async () => {
        try {
            if (sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
            }
        } catch (e) {
            console.log('Stop speaking error:', e);
        }
        setStatus('idle');
    };

    const startListening = async () => {
        try {
            const { status: perm } = await Audio.requestPermissionsAsync();
            if (perm !== 'granted') {
                Alert.alert('Permission Needed', 'Please grant microphone permission to use voice features.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            newRecording.setOnRecordingStatusUpdate((recStatus) => {
                if (recStatus.metering !== undefined) {
                    setMetering(recStatus.metering);
                }
            });

            await newRecording.startAsync();
            setRecording(newRecording);
            setStatus('listening');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Could not start recording. Please try again.');
        }
    };

    const stopListening = async () => {
        if (!recording) return;

        setStatus('processing');
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            setMetering(-160);

            if (uri) {
                try {
                    const transcribedText = await GroqService.transcribeAudio(uri);
                    if (transcribedText && transcribedText.trim()) {
                        setInputText(transcribedText);
                        handleSendMessage(transcribedText);
                    } else {
                        Alert.alert('No Speech Detected', 'Could not detect any speech. Please try again.');
                        setStatus('idle');
                    }
                } catch (e) {
                    console.error('Transcription failed:', e);
                    Alert.alert('Transcription Error', 'Speech-to-text failed. You can type your message instead.');
                    setStatus('idle');
                }
            } else {
                setStatus('idle');
            }
        } catch (error) {
            console.error('Stop recording error', error);
            setStatus('idle');
        }
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || inputText.trim();
        if (!textToSend || status === 'processing') return;

        const userMessage: ChatMessage = {
            role: 'user',
            text: textToSend,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setStatus('processing');

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const response = await AgentService.chat(textToSend, 'demo_thread_1');
            const agentText = response?.answer || "I'm sorry, I couldn't process that.";

            const agentMessage: ChatMessage = {
                role: 'agent',
                text: agentText,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, agentMessage]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

            await speakResponse(agentText);
        } catch (error: any) {
            console.log('Agent error (suppressed):', error?.message);
            const fallbackMessage: ChatMessage = {
                role: 'agent',
                text: "Sorry, can you tell me this again in detail?",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, fallbackMessage]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            setStatus('idle');
        }
    };

    const cleanTextForTTS = (text: string) => {
        return text
            .replace(/\|.*?\|/g, '') // Remove table rows
            .replace(/[*#`_~-]/g, '') // Remove markdown formatting chars
            .replace(/\n\s*\n/g, '. ') // Replace double newlines with pauses
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
    };

    const speakResponse = async (text: string) => {
        setStatus('speaking');
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            // Sanitize text for TTS to avoid 400 errors from special chars/markdown
            const safeText = cleanTextForTTS(text);
            console.log('🗣️ Speaking:', safeText.substring(0, 50) + '...');

            if (!safeText) {
                setStatus('idle');
                return;
            }

            // Use the Backend DevTunnel URL directly
            // note: textToSpeech implies fetching, here we just get the URL
            const audioUri = BackendTTSService.getTTSUrl(safeText);

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true, volume: 1.0 },
                (playbackStatus) => {
                    if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
                        setStatus('idle');
                        setMetering(-160);
                        newSound.unloadAsync();
                        setSound(null);
                    }
                    if (playbackStatus.isLoaded && playbackStatus.isPlaying) {
                        const fakeMeter = -30 + Math.random() * 20;
                        setMetering(fakeMeter);
                    }
                }
            );

            setSound(newSound);
        } catch (error) {
            console.error('TTS Error:', error);
            setStatus('idle');
        }
    };

    const renderMessage = (message: ChatMessage, index: number) => {
        const isUser = message.role === 'user';
        return (
            <Animated.View
                key={`${message.timestamp}-${index}`}
                entering={FadeInDown.delay(50).springify()}
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.agentBubble,
                ]}
            >
                {!isUser && (
                    <View style={styles.agentIcon}>
                        <Ionicons name="sparkles" size={14} color={Colors.primary} />
                    </View>
                )}
                {isUser ? (
                    <Text style={[styles.messageText, styles.userMessageText]}>
                        {message.text}
                    </Text>
                ) : (
                    <View style={styles.agentTextWrapper}>
                        <MarkdownRenderer>
                            {message.text}
                        </MarkdownRenderer>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={[Colors.background, '#EAF2F8', '#D6EAF8']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerCenter}>
                    <Image
                        source={require('@/assets/logos/logo-black-transparent.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: status === 'idle' ? Colors.success : Colors.tertiary2 }
                    ]} />
                </View>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setMessages([])}
                >
                    <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Conversation Area */}
            {messages.length === 0 ? (
                <View style={styles.emptyState}>
                    <Animated.View style={[styles.statusContainer, animatedStatusStyle]}>
                        <Ionicons name={getStatusIcon()} size={28} color={Colors.primary} />
                        <Text style={styles.statusText}>{getStatusText()}</Text>
                    </Animated.View>

                    <View style={styles.waveformWrapper}>
                        <Waveform
                            isListening={status === 'listening' || status === 'speaking'}
                            metering={metering}
                        />
                    </View>

                    <Text style={styles.hintText}>
                        Ask about your finances, transactions, or anything else
                    </Text>
                </View>
            ) : (
                <View style={styles.chatContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesList}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map((msg, i) => renderMessage(msg, i))}
                    </ScrollView>

                    {/* Status bar pinned above controls */}
                    {(status === 'listening' || status === 'speaking' || status === 'processing') && (
                        <Animated.View entering={FadeIn} style={styles.inlineStatus}>
                            {status === 'processing' ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <View style={styles.waveformSmall}>
                                    <Waveform
                                        isListening={status === 'listening' || status === 'speaking'}
                                        metering={metering}
                                    />
                                </View>
                            )}
                            <Animated.Text style={[styles.inlineStatusText, animatedStatusStyle]}>
                                {getStatusText()}
                            </Animated.Text>
                        </Animated.View>
                    )}
                </View>
            )}

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={() => handleSendMessage()}
                        editable={status !== 'processing'}
                        multiline={false}
                    />
                    {inputText.trim() ? (
                        <TouchableOpacity
                            onPress={() => handleSendMessage()}
                            style={styles.sendButton}
                            disabled={status === 'processing'}
                        >
                            <Ionicons name="send" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={[
                        styles.micButton,
                        status === 'listening' && styles.micButtonActive,
                        status === 'processing' && styles.micButtonProcessing,
                    ]}
                    onPress={handleMicPress}
                    activeOpacity={0.8}
                    disabled={status === 'processing'}
                >
                    <LinearGradient
                        colors={
                            status === 'listening'
                                ? [Colors.error, '#C0392B']
                                : status === 'speaking'
                                    ? [Colors.primary, '#1A4B8F']
                                    : [Colors.tertiary1, Colors.tertiary2]
                        }
                        style={styles.micGradient}
                    >
                        {status === 'processing' ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Ionicons
                                name={
                                    status === 'listening' ? 'stop'
                                        : status === 'speaking' ? 'stop'
                                            : 'mic'
                                }
                                size={32}
                                color="white"
                            />
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
        zIndex: 10,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerLogo: {
        width: 100,
        height: 30,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    clearButton: {
        padding: 10,
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    statusContainer: {
        alignItems: 'center',
        gap: 12,
        marginBottom: 30,
    },
    statusText: {
        fontFamily: Fonts.medium,
        fontSize: 18,
        color: Colors.textSecondary,
        letterSpacing: 0.5,
    },
    waveformWrapper: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    hintText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        opacity: 0.7,
    },

    // Chat
    chatContainer: {
        flex: 1,
    },
    inlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    waveformSmall: {
        height: 36,
        width: 80,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineStatusText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        gap: 10,
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    agentBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    agentIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EBF3FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        flexShrink: 0,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        fontFamily: Fonts.regular,
        color: Colors.white,
    },
    agentMessageText: {
        fontFamily: Fonts.regular,
        color: Colors.text,
        flexShrink: 1,
        flex: 1,
    },
    agentTextWrapper: {
        flex: 1,
        flexShrink: 1,
    },

    // Controls
    controlsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        alignItems: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 0,
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    textInput: {
        flex: 1,
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.text,
        paddingVertical: 12,
        height: 48,
    },
    sendButton: {
        padding: 10,
    },
    micButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        shadowColor: Colors.tertiary2,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    micButtonActive: {
        transform: [{ scale: 1.08 }],
        shadowColor: Colors.error,
    },
    micButtonProcessing: {
        opacity: 0.7,
    },
    micGradient: {
        flex: 1,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
