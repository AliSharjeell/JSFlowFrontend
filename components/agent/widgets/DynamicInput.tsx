import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

const { width } = Dimensions.get('window');

type InputMode = 'PIN' | 'AMOUNT' | 'CONFIRM' | 'SELECTION' | 'SCANNER';

interface DynamicInputProps {
    mode: InputMode;
    data?: any;
    onSubmit: (value: any) => void;
    onCancel?: () => void;
}

export default function DynamicInput({ mode, data, onSubmit, onCancel }: DynamicInputProps) {
    // Shared State
    const [value, setValue] = useState('');

    // reset value when mode changes
    useEffect(() => {
        setValue('');
    }, [mode]);

    const renderContent = () => {
        switch (mode) {
            case 'PIN':
                return <PinPad onComplete={onSubmit} />;
            case 'AMOUNT':
                return <AmountPad onComplete={onSubmit} />;
            case 'SELECTION':
                return <PeoplePicker candidates={data?.candidates || []} onSelect={onSubmit} />;
            case 'CONFIRM':
                return <ConfirmationSlider data={data} onConfirm={() => onSubmit('confirmed')} onCancel={onCancel} />;
            default:
                return null;
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.springify().damping(12)}
            exiting={FadeOutUp}
            style={styles.container}
        >
            {renderContent()}
        </Animated.View>
    );
}

// Sub-components

function PinPad({ onComplete }: { onComplete: (val: string) => void }) {
    const [pin, setPin] = useState('');

    const handlePress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                setTimeout(() => onComplete(newPin), 300);
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    return (
        <View style={styles.padContainer}>
            <Text style={styles.promptText}>Enter Secure PIN</Text>
            <View style={styles.dotsRow}>
                {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
                ))}
            </View>
            <View style={styles.numPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <TouchableOpacity key={n} style={styles.numBtn} onPress={() => handlePress(n.toString())}>
                        <Text style={styles.numText}>{n}</Text>
                    </TouchableOpacity>
                ))}
                <View style={styles.numBtn} />
                <TouchableOpacity style={styles.numBtn} onPress={() => handlePress('0')}>
                    <Text style={styles.numText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.numBtn} onPress={handleDelete}>
                    <Ionicons name="backspace-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function AmountPad({ onComplete }: { onComplete: (val: string) => void }) {
    const [amount, setAmount] = useState('');

    const handlePress = (char: string) => {
        if (char === '.' && amount.includes('.')) return;
        setAmount(prev => prev + char);
    };

    const handleDelete = () => setAmount(prev => prev.slice(0, -1));

    return (
        <View style={styles.padContainer}>
            <Text style={styles.promptText}>Enter Amount</Text>
            <Text style={styles.amountDisplay}>PKR {amount || '0'}</Text>
            <View style={styles.numPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
                    <TouchableOpacity key={n} style={styles.numBtn} onPress={() => handlePress(n.toString())}>
                        <Text style={styles.numText}>{n}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.numBtn} onPress={handleDelete}>
                    <Ionicons name="backspace-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onComplete(amount)}>
                <Text style={styles.actionBtnText}>Set Amount</Text>
            </TouchableOpacity>
        </View>
    );
}

function PeoplePicker({ candidates, onSelect }: { candidates: any[], onSelect: (val: any) => void }) {
    return (
        <View style={styles.pickerContainer}>
            <Text style={styles.promptText}>Select Recipient</Text>
            <FlatList
                horizontal
                data={candidates}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingHorizontal: 10, paddingVertical: 20 }}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.personCard} onPress={() => onSelect(item.name || item)}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{(item.name || 'U').charAt(0)}</Text>
                        </View>
                        <Text style={styles.personName}>{item.name}</Text>
                        <Text style={styles.personDetail}>{item.bank || 'Bank'}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

function ConfirmationSlider({ data, onConfirm, onCancel }: { data: any, onConfirm: () => void, onCancel?: () => void }) {
    return (
        <View style={styles.confirmContainer}>
            <Text style={styles.promptText}>Confirm Transaction</Text>
            <View style={styles.receiptPreview}>
                <View style={styles.row}>
                    <Text style={styles.label}>To</Text>
                    <Text style={styles.value}>{data?.recipient || 'Unknown'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount</Text>
                    <Text style={styles.value}>PKR {data?.amount || '0'}</Text>
                </View>
            </View>
            <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
                    <Text style={[styles.actionBtnText, { color: Colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { flex: 2 }]} onPress={onConfirm}>
                    <Text style={styles.actionBtnText}>Confirm Pay</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        width: width - 40,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        padding: 20,
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 20,
    },
    padContainer: {
        alignItems: 'center',
    },
    promptText: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    // PIN
    dotsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 30,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E2E8F0',
    },
    dotFilled: {
        backgroundColor: Colors.primary,
    },
    // Numpad
    numPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 280,
        justifyContent: 'center',
        gap: 20,
    },
    numBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    numText: {
        fontFamily: Fonts.medium,
        fontSize: 24,
        color: Colors.text,
    },
    // Amount
    amountDisplay: {
        fontFamily: Fonts.bold,
        fontSize: 32,
        color: Colors.primary,
        marginBottom: 30,
    },
    // Picker
    pickerContainer: {
        width: '100%',
    },
    personCard: {
        width: 100,
        height: 120,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#BFDBFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarText: {
        fontFamily: Fonts.bold,
        color: '#1E40AF',
        fontSize: 18,
    },
    personName: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    personDetail: {
        fontFamily: Fonts.regular,
        fontSize: 10,
        color: Colors.textSecondary,
    },
    // Confirm
    confirmContainer: {
        width: '100%',
    },
    receiptPreview: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    value: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.text,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        flex: 1,
    },
    actionBtnText: {
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        fontSize: 16,
    }

});
