import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { VisualPayload } from '../../services/api';
import CompositeForm from './widgets/CompositeForm';
import ConfirmationCard from './widgets/ConfirmationCard';
import InfoTable from './widgets/InfoTable';
import SelectionList from './widgets/SelectionList';
import TextBubble from './widgets/TextBubble';

// Legacy widgets (kept for backward compat)
import BiometricScanner from './widgets/BiometricScanner';
import DynamicInput from './widgets/DynamicInput';
import LiveReceipt from './widgets/LiveReceipt';
import MoneyGraph from './widgets/MoneyGraph';

// Legacy widget types still in use
export type LegacyWidgetType = 'NONE' | 'RECEIPT' | 'BALANCE_GRAPH' | 'SCANNER' | 'PIN_PAD' | 'AMOUNT_PAD' | 'PEOPLE_PICKER';

interface VisualStageProps {
    // New: structured visual payload from backend
    visual?: VisualPayload | null;
    onWidgetAction?: (action: string, payload?: any) => void;

    // Legacy props (backward compat)
    activeWidget?: LegacyWidgetType;
    widgetData?: any;
}

export default function VisualStage({ visual, onWidgetAction, activeWidget, widgetData }: VisualStageProps) {

    // ── New dynamic widget rendering ──
    if (visual && visual.type) {
        const renderDynamicWidget = () => {
            switch (visual.type) {
                case 'COMPOSITE_FORM':
                    return (
                        <CompositeForm
                            data={visual.data}
                            onAction={(action, payload) => onWidgetAction?.(action, payload)}
                        />
                    );
                case 'CONFIRMATION_CARD':
                    return (
                        <ConfirmationCard
                            data={visual.data}
                            onAction={(action, payload) => onWidgetAction?.(action, payload)}
                        />
                    );
                case 'SELECTION_LIST':
                    return (
                        <SelectionList
                            data={visual.data}
                            onAction={(action, payload) => onWidgetAction?.(action, payload)}
                        />
                    );
                case 'INFO_TABLE':
                    return <InfoTable data={visual.data} />;
                case 'TEXT_BUBBLE':
                    return <TextBubble data={visual.data} />;
                default:
                    return null;
            }
        };

        return (
            <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
                style={styles.stageContainer}
            >
                {renderDynamicWidget()}
            </Animated.View>
        );
    }

    // ── Legacy widget rendering (backward compat) ──
    if (!activeWidget || activeWidget === 'NONE') return null;

    const renderLegacyWidget = () => {
        switch (activeWidget) {
            case 'RECEIPT':
                return (
                    <LiveReceipt
                        data={widgetData}
                        onConfirm={() => onWidgetAction?.('confirm_receipt')}
                    />
                );
            case 'BALANCE_GRAPH':
                return <MoneyGraph data={widgetData} />;
            case 'SCANNER':
                return (
                    <BiometricScanner
                        status={widgetData?.status || 'scanning'}
                        onComplete={() => onWidgetAction?.('scan_complete')}
                    />
                );
            case 'PIN_PAD':
                return <DynamicInput mode="PIN" onSubmit={(val) => onWidgetAction?.('submit_pin', val)} />;
            case 'AMOUNT_PAD':
                return <DynamicInput mode="AMOUNT" onSubmit={(val) => onWidgetAction?.('submit_amount', val)} />;
            case 'PEOPLE_PICKER':
                return <DynamicInput mode="SELECTION" data={widgetData} onSubmit={(val) => onWidgetAction?.('submit_selection', val)} />;
            default:
                return null;
        }
    };

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.stageContainer}
        >
            {renderLegacyWidget()}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    stageContainer: {
        width: '100%',
    },
});
