import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { Fonts } from '../../../constants/Fonts';

interface FormWidget {
    id: string;
    type: 'input' | 'select' | 'date_range';
    label: string;
    options?: string[];
}

interface CompositeFormData {
    title: string;
    widgets: FormWidget[];
}

interface CompositeFormProps {
    data: CompositeFormData;
    onAction: (action: string, payload?: any) => void;
}

export default function CompositeForm({ data, onAction }: CompositeFormProps) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    const updateValue = (id: string, val: string) => {
        setValues(prev => ({ ...prev, [id]: val }));
    };

    const selectOption = (id: string, option: string) => {
        setSelectedOptions(prev => ({ ...prev, [id]: option }));
        setValues(prev => ({ ...prev, [id]: option }));
    };

    const handleSubmit = () => {
        const payload = { ...values };
        onAction('submit_form', payload);
    };

    const renderField = (widget: FormWidget, index: number) => {
        switch (widget.type) {
            case 'select':
                return (
                    <Animated.View
                        key={widget.id}
                        entering={FadeInDown.delay(index * 60).springify()}
                        style={styles.fieldContainer}
                    >
                        <Text style={styles.fieldLabel}>{widget.label}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.optionsRow}
                        >
                            {widget.options?.map((opt, i) => {
                                const isSelected = selectedOptions[widget.id] === opt;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.optionChip,
                                            isSelected && styles.optionChipSelected,
                                        ]}
                                        onPress={() => selectOption(widget.id, opt)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            isSelected && styles.optionTextSelected,
                                        ]}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                );

            case 'date_range':
                return (
                    <Animated.View
                        key={widget.id}
                        entering={FadeInDown.delay(index * 60).springify()}
                        style={styles.fieldContainer}
                    >
                        <Text style={styles.fieldLabel}>{widget.label}</Text>
                        <View style={styles.dateRangeRow}>
                            <TextInput
                                style={[styles.input, styles.dateInput]}
                                placeholder="Start date"
                                placeholderTextColor="#A0AEC0"
                                value={values[`${widget.id}_start`] || ''}
                                onChangeText={(v) => updateValue(`${widget.id}_start`, v)}
                            />
                            <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
                            <TextInput
                                style={[styles.input, styles.dateInput]}
                                placeholder="End date"
                                placeholderTextColor="#A0AEC0"
                                value={values[`${widget.id}_end`] || ''}
                                onChangeText={(v) => updateValue(`${widget.id}_end`, v)}
                            />
                        </View>
                    </Animated.View>
                );

            default: // 'input'
                return (
                    <Animated.View
                        key={widget.id}
                        entering={FadeInDown.delay(index * 60).springify()}
                        style={styles.fieldContainer}
                    >
                        <Text style={styles.fieldLabel}>{widget.label}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={`Enter ${widget.label.toLowerCase()}`}
                            placeholderTextColor="#A0AEC0"
                            value={values[widget.id] || ''}
                            onChangeText={(v) => updateValue(widget.id, v)}
                        />
                    </Animated.View>
                );
        }
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconWrap}>
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.title}>{data.title || 'Enter Details'}</Text>
            </View>

            {/* Fields */}
            <View style={styles.body}>
                {data.widgets?.map((w, i) => renderField(w, i))}
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Ionicons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#F0F7FF',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#3B82F620',
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
        gap: 12,
    },
    fieldContainer: {
        gap: 6,
    },
    fieldLabel: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    input: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.text,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionsRow: {
        flexDirection: 'row',
    },
    optionChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    optionChipSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    optionText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        color: Colors.text,
    },
    optionTextSelected: {
        color: '#FFFFFF',
    },
    dateRangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateInput: {
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 12,
        marginTop: 14,
        gap: 8,
    },
    submitText: {
        fontFamily: Fonts.semiBold,
        fontSize: 14,
        color: '#FFFFFF',
    },
});
