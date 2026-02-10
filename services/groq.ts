import axios from 'axios';
import { Platform } from 'react-native';
import { Paths, File as ExpoFile } from 'expo-file-system';

const GROQ_API_KEY = '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';

const GROQ_BASE = 'https://api.groq.com/openai/v1';

export const GroqService = {
    /**
     * Transcribe audio file using Groq Whisper.
     * Accepts the file URI from expo-av recording (m4a format on Android).
     */
    transcribeAudio: async (uri: string): Promise<string> => {
        try {
            const formData = new FormData();

            // Determine file extension and mime type
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'm4a';
            const mimeMap: Record<string, string> = {
                'm4a': 'audio/m4a',
                'mp4': 'audio/mp4',
                'wav': 'audio/wav',
                'mp3': 'audio/mpeg',
                'ogg': 'audio/ogg',
                'webm': 'audio/webm',
                'flac': 'audio/flac',
            };
            const mimeType = mimeMap[fileExt] || 'audio/m4a';

            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: `recording.${fileExt}`,
                type: mimeType,
            } as any);

            formData.append('model', 'whisper-large-v3');
            formData.append('language', 'en');

            const response = await axios.post(
                `${GROQ_BASE}/audio/transcriptions`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000,
                }
            );

            return response.data.text || '';
        } catch (error: any) {
            console.error('Groq STT Error:', error?.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Convert text to speech using Groq Orpheus TTS.
     * Returns the local file URI of the generated audio (WAV).
     */
    textToSpeech: async (text: string): Promise<string> => {
        try {
            // Call Groq TTS endpoint — returns binary audio
            const response = await axios.post(
                `${GROQ_BASE}/audio/speech`,
                {
                    model: 'playai-tts',
                    input: text,
                    voice: 'Fritz-PlayAI',
                    response_format: 'wav',
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000,
                }
            );

            // Convert arraybuffer to base64 string
            const bytes = new Uint8Array(response.data);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Audio = globalThis.btoa(binary);

            // Write to a temp file using new expo-file-system API
            const outputFile = new ExpoFile(Paths.cache, `tts_output_${Date.now()}.wav`);
            outputFile.write(base64Audio, { encoding: 'base64' });

            return outputFile.uri;
        } catch (error: any) {
            console.error('Groq TTS Error:', error?.response?.data || error.message);
            throw error;
        }
    },
};
