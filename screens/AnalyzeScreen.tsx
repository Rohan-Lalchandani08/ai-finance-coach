import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { mockBudgets } from '../data/mockData';
import { getCategoryIconConfig, getCategoryColor, ALL_CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../utils/currency';
import { extractFromRealSMS } from '../services/SMSExtractorService';
import { Transaction, TransactionCategory } from '../types';

const { width } = Dimensions.get('window');

const AnalyzeScreen = () => {
    const { theme } = useTheme();
    const { 
        transactions, 
        addTransactions, 
        verifyTransaction, 
        deleteTransaction, 
        clearUnverifiedTransactions,
        clearAllTransactions,
        seedDemoTransactions,
        propagateCorrection 
    } = useData();
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [scanning, setScanning] = useState(false);
    const [editTarget, setEditTarget] = useState<Transaction | null>(null);
    const [editCategory, setEditCategory] = useState<TransactionCategory>('other');
    const [editDesc, setEditDesc] = useState('');
    const [showReview, setShowReview] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, [selectedPeriod]);

    // Unverified (SMS-imported) transactions
    const unverified = transactions.filter(t => t.needsVerification);

    // Period Filtering Logic
    const filteredTransactions = transactions.filter(t => {
        if (t.needsVerification) return false;
        const tDate = new Date(t.date);
        const now = new Date();
        
        if (selectedPeriod === 'week') {
            const last7Days = new Date();
            last7Days.setDate(now.getDate() - 7);
            return tDate >= last7Days && tDate <= now;
        } else if (selectedPeriod === 'month') {
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        } else { // year
            return tDate.getFullYear() === now.getFullYear();
        }
    });

    const totalSpent = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = ALL_CATEGORIES.map(category => {
        const catTxns = filteredTransactions.filter(t => t.category === category && t.type === 'expense');
        const amount = catTxns.reduce((sum, t) => sum + t.amount, 0);
        const needs = catTxns.filter(t => t.needWantClassification === 'need').reduce((sum, t) => sum + t.amount, 0);
        const wants = amount - needs;
        
        return {
            category,
            amount,
            percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
            needAmount: needs,
            wantAmount: wants
        };
    }).filter(cat => cat.amount > 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

    const periods = ['week', 'month', 'year'] as const;

    // ── SMS Scan ───────────────────────────────────────────────────────────────
    const handleScanSMS = async () => {
        if (scanning) return;
        setScanning(true);

        const loopAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 450, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
            ])
        );
        loopAnim.start();

        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: false }).start();

        try {
            // Real SMS extraction (handles permissions internally)
            const extracted = await extractFromRealSMS();
            
            // Artificial delay to let animation play out for a better UX
            await new Promise(r => setTimeout(r, 2200));
            
            if (extracted.length > 0) {
                addTransactions(extracted);
            }
        } catch (error) {
            console.error("Scan error:", error);
        } finally {
            setScanning(false);
            loopAnim.stop();
            pulseAnim.setValue(1);
            scanAnim.setValue(0);
        }
    };

    // ── Edit Modal helpers ─────────────────────────────────────────────────────
    const openEdit = (t: Transaction) => {
        setEditTarget(t);
        setEditCategory(t.category);
        setEditDesc(t.description);
    };

    const saveEdit = () => {
        if (!editTarget) return;
        
        // Use the new propagation logic to update the edited transaction AND all similar transactions at once
        // This handles Active Learning and UI state updates for similar unverified items in a single React state batch
        propagateCorrection(editTarget.id, editTarget.description, editDesc, editCategory);

        setEditTarget(null);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* ─── Edit Transaction Modal ─────────────────────────────────────── */}
            <Modal transparent visible={!!editTarget} animationType="slide">
                <View style={styles.editOverlay}>
                    <View style={[styles.editSheet, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.editHandle} />
                        <Text style={[styles.editTitle, { color: theme.colors.textPrimary }]}>Edit Transaction</Text>

                        <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Description</Text>
                        <TextInput
                            style={[styles.editInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                            value={editDesc}
                            onChangeText={setEditDesc}
                            placeholder="Merchant / description"
                            placeholderTextColor={theme.colors.textTertiary}
                        />

                        <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {ALL_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catChip, {
                                        borderColor: editCategory === cat ? theme.colors.primary : theme.colors.border,
                                        backgroundColor: editCategory === cat ? theme.colors.primary + '20' : theme.colors.background,
                                    }]}
                                    onPress={() => setEditCategory(cat)}
                                >
                                    <Ionicons
                                        name={getCategoryIconConfig(cat).name as any}
                                        size={14}
                                        color={editCategory === cat ? theme.colors.primary : theme.colors.textSecondary}
                                    />
                                    <Text style={{ fontSize: 12, color: editCategory === cat ? theme.colors.primary : theme.colors.textSecondary, marginLeft: 4 }}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.colors.background, flex: 1 }]} onPress={() => setEditTarget(null)}>
                                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.editBtn, { flex: 2, backgroundColor: theme.colors.primary }]} onPress={saveEdit}>
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Save & Verify</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Header ─────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Financial Analysis</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Insights & Predictions</Text>
                </View>

                <View style={{ alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity 
                            style={[styles.scanBtn, {
                                backgroundColor: scanning ? '#10B981' : theme.colors.primary,
                                borderColor: scanning ? '#10B981' : theme.colors.primary,
                                height: 44,
                                paddingHorizontal: 20,
                            }]}
                            onPress={handleScanSMS}
                            disabled={scanning}
                        >
                            <Ionicons name={scanning ? 'radio' : 'chatbubble-ellipses-outline'} size={18} color="#fff" />
                            <Text style={[styles.scanBtnText, { color: '#fff', fontSize: 14 }]}>
                                {scanning ? 'Scanning…' : 'Scan Bank SMS'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {!scanning && (
                        <TouchableOpacity 
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                height: 40,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#EF444433',
                                backgroundColor: '#EF444408',
                            }} 
                            onPress={() => {
                                Alert.alert(
                                    "Clear All History",
                                    "This will permanently delete ALL imported transactions.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Clear Everything", style: "destructive", onPress: clearAllTransactions }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Clear All</Text>
                        </TouchableOpacity>
                    )}

                    {transactions.length === 0 && (
                        <TouchableOpacity 
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                height: 40,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.primary + '33',
                                backgroundColor: theme.colors.primary + '08',
                                alignSelf: 'flex-start',
                            }} 
                            onPress={seedDemoTransactions}
                        >
                            <Ionicons name="flask-outline" size={16} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>Import Demo Transactions</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Scan Progress Bar */}
                {scanning && (
                    <View style={[styles.scanProgress, { backgroundColor: theme.colors.border }]}>
                        <Animated.View style={[styles.scanProgressFill, {
                            backgroundColor: '#10B981',
                            width: scanAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        }]} />
                    </View>
                )}

                {/* ── Review New Imports ──────────────────────────────────────── */}
                {unverified.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        {/* Row 1: Title with collapse toggle */}
                        <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}
                            onPress={() => setShowReview(!showReview)}
                        >
                            <Ionicons name={showReview ? 'chevron-down' : 'chevron-forward'} size={18} color={theme.colors.textPrimary} />
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0, fontSize: 18 }]}>
                                Review Imports ({unverified.length})
                            </Text>
                        </TouchableOpacity>
                        {/* Row 2: Action buttons below the title */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                            <TouchableOpacity 
                                onPress={clearUnverifiedTransactions}
                                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EF444418', alignItems: 'center' }}
                            >
                                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>✕ Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => unverified.forEach((t) => verifyTransaction(t.id))}
                                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#10B98118', alignItems: 'center' }}
                            >
                                <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>✓ Verify All</Text>
                            </TouchableOpacity>
                        </View>

                        {showReview && unverified.map((t) => (
                            <View key={t.id} style={[styles.verifyCard, { backgroundColor: theme.colors.surface, borderColor: '#F59E0B' }]}>
                                <View style={styles.verifyRow}>
                                    <View style={[styles.verifyIcon, { backgroundColor: getCategoryColor(t.category) + '22' }]}>
                                        <Ionicons name={getCategoryIconConfig(t.category).name as any} size={18} color={getCategoryColor(t.category)} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.verifyDesc, { color: theme.colors.textPrimary }]}>{t.description}</Text>
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                                            {t.smsSource} · {t.category}
                                            {t.matchedKeyword ? ` · via "${t.matchedKeyword}"` : (t.category === 'other' ? ' · Unknown Type' : '')}
                                        </Text>
                                        {t.rawMessage && (
                                            <Text style={{ color: theme.colors.textTertiary, fontSize: 11, fontStyle: 'italic', marginTop: 4, lineHeight: 16 }}>
                                                "{t.rawMessage.split(' ').slice(0, 10).join(' ')}..."
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.verifyAmount, { color: t.type === 'expense' ? '#EF4444' : '#10B981' }]}>
                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </Text>
                                </View>
                                <Text style={[styles.verifyQuestion, { color: theme.colors.textSecondary }]}>
                                    Is this transaction correct?
                                </Text>
                                <View style={styles.verifyBtns}>
                                    <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: '#10B98115', flex: 1 }]} onPress={() => verifyTransaction(t.id)}>
                                        <Ionicons name="checkmark" size={14} color="#10B981" />
                                        <Text style={{ color: '#10B981', fontWeight: '600', marginLeft: 4, fontSize: 13 }}>Correct ✓</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: theme.colors.primary + '18', flex: 1 }]} onPress={() => openEdit(t)}>
                                        <Ionicons name="pencil" size={14} color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 4, fontSize: 13 }}>Edit ✎</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: '#EF444415' }]} onPress={() => deleteTransaction(t.id)}>
                                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {periods.map((period) => (
                        <TouchableOpacity
                            key={period}
                            onPress={() => setSelectedPeriod(period)}
                            style={[styles.periodButton, {
                                backgroundColor: selectedPeriod === period ? theme.colors.primary : theme.colors.surface,
                                borderColor: theme.colors.border,
                            }]}
                        >
                            <Text style={[styles.periodText, {
                                color: selectedPeriod === period ? theme.colors.textInverse : theme.colors.textSecondary,
                                fontWeight: selectedPeriod === period ? '600' : '400',
                            }]}>
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Spending Overview */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Card variant="gradient" style={styles.overviewCard}>
                        <Text style={[styles.overviewLabel, { color: theme.colors.textInverse }]}>Total Spending This {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</Text>
                        <Text style={[styles.overviewAmount, { color: theme.colors.textInverse }]}>{formatCurrency(totalSpent)}</Text>
                        <View style={styles.overviewStats}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: theme.colors.textInverse }]}>Income</Text>
                                <Text style={[styles.statValue, { color: theme.colors.textInverse }]}>{formatCurrency(totalIncome)}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: theme.colors.textInverse }]}>Savings</Text>
                                <Text style={[styles.statValue, { color: theme.colors.textInverse }]}>{formatCurrency(totalIncome - totalSpent)}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: theme.colors.textInverse }]}>Savings Rate</Text>
                                <Text style={[styles.statValue, { color: theme.colors.textInverse }]}>
                                    {totalIncome > 0 ? (((totalIncome - totalSpent) / totalIncome) * 100).toFixed(1) : '0'}%
                                </Text>
                            </View>
                        </View>
                    </Card>
                </Animated.View>

                {/* AI Insights */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>AI Insights</Text>
                    <Card variant="glass" style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <View style={[styles.insightIconBg, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                                <Ionicons name="trending-up" size={22} color="#6366F1" />
                            </View>
                            <Text style={[styles.insightTitle, { color: theme.colors.primary }]}>Spending Trend</Text>
                        </View>
                        <Text style={[styles.insightText, { color: theme.colors.textPrimary }]}>
                            Your spending is 15% lower than last month. Great job on maintaining your budget!
                        </Text>
                    </Card>
                    <Card variant="glass" style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <View style={[styles.insightIconBg, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                                <Ionicons name="bulb" size={22} color="#F59E0B" />
                            </View>
                            <Text style={[styles.insightTitle, { color: theme.colors.warning }]}>Saving Opportunity</Text>
                        </View>
                        <Text style={[styles.insightText, { color: theme.colors.textPrimary }]}>
                            You could save {formatCurrency(120)}/month by reducing dining out expenses.
                        </Text>
                    </Card>
                </Animated.View>

                {/* Category Breakdown */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Spending by Category</Text>
                    {categoryBreakdown.sort((a, b) => b.amount - a.amount).map((item) => (
                        <Card key={item.category} style={styles.categoryCard}>
                            <View style={styles.categoryHeader}>
                                <View style={styles.categoryIconContainer}>
                                    <Ionicons name={getCategoryIconConfig(item.category).name as any} size={22} color={getCategoryIconConfig(item.category).color} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
                                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                    </Text>
                                    <Text style={[styles.categoryAmount, { color: theme.colors.textSecondary }]}>
                                        {formatCurrency(item.amount)} • {item.percentage.toFixed(1)}%
                                    </Text>
                                </View>
                            </View>
                            <ProgressBar progress={item.percentage / 100} color={getCategoryColor(item.category)} style={{ marginTop: 4 }} />
                            <View style={styles.needWantContainer}>
                                <View style={styles.needWantItem}>
                                    <Badge variant="success" size="small">Need</Badge>
                                    <Text style={[styles.needWantAmount, { color: theme.colors.textPrimary }]}>{formatCurrency(item.needAmount)}</Text>
                                </View>
                                <View style={styles.needWantItem}>
                                    <Badge variant="warning" size="small">Want</Badge>
                                    <Text style={[styles.needWantAmount, { color: theme.colors.textPrimary }]}>{formatCurrency(item.wantAmount)}</Text>
                                </View>
                            </View>
                        </Card>
                    ))}
                </Animated.View>

                {/* Predictions */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Spending Forecast</Text>
                    <Card style={styles.predictionCard}>
                        <View style={styles.predictionHeader}>
                            <View style={[styles.insightIconBg, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                                <Ionicons name="analytics" size={24} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.predictionTitle, { color: theme.colors.textPrimary }]}>Next Month Prediction</Text>
                        </View>
                        <Text style={[styles.predictionAmount, { color: theme.colors.primary }]}>{formatCurrency(1245)}</Text>
                        <Text style={[styles.predictionConfidence, { color: theme.colors.textSecondary }]}>
                            87% confidence • Based on your spending patterns
                        </Text>
                        <View style={styles.predictionDetails}>
                            <View style={styles.predictionItem}>
                                <Text style={[styles.predictionLabel, { color: theme.colors.textSecondary }]}>Expected Range</Text>
                                <Text style={[styles.predictionValue, { color: theme.colors.textPrimary }]}>
                                    {formatCurrency(1100)} - {formatCurrency(1400)}
                                </Text>
                            </View>
                            <View style={styles.predictionItem}>
                                <Text style={[styles.predictionLabel, { color: theme.colors.textSecondary }]}>Trend</Text>
                                <Badge variant="success" size="small">↓ Decreasing</Badge>
                            </View>
                        </View>
                    </Card>
                </Animated.View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 50 },
    header: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
    subtitle: { fontSize: 14 },

    // SMS Scan
    scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
    scanBtnText: { fontSize: 13, fontWeight: '700' },
    scanProgress: { height: 4, borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
    scanProgressFill: { height: '100%', borderRadius: 2 },

    // Verify Cards
    verifyCard: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5 },
    verifyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    verifyIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    verifyDesc: { fontSize: 15, fontWeight: '600' },
    verifyAmount: { fontSize: 16, fontWeight: '700' },
    verifyQuestion: { fontSize: 13, marginBottom: 10 },
    verifyBtns: { flexDirection: 'row', gap: 8 },
    verifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10 },

    // Edit Modal
    editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    editHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', marginBottom: 20 },
    editTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    editLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
    editInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
    editBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },

    // Standard
    periodSelector: { flexDirection: 'row', marginBottom: 20, gap: 12 },
    periodButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    periodText: { fontSize: 14 },
    overviewCard: { marginBottom: 24 },
    overviewLabel: { fontSize: 14, marginBottom: 8 },
    overviewAmount: { fontSize: 36, fontWeight: '700', marginBottom: 16 },
    overviewStats: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '600' },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    insightCard: { marginBottom: 12 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    insightIconBg: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    insightTitle: { fontSize: 16, fontWeight: '600' },
    insightText: { fontSize: 14, lineHeight: 20 },
    categoryCard: { marginBottom: 12 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    categoryIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
    categoryName: { fontSize: 16, fontWeight: '600' },
    categoryAmount: { fontSize: 13, marginTop: 2 },
    needWantContainer: { flexDirection: 'row', marginTop: 12, gap: 12 },
    needWantItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    needWantAmount: { fontSize: 14, fontWeight: '500' },
    predictionCard: { marginBottom: 12 },
    predictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    predictionTitle: { fontSize: 18, fontWeight: '600' },
    predictionAmount: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
    predictionConfidence: { fontSize: 13, marginBottom: 16 },
    predictionDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
    predictionItem: { flex: 1 },
    predictionLabel: { fontSize: 12, marginBottom: 6 },
    predictionValue: { fontSize: 14, fontWeight: '600' },
});

export default AnalyzeScreen;
