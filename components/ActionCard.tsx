import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { ToolCall } from '../services/api';

/* ──── CARD CONFIG ──── */
interface CardConfig {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    color: string;
    bg: string;
    render: (result: any, args: Record<string, any>) => React.ReactNode;
}

const fmtMoney = (n: number | undefined, cur = 'PKR') =>
    n != null ? `${cur} ${Number(n).toLocaleString()}` : '—';

const CARD_MAP: Record<string, CardConfig> = {
    /* ─── Contacts ─── */
    get_contacts: {
        icon: 'people-outline',
        title: 'Contacts Found',
        color: '#2563EB',
        bg: '#EFF6FF',
        render: (r) => {
            const contacts = Array.isArray(r) ? r : r?.contacts || [];
            if (contacts.length === 0) return <Text style={s.dimText}>No contacts found</Text>;
            return (
                <>
                    {contacts.slice(0, 5).map((c: any, i: number) => (
                        <View key={i} style={s.txRow}>
                            <View style={[s.iconWrap, { width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', marginRight: 10 }]}>
                                <Text style={{ fontFamily: Fonts.bold, color: '#1E40AF', textAlign: 'center', lineHeight: 32 }}>
                                    {c.name?.charAt(0) || '?'}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.txName}>{c.name}</Text>
                                <Text style={s.txDate}>{c.bank} • {c.account_no?.slice(-4)}</Text>
                            </View>
                        </View>
                    ))}
                    {contacts.length > 5 && (
                        <Text style={s.dimText}>+{contacts.length - 5} more</Text>
                    )}
                </>
            );
        },
    },
    /* ─── Balance ─── */
    get_balance: {
        icon: 'wallet-outline',
        title: 'Account Balance',
        color: '#2A66BC',
        bg: '#EBF3FF',
        render: (r) => (
            <>
                <Row label="Available" value={fmtMoney(r?.available_balance, r?.currency)} bold />
                <Row label="Ledger" value={fmtMoney(r?.ledger_balance, r?.currency)} />
                <Row label="Status" value={r?.status || '—'} />
            </>
        ),
    },

    /* ─── Transactions ─── */
    get_transactions: {
        icon: 'list-outline',
        title: 'Transactions',
        color: '#7C3AED',
        bg: '#F3EAFF',
        render: (r) => {
            const txns = Array.isArray(r) ? r : r?.data || r?.transactions || [];
            if (txns.length === 0) return <Text style={s.dimText}>No transactions found</Text>;
            return (
                <>
                    {txns.slice(0, 5).map((tx: any, i: number) => (
                        <View key={i} style={s.txRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.txName}>{tx.recipient_name || tx.type}</Text>
                                <Text style={s.txDate}>{tx.date}</Text>
                            </View>
                            <Text style={[s.txAmt, tx.type === 'DEBIT' ? s.debit : s.credit]}>
                                {tx.type === 'DEBIT' ? '-' : '+'}{fmtMoney(tx.amount, tx.currency)}
                            </Text>
                        </View>
                    ))}
                    {txns.length > 5 && (
                        <Text style={s.dimText}>+{txns.length - 5} more</Text>
                    )}
                </>
            );
        },
    },

    /* ─── Transfer Preview ─── */
    preview_transfer: {
        icon: 'swap-horizontal-outline',
        title: 'Transfer Preview',
        color: '#D97706',
        bg: '#FFF7ED',
        render: (r) => (
            <>
                <Row label="To" value={r?.recipient_name || r?.to_account || '—'} />
                <Row label="Amount" value={fmtMoney(r?.amount, r?.currency)} bold />
                <Row label="Fee" value={fmtMoney(r?.fee, r?.currency)} />
                {r?.total && <Row label="Total" value={fmtMoney(r.total, r.currency)} bold />}
            </>
        ),
    },

    /* ─── Execute Transfer ─── */
    execute_transfer: {
        icon: 'checkmark-circle-outline',
        title: 'Transfer Successful',
        color: '#059669',
        bg: '#ECFDF5',
        render: (r) => (
            <>
                <Row label="To" value={r?.recipient_name || '—'} />
                <Row label="Amount" value={fmtMoney(r?.amount, r?.currency)} bold />
                <Row label="Ref" value={r?.reference_id || '—'} />
            </>
        ),
    },

    /* ─── Cards ─── */
    get_cards: {
        icon: 'card-outline',
        title: 'Virtual Cards',
        color: '#8B5CF6',
        bg: '#F5F0FF',
        render: (r) => {
            const cards = Array.isArray(r) ? r : r?.cards || [];
            if (cards.length === 0) return <Text style={s.dimText}>No cards found</Text>;
            return (
                <>
                    {cards.slice(0, 4).map((c: any, i: number) => (
                        <View key={i} style={s.txRow}>
                            <Ionicons name="card" size={16} color="#8B5CF6" />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={s.txName}>{c.pan || '•••• ****'}</Text>
                                <Text style={s.txDate}>{c.status}{c.is_virtual ? ' • Virtual' : ''}</Text>
                            </View>
                            <Text style={s.txAmt}>{fmtMoney(parseFloat(String(c.daily_limit || 0)))}</Text>
                        </View>
                    ))}
                </>
            );
        },
    },

    /* ─── Create Card ─── */
    create_virtual_card: {
        icon: 'add-circle-outline',
        title: 'Card Created',
        color: '#059669',
        bg: '#ECFDF5',
        render: (r, args) => (
            <>
                <Row label="Card" value={r?.pan || '•••• ****'} />
                <Row label="Label" value={r?.label || args?.label || '—'} />
                <Row
                    label="Limit"
                    value={fmtMoney(parseFloat(String(r?.daily_limit || r?.limit || args?.limit || 0)))}
                    bold
                />
                <Row label="Status" value={r?.status || 'Active'} />
            </>
        ),
    },

    /* ─── Card Action ─── */
    card_action: {
        icon: 'shield-checkmark-outline',
        title: 'Card Updated',
        color: '#2563EB',
        bg: '#EFF6FF',
        render: (r) => (
            <>
                <Row label="Action" value={r?.action || '—'} />
                <Row label="Status" value={r?.status || r?.message || 'Done'} />
            </>
        ),
    },

    /* ─── Billers ─── */
    get_billers: {
        icon: 'document-text-outline',
        title: 'Billers',
        color: '#DC2626',
        bg: '#FEF2F2',
        render: (r) => {
            const billers = Array.isArray(r) ? r : r?.billers || [];
            return (
                <>
                    {billers.slice(0, 5).map((b: any, i: number) => (
                        <View key={i} style={s.txRow}>
                            <Ionicons name="flash" size={14} color="#DC2626" />
                            <Text style={[s.txName, { marginLeft: 8 }]}>{b.name || b.provider_slug}</Text>
                        </View>
                    ))}
                </>
            );
        },
    },

    /* ─── Pay Bill ─── */
    pay_bill: {
        icon: 'checkmark-done-outline',
        title: 'Bill Paid',
        color: '#059669',
        bg: '#ECFDF5',
        render: (r) => (
            <>
                <Row label="Biller" value={r?.biller_name || r?.provider_slug || '—'} />
                <Row label="Amount" value={fmtMoney(r?.amount, r?.currency)} bold />
                <Row label="Status" value={r?.status || 'Paid'} />
            </>
        ),
    },

    /* ─── Analytics ─── */
    get_spending_analytics: {
        icon: 'pie-chart-outline',
        title: 'Spending Analytics',
        color: '#0891B2',
        bg: '#ECFEFF',
        render: (r) => (
            <>
                <Row label="Total Spend" value={fmtMoney(r?.total_spend)} bold />
                <Row label="Transactions" value={r?.transaction_count?.toString() || '—'} />
                <Row label="Top Category" value={r?.top_category || '—'} />
                {r?.change_percent != null && (
                    <Row
                        label="Change"
                        value={`${r.change_percent > 0 ? '+' : ''}${r.change_percent.toFixed(1)}%`}
                    />
                )}
            </>
        ),
    },

    /* ─── Account Action ─── */
    account_action: {
        icon: 'lock-closed-outline',
        title: 'Account Action',
        color: '#B45309',
        bg: '#FFFBEB',
        render: (r) => (
            <>
                <Row label="Action" value={r?.action || '—'} />
                <Row label="Status" value={r?.status || r?.message || 'Done'} />
            </>
        ),
    },

    /* ─── Login ─── */
    login_user: {
        icon: 'log-in-outline',
        title: 'Login',
        color: '#059669',
        bg: '#ECFDF5',
        render: (r) => (
            <>
                <Row label="Status" value={r?.message || r?.status || 'Logged in'} />
                {r?.user_id && <Row label="User" value={r.user_id} />}
            </>
        ),
    },

    /* ─── Register ─── */
    register_user: {
        icon: 'person-add-outline',
        title: 'Registration',
        color: '#7C3AED',
        bg: '#F3EAFF',
        render: (r) => (
            <>
                <Row label="Status" value={r?.message || 'Registered'} />
                {r?.user_id && <Row label="User ID" value={r.user_id} />}
            </>
        ),
    },

    /* ─── Create Contact ─── */
    create_contact: {
        icon: 'person-add-outline',
        title: 'Contact Created',
        color: '#059669',
        bg: '#ECFDF5',
        render: (r) => (
            <>
                <Row label="Name" value={r?.name || r?.nickname || '—'} bold />
                <Row label="Account" value={r?.account_no || '—'} />
                {r?.bank && <Row label="Bank" value={r.bank} />}
            </>
        ),
    },

    /* ─── Save Biller ─── */
    save_biller: {
        icon: 'save-outline',
        title: 'Biller Saved',
        color: '#059669',
        bg: '#ECFDF5',
        render: (r) => (
            <>
                <Row label="Name" value={r?.name || r?.nickname || '—'} bold />
                <Row label="Consumer No" value={r?.consumer_number || '—'} />
                <Row label="Provider" value={r?.provider_slug || '—'} />
            </>
        ),
    },

    /* ─── Card Actions (PIN/Limit) ─── */
    change_card_pin: {
        icon: 'key-outline',
        title: 'PIN Changed',
        color: '#2563EB',
        bg: '#EFF6FF',
        render: (r) => (
            <>
                <Row label="Status" value={r?.status || r?.message || 'Success'} />
                {r?.card_id && <Row label="Card ID" value={r.card_id} />}
            </>
        ),
    },

    update_card_limit: {
        icon: 'speedometer-outline',
        title: 'Limit Updated',
        color: '#2563EB',
        bg: '#EFF6FF',
        render: (r, args) => (
            <>
                <Row label="Status" value={r?.status || 'Success'} />
                <Row
                    label="New Limit"
                    value={fmtMoney(r?.new_limit || r?.daily_limit || r?.amount || args?.amount)}
                    bold
                />
            </>
        ),
    },
};

/* ──── HELPER COMPONENTS ──── */

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <View style={s.row}>
            <Text style={s.rowLabel}>{label}</Text>
            <Text style={[s.rowValue, bold && s.rowBold]} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

/* ──── MAIN EXPORT ──── */

interface ActionCardProps {
    toolCall: ToolCall;
    index?: number;
}

export default function ActionCard({ toolCall, index = 0 }: ActionCardProps) {
    const config = CARD_MAP[toolCall.name];

    // Safety: if result is a string, try to parse it as JSON
    let result = toolCall.result;
    if (typeof result === 'string') {
        try {
            // Handle MCP TextContent stringification: extract JSON from 'text='...' patterns
            const textMatch = result.match(/text='(.+)'/s) || result.match(/text="(.+)"/s);
            if (textMatch) {
                result = JSON.parse(textMatch[1]);
            } else {
                result = JSON.parse(result);
            }
        } catch {
            // keep as string
        }
    }

    // If we don't recognise the tool, render a minimal fallback
    if (!config) {
        return (
            <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={[s.card, { backgroundColor: '#F9FAFB' }]}>
                <View style={s.header}>
                    <View style={[s.iconWrap, { backgroundColor: '#E5E7EB' }]}>
                        <Ionicons name="cube-outline" size={18} color="#6B7280" />
                    </View>
                    <Text style={s.title}>{toolCall.name}</Text>
                </View>
                <Text style={s.dimText}>
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </Text>
            </Animated.View>
        );
    }

    // Check if result is an error
    const isError =
        typeof result === 'object' &&
        result !== null &&
        (result.error || result.detail);

    if (isError) {
        return (
            <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={[s.card, { backgroundColor: '#FEF2F2' }]}>
                <View style={s.header}>
                    <View style={[s.iconWrap, { backgroundColor: '#FECACA' }]}>
                        <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                    </View>
                    <Text style={[s.title, { color: '#DC2626' }]}>Error</Text>
                </View>
                <Text style={[s.dimText, { color: '#DC2626' }]}>
                    {result.error || result.detail || 'Something went wrong'}
                </Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 80).springify()}
            style={[s.card, { backgroundColor: config.bg }]}
        >
            <View style={s.header}>
                <View style={[s.iconWrap, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={18} color={config.color} />
                </View>
                <Text style={s.title}>{config.title}</Text>
            </View>
            <View style={s.body}>{config.render(result, toolCall.args)}</View>
        </Animated.View>
    );
}

/* ──── STYLES ──── */
const s = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        color: Colors.text,
    },
    body: {
        gap: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLabel: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    rowValue: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.text,
        maxWidth: '60%',
        textAlign: 'right',
    },
    rowBold: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        color: Colors.text,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#00000010',
    },
    txName: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.text,
    },
    txDate: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.textSecondary,
    },
    txAmt: {
        fontFamily: Fonts.bold,
        fontSize: 13,
        color: Colors.text,
    },
    debit: { color: Colors.error },
    credit: { color: Colors.success },
    dimText: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
    },
});
