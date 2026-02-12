import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { BankingApi, VirtualCard } from '../../services/bankingApi';

const CARD_GRADIENTS: [string, string][] = [
    ['#2A66BC', '#1e4b8f'],
    ['#8B5CF6', '#6D28D9'],
    ['#F27A21', '#E65100'],
    ['#10B981', '#047857'],
    ['#EC4899', '#BE185D'],
];

export default function CardsScreen() {
    const [cards, setCards] = useState<VirtualCard[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [label, setLabel] = useState('');
    const [limit, setLimit] = useState('');
    const [creating, setCreating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newLimit, setNewLimit] = useState('');
    const [limitType, setLimitType] = useState<'daily' | 'online' | 'atm'>('daily');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [createPin, setCreatePin] = useState('');
    const [limitPin, setLimitPin] = useState('');
    const [actionPin, setActionPin] = useState('');
    const [showActionModal, setShowActionModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'freeze' | 'unfreeze' | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const fetchedCards = await BankingApi.getCards().catch((e) => {
                console.log('\u274c Cards error:', e?.message, e?.response?.status, e?.response?.data);
                return null;
            });
            console.log('\ud83d\udce6 Cards response:', JSON.stringify(fetchedCards));
            if (fetchedCards === null) {
                setError('Could not load cards. Pull down to retry.');
            } else if (Array.isArray(fetchedCards)) {
                setCards(fetchedCards);
            }
        } catch (e: any) {
            setError('Could not load cards. Pull down to retry.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleCreateCard = async () => {
        if (!label.trim()) { Alert.alert('Missing', 'Please enter a card label.'); return; }
        if (createPin.length !== 4) { Alert.alert('Invalid PIN', 'Please set a 4-digit PIN.'); return; }
        const lim = parseFloat(limit);
        if (!lim || lim <= 0) { Alert.alert('Invalid', 'Please enter a valid limit.'); return; }

        setCreating(true);
        try {
            const card = await BankingApi.createVirtualCard(label.trim(), lim, createPin);
            setCards(prev => [card, ...prev]);
            setShowCreate(false);
            setLabel('');
            setLimit('');
            setCreatePin('');
            Alert.alert('Success ✨', `Virtual card "${card.label}" created!`);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to create card.');
        } finally {
            setCreating(false);
        }
    };

    const initiateCardAction = (card: VirtualCard, action: 'freeze' | 'unfreeze') => {
        setSelectedCard(card);
        setPendingAction(action);
        setShowActionModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedCard || !pendingAction) return;
        if (actionPin.length !== 4) { Alert.alert('Invalid PIN', 'Enter your 4-digit PIN.'); return; }

        setActionLoading(selectedCard.card_id);
        try {
            await BankingApi.cardAction(selectedCard.card_id, pendingAction, actionPin);
            setCards(prev => prev.map(c =>
                c.card_id === selectedCard.card_id
                    ? { ...c, status: pendingAction === 'freeze' ? 'frozen' : 'active' }
                    : c
            ));
            setShowActionModal(false);
            setActionPin('');
            setPendingAction(null);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangePin = async () => {
        if (!selectedCard) return;
        if (currentPin.length !== 4 || newPin.length !== 4) {
            Alert.alert('Invalid', 'PIN must be 4 digits.');
            return;
        }
        setActionLoading('pin');
        try {
            await BankingApi.changeCardPin(selectedCard.card_id, currentPin, newPin);
            Alert.alert('Success ✅', 'PIN changed successfully.');
            setShowPinModal(false);
            setCurrentPin('');
            setNewPin('');
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to change PIN.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateLimit = async () => {
        if (!selectedCard) return;
        const amt = parseFloat(newLimit);
        if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid limit.'); return; }
        if (limitPin.length !== 4) { Alert.alert('Invalid PIN', 'Enter your 4-digit PIN.'); return; }

        setActionLoading('limit');
        try {
            await BankingApi.updateCardLimit(selectedCard.card_id, amt, limitPin, limitType);
            Alert.alert('Success ✅', `${limitType.charAt(0).toUpperCase() + limitType.slice(1)} limit updated to PKR ${amt.toLocaleString()}.`);
            setShowLimitModal(false);
            setNewLimit('');
            setLimitPin('');
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to update limit.');
        } finally {
            setActionLoading(null);
        }
    };

    const activeCount = cards.filter(c => c.status?.toLowerCase() === 'active').length;
    const frozenCount = cards.filter(c => c.status?.toLowerCase() === 'frozen').length;

    const renderCard = (card: VirtualCard, index: number) => {
        const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
        const isFrozen = card.status?.toLowerCase() === 'frozen';

        return (
            <Animated.View
                key={card.card_id}
                entering={FadeInDown.delay(index * 120).springify()}
            >
                <LinearGradient
                    colors={isFrozen ? ['#9CA3AF', '#6B7280'] : gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.virtualCard}
                >
                    {/* Decorative chip icon */}
                    <View style={styles.chipIcon}>
                        <View style={styles.chipOuter}>
                            <View style={styles.chipInner} />
                        </View>
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusBadge, isFrozen ? styles.frozenBadge : styles.activeBadge]}>
                        <Ionicons
                            name={isFrozen ? 'snow-outline' : 'checkmark-circle-outline'}
                            size={12}
                            color="#fff"
                        />
                        <Text style={styles.statusBadgeText}>
                            {isFrozen ? 'Frozen' : 'Active'}
                        </Text>
                    </View>

                    <View style={styles.cardHeader}>
                        <Text style={styles.cardLabel}>{card.label}</Text>
                        <Ionicons name="card" size={28} color="rgba(255,255,255,0.3)" />
                    </View>

                    <Text style={styles.cardPan}>{card.pan || '**** **** **** ****'}</Text>

                    <View style={styles.cardDetails}>
                        <View>
                            <Text style={styles.cardDetailLabel}>EXPIRY</Text>
                            <Text style={styles.cardDetailValue}>{card.expiry || '--/--'}</Text>
                        </View>
                        <View>
                            <Text style={styles.cardDetailLabel}>CVV</Text>
                            <Text style={styles.cardDetailValue}>{card.cvv || '***'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardDetailLabel}>LIMIT</Text>
                            <Text style={styles.cardDetailValue}>
                                PKR {(card.spend_limit ?? (card as any).limit)?.toLocaleString() || '0'}
                            </Text>
                        </View>
                    </View>

                    {/* Card Actions */}
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => initiateCardAction(card, isFrozen ? 'unfreeze' : 'freeze')}
                            disabled={actionLoading === card.card_id}
                        >
                            {actionLoading === card.card_id ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={isFrozen ? 'play-outline' : 'snow-outline'}
                                        size={16}
                                        color="#fff"
                                    />
                                    <Text style={styles.cardActionText}>
                                        {isFrozen ? 'Unfreeze' : 'Freeze'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => {
                                setSelectedCard(card);
                                setShowPinModal(true);
                            }}
                        >
                            <Ionicons name="key-outline" size={16} color="#fff" />
                            <Text style={styles.cardActionText}>PIN</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => {
                                setSelectedCard(card);
                                setShowLimitModal(true);
                            }}
                        >
                            <Ionicons name="trending-up-outline" size={16} color="#fff" />
                            <Text style={styles.cardActionText}>Limit</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading your cards...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cards</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowCreate(true)}
                >
                    <Ionicons name="add" size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {error && (
                    <Animated.View entering={FadeInDown} style={styles.errorBanner}>
                        <Ionicons name="cloud-offline-outline" size={18} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                )}
                {cards.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Animated.View entering={FadeIn} style={styles.emptyIcon}>
                            <Ionicons name="card-outline" size={64} color={Colors.border} />
                        </Animated.View>
                        <Text style={styles.emptyTitle}>No Virtual Cards</Text>
                        <Text style={styles.emptyDesc}>
                            Create a virtual card for safe online shopping. Tap the + button to get started.
                        </Text>
                        <TouchableOpacity
                            style={styles.createFirstBtn}
                            onPress={() => setShowCreate(true)}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#1e4b8f']}
                                style={styles.createFirstGradient}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.createFirstText}>Create Your First Card</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {/* Cards Summary Strip */}
                        <Animated.View key="summary" entering={FadeInDown.delay(50).springify()} style={styles.summaryStrip}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{cards.length}</Text>
                                <Text style={styles.summaryLabel}>Total</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: Colors.success }]}>{activeCount}</Text>
                                <Text style={styles.summaryLabel}>Active</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: '#9CA3AF' }]}>{frozenCount}</Text>
                                <Text style={styles.summaryLabel}>Frozen</Text>
                            </View>
                        </Animated.View>
                        {cards.map((card, index) => renderCard(card, index))}
                    </View>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Create Card Modal */}
            <Modal visible={showCreate} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Virtual Card</Text>
                            <TouchableOpacity onPress={() => setShowCreate(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Card Label</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Netflix, Online Shopping"
                            placeholderTextColor={Colors.textSecondary}
                            value={label}
                            onChangeText={setLabel}
                        />

                        <Text style={styles.inputLabel}>Spending Limit (PKR)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 5000"
                            placeholderTextColor={Colors.textSecondary}
                            value={limit}
                            onChangeText={setLimit}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Set Card PIN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="****"
                            placeholderTextColor={Colors.textSecondary}
                            value={createPin}
                            onChangeText={setCreatePin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, creating && { opacity: 0.6 }]}
                            onPress={handleCreateCard}
                            disabled={creating}
                        >
                            <LinearGradient
                                colors={[Colors.primary, '#1e4b8f']}
                                style={styles.primaryBtnGradient}
                            >
                                {creating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Create Card</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Change PIN Modal */}
            <Modal visible={showPinModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change PIN</Text>
                            <TouchableOpacity onPress={() => { setShowPinModal(false); setCurrentPin(''); setNewPin(''); }}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Current PIN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="****"
                            placeholderTextColor={Colors.textSecondary}
                            value={currentPin}
                            onChangeText={setCurrentPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <Text style={styles.inputLabel}>New PIN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="****"
                            placeholderTextColor={Colors.textSecondary}
                            value={newPin}
                            onChangeText={setNewPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, actionLoading === 'pin' && { opacity: 0.6 }]}
                            onPress={handleChangePin}
                            disabled={actionLoading === 'pin'}
                        >
                            <LinearGradient colors={[Colors.primary, '#1e4b8f']} style={styles.primaryBtnGradient}>
                                {actionLoading === 'pin' ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Change PIN</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Update Limit Modal */}
            <Modal visible={showLimitModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Limit</Text>
                            <TouchableOpacity onPress={() => { setShowLimitModal(false); setNewLimit(''); setLimitPin(''); }}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Limit Type</Text>
                        <View style={styles.segmentRow}>
                            {(['daily', 'online', 'atm'] as const).map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.segmentBtn, limitType === t && styles.segmentActive]}
                                    onPress={() => setLimitType(t)}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        limitType === t && styles.segmentTextActive
                                    ]}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>New Limit (PKR)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 10000"
                            placeholderTextColor={Colors.textSecondary}
                            value={newLimit}
                            onChangeText={setNewLimit}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Enter PIN to Confirm</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="****"
                            placeholderTextColor={Colors.textSecondary}
                            value={limitPin}
                            onChangeText={setLimitPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, actionLoading === 'limit' && { opacity: 0.6 }]}
                            onPress={handleUpdateLimit}
                            disabled={actionLoading === 'limit'}
                        >
                            <LinearGradient colors={[Colors.primary, '#1e4b8f']} style={styles.primaryBtnGradient}>
                                {actionLoading === 'limit' ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Update Limit</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Action Confirmation Modal */}
            <Modal visible={showActionModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirm Action</Text>
                            <TouchableOpacity onPress={() => { setShowActionModal(false); setActionPin(''); }}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.emptyDesc}>
                            Enter your PIN to {pendingAction} this card.
                        </Text>

                        <Text style={styles.inputLabel}>Enter PIN</Text>
                        <TextInput
                            style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontFamily: Fonts.bold }]}
                            placeholder="••••"
                            placeholderTextColor={Colors.border}
                            value={actionPin}
                            onChangeText={setActionPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, actionLoading === selectedCard?.card_id && { opacity: 0.6 }]}
                            onPress={handleConfirmAction}
                            disabled={!!actionLoading}
                        >
                            <LinearGradient colors={[Colors.primary, '#1e4b8f']} style={styles.primaryBtnGradient}>
                                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 60,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: Fonts.medium,
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 16,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.error,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.text,
    },
    addButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    // Virtual Card
    virtualCard: {
        borderRadius: 20,
        padding: 22,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    // Decorative chip
    chipIcon: {
        position: 'absolute',
        top: 22,
        left: 22,
    },
    chipOuter: {
        width: 36,
        height: 26,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    chipInner: {
        width: 18,
        height: 12,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    // Status badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
        marginBottom: 6,
    },
    frozenBadge: {
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    activeBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statusBadgeText: {
        color: '#fff',
        fontFamily: Fonts.medium,
        fontSize: 11,
    },
    // Summary strip
    summaryStrip: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontFamily: Fonts.bold,
        fontSize: 22,
        color: Colors.text,
    },
    summaryLabel: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    cardLabel: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: '#fff',
    },
    cardPan: {
        fontFamily: Fonts.medium,
        fontSize: 18,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 3,
        marginBottom: 18,
    },
    cardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardDetailLabel: {
        fontFamily: Fonts.body,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 3,
        letterSpacing: 1,
    },
    cardDetailValue: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: '#fff',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
        paddingTop: 14,
    },
    cardActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    cardActionText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: '#fff',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        marginBottom: 24,
    },
    emptyTitle: {
        fontFamily: Fonts.bold,
        fontSize: 22,
        color: Colors.text,
        marginBottom: 8,
    },
    emptyDesc: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 20,
    },
    createFirstBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    createFirstGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    createFirstText: {
        fontFamily: Fonts.semiBold,
        fontSize: 15,
        color: '#fff',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        color: Colors.text,
    },
    inputLabel: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 6,
        marginTop: 8,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    primaryBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 16,
    },
    primaryBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 16,
    },
    primaryBtnText: {
        fontFamily: Fonts.semiBold,
        fontSize: 16,
        color: '#fff',
    },
    // Segments
    segmentRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    segmentActive: {
        backgroundColor: Colors.primary + '15',
        borderColor: Colors.primary,
    },
    segmentText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    segmentTextActive: {
        color: Colors.primary,
    },
});
