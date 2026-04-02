import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Button } from './ui/Button';
import { TransactionCategory } from '../types';
import { formatCurrency, parseCurrency, CURRENCY_SYMBOL } from '../utils/currency';
import { getCategoryIconConfig, getCategoryColor, getCategoryLabel, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

interface TransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (transaction: {
        amount: number;
        category: TransactionCategory;
        description: string;
        date: Date;
        type: 'income' | 'expense';
        needWantClassification?: 'need' | 'want';
    }) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const { theme } = useTheme();
    const { budgets } = useData();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState<TransactionCategory>('other');
    const [needWant, setNeedWant] = useState<'need' | 'want'>('need');
    const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});
    const [warning, setWarning] = useState<string | null>(null);

    // Auto-predict based on inputs
    const handleDescriptionChange = (text: string) => {
        setDescription(text);
        setErrors({ ...errors, description: undefined });
    };

    const handleAmountChange = (text: string) => {
        setAmount(text);
        setErrors({ ...errors, amount: undefined });
        checkOverspending(category, text);
        updatePrediction(category, text);
    };

    const handleCategoryChange = (cat: TransactionCategory) => {
        setCategory(cat);
        checkOverspending(cat, amount);
        updatePrediction(cat, amount);
    };

    const checkOverspending = (cat: TransactionCategory, amt: string) => {
        if (type === 'expense' && cat !== 'other') {
            const numAmount = parseFloat(amt) || 0;
            const budget = budgets.find(b => b.category === cat);

            if (budget && numAmount > 0) {
                const remaining = budget.limit - budget.spent;
                if (numAmount > remaining) {
                    setWarning(`⚠️ Exceeds budget by ${formatCurrency(numAmount - remaining)}`);
                    return;
                }
            }
        }
        setWarning(null);
    };

    const updatePrediction = (cat: TransactionCategory, amt: string) => {
        if (type === 'expense' && cat !== 'other') {
            const numAmount = parseFloat(amt) || 0;
            if (numAmount > 0) {
                import('../services/MLPipelineService').then(({ mlPipeline }) => {
                    if (mlPipeline.isReady) {
                        const prediction = mlPipeline.predict({ category: cat, amount: numAmount });
                        setNeedWant(prediction.toLowerCase() as 'need' | 'want');
                    }
                }).catch(err => console.error('ML prediction error:', err));
            }
        }
    };

    // Get categories based on transaction type
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const handleSubmit = () => {
        const newErrors: { amount?: string; description?: string } = {};

        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }

        if (!description.trim()) {
            newErrors.description = 'Please enter a description';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit({
            amount: parseFloat(amount),
            category,
            description,
            date: new Date(),
            type,
            needWantClassification: type === 'expense' ? needWant : undefined,
        });

        // Reset form
        setAmount('');
        setDescription('');
        setType('expense');
        setCategory('other');
        setNeedWant('need');
        setWarning(null);
        setErrors({});
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: theme.colors.background },
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                                Add Transaction
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Type Toggle */}
                            <View style={styles.typeToggle}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        type === 'expense' && {
                                            backgroundColor: theme.colors.error,
                                        },
                                    ]}
                                    onPress={() => setType('expense')}
                                >
                                    <Text
                                        style={[
                                            styles.typeText,
                                            {
                                                color:
                                                    type === 'expense'
                                                        ? theme.colors.textInverse
                                                        : theme.colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        Expense
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        type === 'income' && {
                                            backgroundColor: theme.colors.success,
                                        },
                                    ]}
                                    onPress={() => setType('income')}
                                >
                                    <Text
                                        style={[
                                            styles.typeText,
                                            {
                                                color:
                                                    type === 'income'
                                                        ? theme.colors.textInverse
                                                        : theme.colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        Income
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Amount */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
                                    Amount
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            color: theme.colors.textPrimary,
                                            borderColor: errors.amount ? theme.colors.error : theme.colors.border,
                                        },
                                    ]}
                                    placeholder="₹0"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    keyboardType="decimal-pad"
                                />
                                {errors.amount && (
                                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                        {errors.amount}
                                    </Text>
                                )}
                                {warning && (
                                    <Text style={[styles.errorText, { color: theme.colors.warning }]}>
                                        {warning}
                                    </Text>
                                )}
                            </View>

                            {/* Description */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
                                    Description
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            color: theme.colors.textPrimary,
                                            borderColor: errors.description ? theme.colors.error : theme.colors.border,
                                        },
                                    ]}
                                    placeholder="e.g., Lunch at restaurant"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    value={description}
                                    onChangeText={handleDescriptionChange}
                                />
                                {errors.description && (
                                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                                        {errors.description}
                                    </Text>
                                )}
                            </View>

                            {/* Category */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
                                    Category
                                </Text>
                                <View style={styles.categoryGrid}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryItem,
                                                {
                                                    backgroundColor:
                                                        category === cat
                                                            ? theme.colors.primary
                                                            : theme.colors.surface,
                                                    borderColor: theme.colors.border,
                                                },
                                            ]}
                                            onPress={() => handleCategoryChange(cat)}
                                        >
                                            <Ionicons
                                                name={getCategoryIconConfig(cat).name as any}
                                                size={24}
                                                color={
                                                    category === cat
                                                        ? '#FFFFFF'
                                                        : getCategoryIconConfig(cat).color
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.categoryText,
                                                    {
                                                        color:
                                                            category === cat
                                                                ? theme.colors.textInverse
                                                                : theme.colors.textSecondary,
                                                    },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {getCategoryLabel(cat)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Need/Want (only for expenses) */}
                            {type === 'expense' && (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
                                        Classification
                                    </Text>
                                    <View style={styles.needWantToggle}>
                                        <TouchableOpacity
                                            style={[
                                                styles.needWantButton,
                                                needWant === 'need' && {
                                                    backgroundColor: theme.colors.success,
                                                },
                                            ]}
                                            onPress={() => setNeedWant('need')}
                                        >
                                            <Text
                                                style={[
                                                    styles.needWantText,
                                                    {
                                                        color:
                                                            needWant === 'need'
                                                                ? theme.colors.textInverse
                                                                : theme.colors.textSecondary,
                                                    },
                                                ]}
                                            >
                                                Need
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.needWantButton,
                                                needWant === 'want' && {
                                                    backgroundColor: theme.colors.warning,
                                                },
                                            ]}
                                            onPress={() => setNeedWant('want')}
                                        >
                                            <Text
                                                style={[
                                                    styles.needWantText,
                                                    {
                                                        color:
                                                            needWant === 'want'
                                                                ? theme.colors.textInverse
                                                                : theme.colors.textSecondary,
                                                    },
                                                ]}
                                            >
                                                Want
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Submit Button */}
                            <View style={styles.buttonContainer}>
                                <Button title="Add Transaction" onPress={handleSubmit} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        fontSize: 24,
    },
    typeToggle: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    typeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryItem: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    categoryText: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    needWantToggle: {
        flexDirection: 'row',
        gap: 12,
    },
    needWantButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    needWantText: {
        fontSize: 14,
        fontWeight: '600',
    },
    buttonContainer: {
        marginTop: 8,
        marginBottom: 20,
    },
});
