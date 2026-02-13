import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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
import ActionCard from '../../components/ActionCard';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import VoiceWave from '../../components/VoiceWave';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { AgentService, ToolCall } from '../../services/api';
import { BackendTTSService } from '../../services/backend_tts';
import { GroqService } from '../../services/groq';

type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface ChatMessage {
    role: 'user' | 'agent';
    text: string;
    timestamp: number;
    toolCalls?: ToolCall[];
}

export default function AssistantScreen() {
    const [status, setStatus] = useState<AssistantStatus>('idle');
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [metering, setMetering] = useState(-160);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const fillerSoundRef = useRef<Audio.Sound | null>(null);
    const ttsAbortRef = useRef(false);

    // Filler phrases for immediate audio feedback while agent thinks
    const FILLER_PHRASES = [
        'Let me check that for you.',
        'One moment please.',
        'Looking into that.',
        'Let me find that out.',
        'Sure, give me a second.',
    ];

    // Status text animation
    const statusOpacity = useSharedValue(1);

    useEffect(() => {
        if (status === 'processing') {
            statusOpacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
        } else {
            statusOpacity.value = withTiming(1);
        }
    }, [status]);

    // Cleanup sounds on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
            if (fillerSoundRef.current) {
                fillerSoundRef.current.unloadAsync();
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
        ttsAbortRef.current = true;
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

    // Play a random filler phrase immediately for audio feedback
    const playFiller = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const phrase = FILLER_PHRASES[Math.floor(Math.random() * FILLER_PHRASES.length)];
            const fillerUri = BackendTTSService.getTTSUrl(phrase);

            const { sound: fSound } = await Audio.Sound.createAsync(
                { uri: fillerUri },
                { shouldPlay: true, volume: 1.0 },
                (ps) => {
                    if (ps.isLoaded && ps.didJustFinish) {
                        fSound.unloadAsync();
                        if (fillerSoundRef.current === fSound) {
                            fillerSoundRef.current = null;
                        }
                    }
                }
            );
            fillerSoundRef.current = fSound;
        } catch (e) {
            console.log('Filler TTS error:', e);
        }
    };

    // Stop filler audio immediately
    const stopFiller = async () => {
        try {
            if (fillerSoundRef.current) {
                await fillerSoundRef.current.stopAsync();
                await fillerSoundRef.current.unloadAsync();
                fillerSoundRef.current = null;
            }
        } catch (e) {
            console.log('Stop filler error:', e);
        }
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

    // Ref to track if processing is already active (prevents double-send)
    const processingRef = useRef(false);

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || inputText.trim();
        if (!textToSend || processingRef.current || status === 'processing') return;

        processingRef.current = true;

        const userMessage: ChatMessage = {
            role: 'user',
            text: textToSend,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setStatus('processing');

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        // Play filler TTS immediately for audio feedback
        playFiller();

        try {
            const response = await AgentService.chat(textToSend, 'demo_thread_1');
            console.log('🔍 Agent response:', JSON.stringify(response, null, 2));
            console.log('🔍 Tool calls:', response?.tool_calls);
            const agentText = response?.answer || "I'm sorry, I couldn't process that.";

            // Stop filler audio before playing real response
            await stopFiller();

            const agentMessage: ChatMessage = {
                role: 'agent',
                text: agentText,
                timestamp: Date.now(),
                toolCalls: response?.tool_calls || undefined,
            };

            setMessages(prev => [...prev, agentMessage]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

            // Start TTS immediately (don't await — text + audio play together)
            const execId = Math.random().toString(36).substring(7);
            console.log(`[TTS:${execId}] Starting speakResponse for: "${agentText.substring(0, 20)}..."`);
            speakResponse(agentText, execId);
        } catch (error: any) {
            console.log('Agent error (suppressed):', error?.message);
            await stopFiller();
            const fallbackMessage: ChatMessage = {
                role: 'agent',
                text: "Sorry, can you tell me this again in detail?",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, fallbackMessage]);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            setStatus('idle');
        } finally {
            processingRef.current = false;
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

    // Split text into speakable chunks (sentences)
    const splitIntoSentences = (text: string): string[] => {
        // Split on sentence-ending punctuation followed by a space or end
        const raw = text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g) || [text];
        return raw
            .map(s => s.trim())
            .filter(s => s.length > 2); // skip tiny fragments
    };

    const speakResponse = async (text: string, execId?: string) => {
        const id = execId || Math.random().toString(36).substring(7);
        console.log(`[TTS:${id}] speakResponse called`);

        setStatus('speaking');
        ttsAbortRef.current = false;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const safeText = cleanTextForTTS(text);
            if (!safeText) {
                setStatus('idle');
                return;
            }

            const sentences = splitIntoSentences(safeText);
            console.log(`[TTS:${id}] Streaming ${sentences.length} chunks`);

            for (let i = 0; i < sentences.length; i++) {
                if (ttsAbortRef.current) {
                    console.log(`[TTS:${id}] Aborted at chunk ${i}`);
                    break;
                }

                const chunk = sentences[i];
                console.log(`[TTS:${id}] Chunk ${i + 1}/${sentences.length}: "${chunk.substring(0, 20)}..."`);

                const audioUri = BackendTTSService.getTTSUrl(chunk);

                try {
                    // Create and start playing
                    const { sound: chunkSound } = await Audio.Sound.createAsync(
                        { uri: audioUri },
                        { shouldPlay: true, volume: 1.0 }
                    );

                    setSound(chunkSound);

                    // Wait for this chunk to finish before playing next
                    await new Promise<void>((resolve) => {
                        chunkSound.setOnPlaybackStatusUpdate((ps) => {
                            if (ps.isLoaded && ps.didJustFinish) {
                                resolve();
                            }
                            if (ps.isLoaded && ps.isPlaying) {
                                setMetering(-30 + Math.random() * 20);
                            }
                        });
                    });

                    await chunkSound.unloadAsync();
                } catch (chunkErr) {
                    console.log(`Chunk ${i + 1} error:`, chunkErr);
                }
            }
        } catch (error) {
            console.error('TTS Error:', error);
        }

        setStatus('idle');
        setMetering(-160);
        setSound(null);
    };

    const renderMessage = (message: ChatMessage, index: number) => {
        const isUser = message.role === 'user';
        return (
            <View key={`${message.timestamp}-${index}`}>
                <Animated.View
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

                {/* Render Action Cards below agent message */}
                {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
                    <View style={styles.actionCardsContainer}>
                        {message.toolCalls.map((tc, i) => (
                            <ActionCard key={`${tc.name}-${i}`} toolCall={tc} index={i} />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
                        { backgroundColor: status === 'idle' ? Colors.success : '#3B82F6' }
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
                        <Text style={styles.statusText}>{getStatusText()}</Text>
                    </Animated.View>

                    <View style={styles.waveformWrapper}>
                        <VoiceWave
                            isPlaying={status === 'listening' || status === 'speaking'}
                            isProcessing={status === 'processing'}
                            phase={status}
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
                                <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                                <View style={styles.waveformSmall}>
                                    <VoiceWave
                                        isPlaying={status === 'listening' || status === 'speaking'}
                                        isProcessing={false}
                                        phase={status}
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
                        placeholderTextColor="#A0AEC0"
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
                            <View style={styles.sendButtonInner}>
                                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                            </View>
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
                    <View style={[
                        styles.micInner,
                        status === 'listening' && styles.micInnerActive,
                    ]}>
                        {status === 'processing' ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Ionicons
                                name={
                                    status === 'listening' ? 'stop'
                                        : status === 'speaking' ? 'stop'
                                            : 'mic'
                                }
                                size={28}
                                color="white"
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: '#FFFFFF',
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
        color: '#94A3B8',
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
        color: '#CBD5E1',
        textAlign: 'center',
    },

    // Chat
    chatContainer: {
        flex: 1,
    },
    inlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    waveformSmall: {
        height: 36,
        width: 100,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineStatusText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: '#94A3B8',
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
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    agentBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#F8FAFC',
        borderBottomLeftRadius: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    agentIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
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
        color: '#FFFFFF',
    },
    agentTextWrapper: {
        flex: 1,
        flexShrink: 1,
    },
    actionCardsContainer: {
        paddingLeft: 32,
        paddingRight: 16,
        marginTop: 6,
        marginBottom: 4,
    },

    // Controls
    controlsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 12,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 0,
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textInput: {
        flex: 1,
        fontFamily: Fonts.regular,
        fontSize: 15,
        color: Colors.text,
        paddingVertical: 12,
        height: 48,
    },
    sendButton: {
        padding: 4,
    },
    sendButtonInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    micButtonActive: {
        transform: [{ scale: 1.08 }],
        shadowColor: '#EF4444',
    },
    micButtonProcessing: {
        opacity: 0.7,
    },
    micInner: {
        flex: 1,
        borderRadius: 32,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micInnerActive: {
        backgroundColor: '#EF4444',
    },
});

