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
import { PremiumCard } from '../../components/PremiumCard';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { BankingApi, Biller, Contact, TransferPreview } from '../../services/bankingApi';

type Tab = 'transfers' | 'bills';

export default function PaymentsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>('transfers');

    // ── Transfers State ──
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [preview, setPreview] = useState<TransferPreview | null>(null);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newAccountNumber, setNewAccountNumber] = useState('');
    const [newNickname, setNewNickname] = useState('');
    const [addingContact, setAddingContact] = useState(false);

    // ── Bills State ──
    const [billers, setBillers] = useState<Biller[]>([]);
    const [loadingBillers, setLoadingBillers] = useState(false);
    const [showAddBiller, setShowAddBiller] = useState(false);
    const [billerSlug, setBillerSlug] = useState('');
    const [consumerNumber, setConsumerNumber] = useState('');
    const [billerNickname, setBillerNickname] = useState('');
    const [addingBiller, setAddingBiller] = useState(false);
    const [payingBill, setPayingBill] = useState<string | null>(null);
    const [billAmount, setBillAmount] = useState('');
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);

    const [refreshing, setRefreshing] = useState(false);

    const fetchContacts = useCallback(async () => {
        setLoadingContacts(true);
        try {
            const data = await BankingApi.getContacts();
            setContacts(data);
        } catch (e) {
            // Silent fail — user can pull to refresh
        } finally {
            setLoadingContacts(false);
        }
    }, []);

    const fetchBillers = useCallback(async () => {
        setLoadingBillers(true);
        try {
            const data = await BankingApi.getBillers();
            setBillers(data);
        } catch (e) {
            // Silent fail
        } finally {
            setLoadingBillers(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        fetchBillers();
    }, [fetchContacts, fetchBillers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchContacts(), fetchBillers()]).finally(() => setRefreshing(false));
    }, [fetchContacts, fetchBillers]);

    // ── Transfer Handlers ──
    const handlePreview = async () => {
        if (!selectedContact) { Alert.alert('Select Contact', 'Please choose a recipient.'); return; }
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }

        setLoadingPreview(true);
        try {
            const recipientId = selectedContact.nickname || selectedContact.name || selectedContact.account_number;
            const prev = await BankingApi.previewTransfer(recipientId, amt, note || undefined);
            setPreview(prev);
        } catch (e: any) {
            Alert.alert('Preview Failed', e?.response?.data?.message || e?.message || 'Could not preview transfer.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const [pin, setPin] = useState('');

    // ...

    const handleExecute = async () => {
        if (!selectedContact || !preview) return;
        if (pin.length !== 4) { Alert.alert('Invalid PIN', 'Please enter your 4-digit PIN.'); return; }
        const amt = parseFloat(amount);

        setExecuting(true);
        try {
            const recipientId = selectedContact.nickname || selectedContact.name || selectedContact.account_number;
            const result = await BankingApi.executeTransfer(recipientId, amt, pin, note || undefined);
            Alert.alert(
                'Transfer Successful ✅',
                `PKR ${amt.toLocaleString()} sent to ${selectedContact.name || selectedContact.account_number}.\nTransaction ID: ${result.transfer_id || 'N/A'}`
            );
            setPreview(null);
            setAmount('');
            setNote('');
            setPin('');
            setSelectedContact(null);
        } catch (e: any) {
            Alert.alert('Transfer Failed', e?.response?.data?.message || e?.message || 'Could not complete transfer.');
        } finally {
            setExecuting(false);
        }
    };

    const handleAddContact = async () => {
        if (!newAccountNumber.trim()) { Alert.alert('Missing', 'Enter account number.'); return; }
        setAddingContact(true);
        try {
            const contact = await BankingApi.createContact(newAccountNumber.trim(), newNickname.trim() || undefined);
            setContacts(prev => [contact, ...prev]);
            setShowAddContact(false);
            setNewAccountNumber('');
            setNewNickname('');
            Alert.alert('Contact Saved ✅', `${contact.name || contact.account_number} added.`);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to add contact.');
        } finally {
            setAddingContact(false);
        }
    };

    // ── Bill Handlers ──
    const handleAddBiller = async () => {
        if (!billerSlug.trim() || !consumerNumber.trim()) {
            Alert.alert('Missing', 'Enter provider and consumer number.');
            return;
        }
        setAddingBiller(true);
        try {
            const biller = await BankingApi.saveBiller(billerSlug.trim(), consumerNumber.trim(), billerNickname.trim() || undefined);
            setBillers(prev => [biller, ...prev]);
            setShowAddBiller(false);
            setBillerSlug('');
            setConsumerNumber('');
            setBillerNickname('');
            Alert.alert('Biller Saved ✅', `${biller.provider_slug} added.`);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to add biller.');
        } finally {
            setAddingBiller(false);
        }
    };

    const handlePayBill = async () => {
        if (!selectedBiller) return;
        setPayingBill(selectedBiller.id);
        try {
            const amt = billAmount ? parseFloat(billAmount) : undefined;
            const result = await BankingApi.payBill(
                selectedBiller.consumer_number,
                selectedBiller.id,
                selectedBiller.provider_slug,
                amt
            );
            Alert.alert(
                'Payment Successful ✅',
                `PKR ${result.amount_paid?.toLocaleString() || '—'} paid to ${result.provider || selectedBiller.provider_slug}.`
            );
            setShowPayModal(false);
            setBillAmount('');
            setSelectedBiller(null);
        } catch (e: any) {
            Alert.alert('Payment Failed', e?.response?.data?.message || e?.message || 'Could not pay bill.');
        } finally {
            setPayingBill(null);
        }
    };

    // ── Renders ──
    const renderTransfers = () => (
        <View>
            {/* Contact List */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Recipient</Text>
                <TouchableOpacity onPress={() => setShowAddContact(true)}>
                    <View style={styles.addSmall}>
                        <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
                        <Text style={styles.addSmallText}>Add</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {loadingContacts ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : contacts.length === 0 ? (
                <View style={styles.emptySmall}>
                    <Text style={styles.emptySmallText}>No contacts yet. Tap "Add" to save one.</Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactScroll}>
                    {contacts.map((c, index) => (
                        <Animated.View key={c.id || index} entering={FadeInDown.delay(index * 60).springify()}>
                            <TouchableOpacity
                                style={[
                                    styles.contactChip,
                                    selectedContact?.id === c.id && styles.contactChipActive,
                                ]}
                                onPress={() => setSelectedContact(c)}
                            >
                                <View style={[
                                    styles.contactAvatar,
                                    selectedContact?.id === c.id && { backgroundColor: Colors.primary }
                                ]}>
                                    <Text style={[
                                        styles.contactAvatarText,
                                        selectedContact?.id === c.id && { color: '#fff' }
                                    ]}>
                                        {(c.nickname || c.name || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.contactName} numberOfLines={1}>
                                    {c.nickname || c.name || c.account_number}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>
            )}

            {/* Amount & Note */}
            <View style={styles.transferForm}>
                <Text style={styles.inputLabel}>Amount (PKR)</Text>
                <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={Colors.border}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Note (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What's this for?"
                    placeholderTextColor={Colors.textSecondary}
                    value={note}
                    onChangeText={setNote}
                />

                {/* Preview or Execute */}
                {preview ? (
                    <Animated.View entering={FadeIn}>
                        <PremiumCard style={styles.previewCard}>
                            <Text style={styles.previewTitle}>Transfer Preview</Text>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>To</Text>
                                <Text style={styles.previewValue}>{preview.recipient_name || preview.account_number || '—'}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Amount</Text>
                                <Text style={styles.previewValue}>
                                    PKR {preview.amount?.toLocaleString()}
                                </Text>
                            </View>
                            {preview.fee > 0 && (
                                <View style={styles.previewRow}>
                                    <Text style={styles.previewLabel}>Fee</Text>
                                    <Text style={styles.previewValue}>PKR {preview.fee}</Text>
                                </View>
                            )}
                            <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 }]}>
                                <Text style={[styles.previewLabel, { fontFamily: Fonts.bold }]}>Total</Text>
                                <Text style={[styles.previewValue, { fontFamily: Fonts.bold, color: Colors.primary }]}>
                                    PKR {preview.total_deduction?.toLocaleString()}
                                </Text>
                            </View>
                        </PremiumCard >

                        <Text style={styles.inputLabel}>Enter PIN to Confirm</Text>
                        <TextInput
                            style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontFamily: Fonts.bold }]}
                            placeholder="••••"
                            placeholderTextColor={Colors.border}
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => { setPreview(null); setPin(''); }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, executing && { opacity: 0.6 }]}
                                onPress={handleExecute}
                                disabled={executing}
                            >
                                <LinearGradient
                                    colors={[Colors.success, '#1B8A4A']}
                                    style={styles.confirmGradient}
                                >
                                    {executing ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                            <Text style={styles.confirmText}>Confirm Transfer</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View >
                ) : (
                    <TouchableOpacity
                        style={[styles.primaryBtn, loadingPreview && { opacity: 0.6 }]}
                        onPress={handlePreview}
                        disabled={loadingPreview}
                    >
                        <LinearGradient
                            colors={[Colors.primary, '#1e4b8f']}
                            style={styles.primaryBtnGradient}
                        >
                            {loadingPreview ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Preview Transfer</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )
                }
            </View >
        </View >
    );

    const renderBills = () => (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Saved Billers</Text>
                <TouchableOpacity onPress={() => setShowAddBiller(true)}>
                    <View style={styles.addSmall}>
                        <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                        <Text style={styles.addSmallText}>Add</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {loadingBillers ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : billers.length === 0 ? (
                <View style={styles.emptySmall}>
                    <Ionicons name="receipt-outline" size={40} color={Colors.border} />
                    <Text style={styles.emptySmallText}>No saved billers yet.</Text>
                    <TouchableOpacity
                        style={styles.inlineAddBtn}
                        onPress={() => setShowAddBiller(true)}
                    >
                        <Text style={styles.inlineAddText}>+ Add a Biller</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                billers.map((biller, index) => (
                    <Animated.View key={biller.id || index} entering={FadeInDown.delay(index * 80).springify()}>
                        <PremiumCard style={styles.billerCard}>
                            <View style={styles.billerIcon}>
                                <Ionicons name="flash-outline" size={22} color={Colors.tertiary2} />
                            </View>
                            <View style={styles.billerInfo}>
                                <Text style={styles.billerName}>
                                    {biller.name || biller.provider_slug}
                                </Text>
                                <Text style={styles.billerNumber}>{biller.consumer_number}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.payBillerBtn}
                                onPress={() => {
                                    setSelectedBiller(biller);
                                    setShowPayModal(true);
                                }}
                            >
                                <Text style={styles.payBillerText}>Pay</Text>
                            </TouchableOpacity>
                        </PremiumCard>
                    </Animated.View>
                ))
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Payments</Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'transfers' && styles.tabActive]}
                    onPress={() => setActiveTab('transfers')}
                >
                    <Ionicons
                        name="swap-horizontal"
                        size={18}
                        color={activeTab === 'transfers' ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[styles.tabText, activeTab === 'transfers' && styles.tabTextActive]}>
                        Transfers
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'bills' && styles.tabActive]}
                    onPress={() => setActiveTab('bills')}
                >
                    <Ionicons
                        name="receipt-outline"
                        size={18}
                        color={activeTab === 'bills' ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={[styles.tabText, activeTab === 'bills' && styles.tabTextActive]}>
                        Bills
                    </Text>
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
                {activeTab === 'transfers' ? renderTransfers() : renderBills()}
                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Add Contact Modal */}
            <Modal visible={showAddContact} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Contact</Text>
                            <TouchableOpacity onPress={() => setShowAddContact(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter bank account number"
                            placeholderTextColor={Colors.textSecondary}
                            value={newAccountNumber}
                            onChangeText={setNewAccountNumber}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Nickname (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Mom, Landlord"
                            placeholderTextColor={Colors.textSecondary}
                            value={newNickname}
                            onChangeText={setNewNickname}
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, addingContact && { opacity: 0.6 }]}
                            onPress={handleAddContact}
                            disabled={addingContact}
                        >
                            <LinearGradient colors={[Colors.primary, '#1e4b8f']} style={styles.primaryBtnGradient}>
                                {addingContact ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Contact</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Add Biller Modal */}
            <Modal visible={showAddBiller} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Biller</Text>
                            <TouchableOpacity onPress={() => setShowAddBiller(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Provider</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. k_electric, sui_gas"
                            placeholderTextColor={Colors.textSecondary}
                            value={billerSlug}
                            onChangeText={setBillerSlug}
                        />

                        <Text style={styles.inputLabel}>Consumer / Meter Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter consumer number"
                            placeholderTextColor={Colors.textSecondary}
                            value={consumerNumber}
                            onChangeText={setConsumerNumber}
                        />

                        <Text style={styles.inputLabel}>Nickname (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Home Electricity"
                            placeholderTextColor={Colors.textSecondary}
                            value={billerNickname}
                            onChangeText={setBillerNickname}
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, addingBiller && { opacity: 0.6 }]}
                            onPress={handleAddBiller}
                            disabled={addingBiller}
                        >
                            <LinearGradient colors={[Colors.primary, '#1e4b8f']} style={styles.primaryBtnGradient}>
                                {addingBiller ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Biller</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Pay Bill Modal */}
            <Modal visible={showPayModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown.springify()} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pay Bill</Text>
                            <TouchableOpacity onPress={() => { setShowPayModal(false); setBillAmount(''); }}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedBiller && (
                            <View style={styles.billerSummary}>
                                <Text style={styles.billerSummaryName}>
                                    {selectedBiller.name || selectedBiller.provider_slug}
                                </Text>
                                <Text style={styles.billerSummaryNum}>
                                    Consumer: {selectedBiller.consumer_number}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Amount (PKR) — leave blank to auto-pay</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Auto-fetch amount"
                            placeholderTextColor={Colors.textSecondary}
                            value={billAmount}
                            onChangeText={setBillAmount}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, payingBill && { opacity: 0.6 }]}
                            onPress={handlePayBill}
                            disabled={!!payingBill}
                        >
                            <LinearGradient colors={[Colors.success, '#1B8A4A']} style={styles.primaryBtnGradient}>
                                {payingBill ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Pay Now</Text>}
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
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.text,
    },
    // Tabs
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    tabActive: {
        backgroundColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.primary,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.text,
    },
    addSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary + '12',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    addSmallText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.primary,
    },
    // Contacts
    contactScroll: {
        marginBottom: 24,
    },
    contactChip: {
        alignItems: 'center',
        marginRight: 16,
        width: 72,
    },
    contactChipActive: {
        // handled by children styles
    },
    contactAvatar: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    contactAvatarText: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        color: Colors.primary,
    },
    contactName: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        color: Colors.text,
        textAlign: 'center',
    },
    // Transfer form
    transferForm: {
        marginTop: 4,
    },
    amountInput: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontFamily: Fonts.bold,
        fontSize: 28,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputLabel: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 6,
        marginTop: 6,
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
    // Preview
    previewCard: {
        padding: 18,
        marginTop: 16,
    },
    previewTitle: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 12,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    previewLabel: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    previewValue: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelBtnText: {
        fontFamily: Fonts.semiBold,
        fontSize: 15,
        color: Colors.textSecondary,
    },
    confirmBtn: {
        flex: 2,
        borderRadius: 16,
        overflow: 'hidden',
    },
    confirmGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
        borderRadius: 16,
    },
    confirmText: {
        fontFamily: Fonts.semiBold,
        fontSize: 15,
        color: '#fff',
    },
    // Billers
    billerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    billerIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFF3E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    billerInfo: {
        flex: 1,
    },
    billerName: {
        fontFamily: Fonts.medium,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 2,
    },
    billerNumber: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    payBillerBtn: {
        backgroundColor: Colors.success + '15',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    payBillerText: {
        fontFamily: Fonts.semiBold,
        fontSize: 13,
        color: Colors.success,
    },
    billerSummary: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    billerSummaryName: {
        fontFamily: Fonts.semiBold,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
    },
    billerSummaryNum: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    // Empty
    emptySmall: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptySmallText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    inlineAddBtn: {
        marginTop: 12,
    },
    inlineAddText: {
        fontFamily: Fonts.semiBold,
        fontSize: 14,
        color: Colors.primary,
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
    // Buttons
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
});
