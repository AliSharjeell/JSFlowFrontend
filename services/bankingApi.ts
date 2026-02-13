import axios from 'axios';

const BASE_URL = 'https://ltgnx8hv-8000.inc1.devtunnels.ms/api/v1';
const TIMEOUT = 30000;

const client = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// ── Types ────────────────────────────────────────────────────

export interface BalanceData {
    account_id: string;
    currency: string;
    available_balance: number;
    ledger_balance: number;
    status: string;
}

export interface Contact {
    id: string;
    name: string;
    nickname?: string;
    bank?: string;
    account_no: string;
}

export interface TransferPreview {
    recipient_name: string;
    bank?: string;
    account_number: string;
    amount: number;
    fee: number;
    total_deduction: number;
    your_balance_after: number;
    warning: string | null;
}

export interface TransferResult {
    transfer_id: string;
    status: string;
    amount: number;
    recipient_name: string;
    new_balance: number;
    timestamp: string;
}

export interface Transaction {
    id: string;
    type: string;
    amount: number;
    recipient_name?: string;
    category: string;
    date: string;
    status: string;
}

export interface Biller {
    id: string;
    name?: string; // Added from docs example (My Electric Bill)
    provider_slug: string;
    consumer_number: string;
    category?: string; // Added from docs example
}

export interface BillPayResult {
    transaction_id: string;
    status: string;
    provider: string;
    consumer_number: string;
    amount_paid: number;
    new_balance: number;
    timestamp: string;
}

export interface VirtualCard {
    id: string;
    card_id?: string;
    label?: string;
    pan: string;
    is_virtual?: boolean;
    expiry: string;
    cvv: string;
    daily_limit: string | number;
    status: string;
    message?: string;
}

export interface CardActionResult {
    card_id: string;
    status: string;
    message: string;
    updated_at?: string;
}

export interface SpendingAnalytics {
    period: string;
    total_spend: number;
    transaction_count: number;
    top_category: string;
    category_breakdown: Record<string, number>;
    change_vs_previous_period: string;
}

// ── API Functions ────────────────────────────────────────────

export const BankingApi = {
    // ── Accounts ──
    getBalance: async (): Promise<BalanceData> => {
        const { data } = await client.get('/accounts/balance');
        return data;
    },

    // ── Contacts ──
    getContacts: async (): Promise<Contact[]> => {
        const { data } = await client.get('/contacts');
        return Array.isArray(data) ? data : data ?? [];
    },

    createContact: async (accountNumber: string, nickname?: string): Promise<Contact> => {
        const body: Record<string, string> = { account_number: accountNumber };
        if (nickname) body.nickname = nickname;
        const { data } = await client.post('/contacts', body);
        return data;
    },

    // ── Transfers ──
    previewTransfer: async (
        recipientId: string,
        amount: number,
        note?: string
    ): Promise<TransferPreview> => {
        const body: Record<string, any> = { recipient_id: recipientId, amount };
        if (note) body.note = note;
        const { data } = await client.post('/transfers/preview', body);
        return data;
    },

    executeTransfer: async (
        recipientId: string,
        amount: number,
        pin: string,
        note?: string
    ): Promise<TransferResult> => {
        const body: Record<string, any> = { recipient_id: recipientId, amount, pin };
        if (note) body.note = note;
        const idempotencyKey = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { data } = await client.post('/transfers', body, {
            headers: { 'X-Idempotency-Key': idempotencyKey },
        });
        return data;
    },

    // ── Transactions ──
    getTransactions: async (
        limit: number = 10,
        category?: string,
        startDate?: string,
        endDate?: string
    ): Promise<Transaction[]> => {
        const params: Record<string, any> = { limit };
        if (category) params.category = category;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const { data } = await client.get('/transactions', { params });
        // Docs: { data: [...], count: ... }
        return data.data ? data.data : [];
    },

    // ── Billers ──
    getBillers: async (): Promise<Biller[]> => {
        const { data } = await client.get('/billers');
        return Array.isArray(data) ? data : data ?? [];
    },

    saveBiller: async (
        providerSlug: string,
        consumerNumber: string,
        nickname?: string
    ): Promise<Biller> => {
        const body: Record<string, string> = {
            provider_slug: providerSlug,
            consumer_number: consumerNumber,
        };
        if (nickname) body.nickname = nickname;
        const { data } = await client.post('/billers', body);
        return data;
    },

    payBill: async (
        consumerNumber?: string,
        billerId?: string,
        billerName?: string,
        amount?: number
    ): Promise<BillPayResult> => {
        const body: Record<string, any> = {};
        if (consumerNumber) body.consumer_number = consumerNumber;
        if (billerId) body.biller_id = billerId;
        if (billerName) body.biller_name = billerName;
        if (amount !== undefined) body.amount = amount;
        const { data } = await client.post('/payments/bill', body);
        return data;
    },

    // ── Cards ──
    getCards: async (): Promise<VirtualCard[]> => {
        const { data } = await client.get('/cards');
        return Array.isArray(data) ? data : data?.data ?? [];
    },

    createVirtualCard: async (label: string, limit: number, pin: string): Promise<VirtualCard> => {
        const { data } = await client.post('/cards/virtual', { label, limit, pin });
        return data;
    },

    cardAction: async (
        cardId: string,
        action: 'freeze' | 'unfreeze',
        pin: string,
        reason?: string
    ): Promise<CardActionResult> => {
        const body: Record<string, string> = { action, pin };
        if (reason) body.reason = reason;
        const { data } = await client.post(`/cards/${cardId}/action`, body);
        return data;
    },

    changeCardPin: async (
        cardId: string,
        currentPin: string,
        newPin: string
    ): Promise<any> => {
        const { data } = await client.put(`/cards/${cardId}/pin`, {
            current_pin: currentPin,
            new_pin: newPin,
        });
        return data;
    },

    updateCardLimit: async (
        cardId: string,
        amount: number,
        pin: string,
        limitType: string = 'daily'
    ): Promise<any> => {
        const { data } = await client.put(`/cards/${cardId}/limit`, {
            amount,
            limit_type: limitType,
            pin,
        });
        return data;
    },

    // ── Analytics ──
    getSpendingAnalytics: async (
        period: string = 'last_month',
        category?: string
    ): Promise<SpendingAnalytics> => {
        const params: Record<string, string> = { period };
        if (category) params.category = category;
        const { data } = await client.get('/analytics/spend', { params });
        return data;
    },

    // ── Account Actions ──
    accountAction: async (
        action: 'freeze' | 'unfreeze',
        pin: string,
        reason?: string
    ): Promise<any> => {
        const body: Record<string, string> = { action, pin };
        if (reason) body.reason = reason;
        const { data } = await client.post('/accounts/action', body);
        return data;
    },
};
