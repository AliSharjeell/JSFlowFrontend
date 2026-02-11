import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || 'sk_b03c2858e395bc4032bf1818aad9823d8de351201f27984c';
const BASE_URL = 'https://api.elevenlabs.io/v1';

export const ElevenLabsService = {
    textToSpeech: async (text: string, voiceId: string = 'JBFqnCBsd6RMkjVDRZzb'): Promise<string> => {
        try {
            console.log('Generating audio with ElevenLabs...');
            const response = await axios.post(
                `${BASE_URL}/text-to-speech/${voiceId}`,
                {
                    text,
                    model_id: 'eleven_multilingual_v2',
                    output_format: 'mp3_44100_128',
                },
                {
                    headers: {
                        'xi-api-key': ELEVENLABS_API_KEY,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg',
                    },
                    responseType: 'arraybuffer', // Important for binary audio data
                }
            );

            // Create a unique file path
            const timestamp = new Date().getTime();
            const fileUri = `${FileSystem.cacheDirectory}speech_${timestamp}.mp3`;

            // Convert arraybuffer to base64
            const buffer = Buffer.from(response.data);
            const base64Data = buffer.toString('base64');

            // Save to file system
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64,
            });

            console.log('Audio saved to:', fileUri);
            return fileUri;
        } catch (error: any) {
            console.error('ElevenLabs TTS Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
