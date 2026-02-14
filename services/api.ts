import axios from 'axios';

// Replace with your actual backend URL. 
// If using Android Emulator use 'http://10.0.2.2:8000'
// If using iOS Simulator use 'http://localhost:8000'
// If using physical device, use your machine's IP address.
const API_URL = 'https://ltgnx8hv-8001.inc1.devtunnels.ms/';

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
});

export interface ToolCall {
    name: string;
    args: Record<string, any>;
    result: any;
}

// ── Visual Widget Types ──────────────────────────────────────

export type VisualWidgetType =
    | 'COMPOSITE_FORM'
    | 'CONFIRMATION_CARD'
    | 'SELECTION_LIST'
    | 'INFO_TABLE'
    | 'TEXT_BUBBLE';

export type VisualState = 'initial' | 'submitted' | 'processing' | 'success' | 'error';

export interface VisualPayload {
    type: VisualWidgetType;
    state: VisualState;
    data: any;
}

// ── Chat Response (dual-channel: voice + visual) ─────────────

export interface ChatResponse {
    // New dual-channel format
    voice?: string;
    visual?: VisualPayload;
    // Legacy format (backward compat)
    answer?: string;
    classification?: string;
    tool_calls?: ToolCall[];
}

/**
 * Extracts the voice text from a ChatResponse, falling back to legacy `answer`.
 */
export function getVoiceText(response: ChatResponse): string {
    return response.voice || response.answer || "I'm sorry, I couldn't process that.";
}

/**
 * Extracts the display text — same as voice text but can be overridden for richer display.
 */
export function getDisplayText(response: ChatResponse): string {
    // If it's a plain TEXT_BUBBLE, use the markdown from visual data
    if (response.visual?.type === 'TEXT_BUBBLE' && response.visual.data?.markdown) {
        return response.visual.data.markdown;
    }
    return response.voice || response.answer || "I'm sorry, I couldn't process that.";
}

export const AgentService = {
    chat: async (message: string, threadId: string = 'default'): Promise<ChatResponse> => {
        try {
            const response = await api.post<ChatResponse>('/chat', {
                question: message,
                thread_id: "user_session_187",
            });

            const data = response.data;

            // ── Dynamic Parsing Fix ──
            // If the backend returns the new format stringified inside 'answer'
            if (!data.voice && !data.visual && data.answer) {
                try {
                    const parsed = JSON.parse(data.answer);
                    if (parsed.voice || parsed.visual) {
                        data.voice = parsed.voice;
                        data.visual = parsed.visual;
                        // Optionally clear answer to avoid duplicate text, 
                        // but keeping it might be safer for legacy fallbacks 
                        // if voice is empty.
                        if (parsed.voice) data.answer = parsed.voice;
                    }
                } catch (e) {
                    // Not JSON, just normal text. Ignore.
                }
            }

            return data;
        } catch (error) {
            //console.error('Agent API Error:', error);
            throw error;
        }
    },
};

export default api;
