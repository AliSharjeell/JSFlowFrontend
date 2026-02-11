const BASE_URL = 'https://ltgnx8hv-8002.inc1.devtunnels.ms';

export const BackendTTSService = {
    /**
     * Constructs the URL for the backend TTS endpoint.
     * Returns a remote URI that expo-av can stream directly.
     */
    getTTSUrl: (text: string, voice: string = 'en-US-ChristopherNeural'): string => {
        // Encode the text to ensure special characters don't break the URL
        const encodedText = encodeURIComponent(text);
        const encodedVoice = encodeURIComponent(voice);

        return `${BASE_URL}/tts?text=${encodedText}&voice=${encodedVoice}`;
    }
};
