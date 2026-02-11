import axios from 'axios';

// Replace with your actual backend URL. 
// If using Android Emulator use 'http://10.0.2.2:8000'
// If using iOS Simulator use 'http://localhost:8000'
// If using physical device, use your machine's IP address.
const API_URL = 'https://ltgnx8hv-8001.inc1.devtunnels.ms';

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
});

export const AgentService = {
    chat: async (message: string, threadId: string = 'default') => {
        try {
            const response = await api.post('/chat', {
                question: message,
                thread_id: threadId,
            });
            return response.data;
        } catch (error) {
            console.error('Agent API Error:', error);
            throw error;
        }
    },
};

export default api;
