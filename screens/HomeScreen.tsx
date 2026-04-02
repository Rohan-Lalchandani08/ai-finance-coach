import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PieChart } from '../components/charts/PieChart';
import { BarChart } from '../components/charts/BarChart';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { TransactionModal } from '../components/TransactionModal';
import { getCategoryIconConfig, getCategoryColor } from '../constants/categories';
import { formatCurrency, formatAmountInWords } from '../utils/currency';
import { formatTransactionDate, getGreeting } from '../utils/dateFormat';
import { Transaction } from '../types';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const { transactions, budgets, habitStreak, addTransaction, deleteTransaction } = useData();
    const { user, logout } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // Calculate totals for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netCashflow = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (netCashflow / monthlyIncome) * 100 : 0;

    // Today's spending
    const todayTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
            tDate.getDate() === now.getDate() &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear &&
            t.type === 'expense'
        );
    });
    const todaySpending = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown for pie chart
    const categoryData = budgets
        .filter((b) => b.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
        .map((budget) => ({
            name: budget.category.charAt(0).toUpperCase() + budget.category.slice(1),
            amount: budget.spent,
            color: getCategoryColor(budget.category),
        }));

    // Weekly spending for bar chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
    });

    const weeklyData = {
        labels: last7Days.map((d) => {
            const day = d.toLocaleDateString('en-US', { weekday: 'short' });
            return day.substring(0, 3);
        }),
        datasets: [
            {
                data: last7Days.map((date) => {
                    const dayExpenses = transactions
                        .filter((t) => {
                            const tDate = new Date(t.date);
                            return (
                                t.type === 'expense' &&
                                tDate.toDateString() === date.toDateString()
                            );
                        })
                        .reduce((sum, t) => sum + t.amount, 0);
                    return dayExpenses || 1; // Minimum 1 to show on chart
                }),
            },
        ],
    };

    const largestExpense = monthlyTransactions
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)[0];

    const topCategory = budgets.sort((a, b) => b.spent - a.spent)[0];

    const handleDeleteTransaction = (id: string) => {
        Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteTransaction(id),
            },
        ]);
    };

    const greeting = getGreeting();


    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Greeting */}
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
                            {greeting}, {user?.name || 'User'}! 👋
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            Here's your financial overview
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {/* Theme toggle pill */}
                        <TouchableOpacity
                            onPress={toggleTheme}
                            style={[
                                styles.themeToggle,
                                { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)', borderColor: isDarkMode ? '#F59E0B' : '#6366F1' },
                            ]}
                        >
                            <Ionicons
                                name={isDarkMode ? 'sunny' : 'moon'}
                                size={18}
                                color={isDarkMode ? '#F59E0B' : '#6366F1'}
                            />
                        </TouchableOpacity>

                        {/* Logout button */}
                        <TouchableOpacity
                            onPress={logout}
                            style={[styles.logoutBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: theme.colors.error }]}
                        >
                            <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Income/Expense Summary */}
                <Animated.View style={[styles.summaryRow, { opacity: fadeAnim }]}>
                    <View style={styles.summaryCard}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.summaryGradient, theme.shadows.md]}
                        >
                            <Text style={styles.summaryLabel}>Monthly Income</Text>
                            <Text style={styles.summaryAmount}>
                                {formatCurrency(monthlyIncome)}
                            </Text>
                            <Text style={styles.summarySubtext}>
                                {formatAmountInWords(monthlyIncome)}
                            </Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.summaryCard}>
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.summaryGradient, theme.shadows.md]}
                        >
                            <Text style={styles.summaryLabel}>Monthly Expenses</Text>
                            <Text style={styles.summaryAmount}>
                                {formatCurrency(monthlyExpenses)}
                            </Text>
                            <Text style={styles.summarySubtext}>
                                {formatAmountInWords(monthlyExpenses)}
                            </Text>
                        </LinearGradient>
                    </View>
                </Animated.View>

                {/* Net Cashflow/Savings */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Card variant="gradient" style={styles.cashflowCard}>
                        <View style={styles.cashflowContent}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cashflowLabel, { color: theme.colors.textInverse }]}>
                                    {netCashflow >= 0 ? 'Net Savings' : 'Net Deficit'}
                                </Text>
                                <Text style={[styles.cashflowAmount, { color: theme.colors.textInverse }]}>
                                    {formatCurrency(Math.abs(netCashflow))}
                                </Text>
                                <Text style={[styles.cashflowSubtext, { color: 'rgba(255,255,255,0.8)' }]}>
                                    {netCashflow >= 0 ? `${savingsRate.toFixed(1)}% saved` : 'Spent more than earned'}
                                </Text>
                            </View>
                            {netCashflow >= 0 && (
                                <View style={styles.savingsRateBadge}>
                                    <Text style={styles.savingsRateText}>
                                        {savingsRate.toFixed(0)}%
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Card>
                </Animated.View>

                {/* Quick Stats */}
                <Animated.View style={[styles.quickStats, { opacity: fadeAnim }]}>
                    <Card style={styles.quickStatCard}>
                        <Ionicons name="calendar" size={28} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                        <Text style={[styles.quickStatValue, { color: theme.colors.primary }]}>
                            {formatCurrency(todaySpending)}
                        </Text>
                        <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                            Today's Spending
                        </Text>
                    </Card>

                    <Card style={styles.quickStatCard}>
                        <Ionicons name="cash" size={28} color={theme.colors.error} style={{ marginBottom: 8 }} />
                        <Text style={[styles.quickStatValue, { color: theme.colors.error }]}>
                            {largestExpense ? formatCurrency(largestExpense.amount) : '₹0'}
                        </Text>
                        <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                            Largest Expense
                        </Text>
                    </Card>

                    <Card style={styles.quickStatCard}>
                        <Ionicons
                            name={getCategoryIconConfig(topCategory?.category || 'other').name as any}
                            size={28}
                            color={theme.colors.warning}
                            style={{ marginBottom: 8 }}
                        />
                        <Text style={[styles.quickStatValue, { color: theme.colors.warning }]} numberOfLines={1}>
                            {topCategory?.category.charAt(0).toUpperCase() + topCategory?.category.slice(1) || 'N/A'}
                        </Text>
                        <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
                            Top Category
                        </Text>
                    </Card>
                </Animated.View>

                {/* Category Spending Pie Chart */}
                {categoryData.length > 0 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Spending by Category
                        </Text>
                        <Card>
                            <PieChart data={categoryData} />
                        </Card>
                    </Animated.View>
                )}

                {/* Weekly Spending Bar Chart */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                        Last 7 Days Spending
                    </Text>
                    <Card>
                        <BarChart data={weeklyData} />
                    </Card>
                </Animated.View>

                {/* Habit Streak */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Card variant="glass" style={styles.habitCard}>
                        <View style={styles.habitHeader}>
                            <Ionicons name="flame" size={36} color="#F97316" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.habitTitle, { color: theme.colors.primary }]}>
                                    {habitStreak.currentStreak} Day Streak!
                                </Text>
                                <Text style={[styles.habitSubtitle, { color: theme.colors.textSecondary }]}>
                                    Keep tracking daily
                                </Text>
                            </View>
                        </View>
                    </Card>
                </Animated.View>

                {/* Recent Transactions */}
                <View>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                        Recent Transactions
                    </Text>
                    {monthlyTransactions.slice(0, 10).map((transaction) => (
                        <Card key={transaction.id} style={styles.transactionCard}>
                            <View style={styles.transactionContent}>
                                <View
                                    style={[
                                        styles.transactionIcon,
                                        {
                                            backgroundColor: getCategoryColor(transaction.category) + '20',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={getCategoryIconConfig(transaction.category).name as any}
                                        size={22}
                                        color={getCategoryIconConfig(transaction.category).color}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text
                                        style={[styles.transactionDesc, { color: theme.colors.textPrimary }]}
                                        numberOfLines={1}
                                    >
                                        {transaction.description}
                                    </Text>
                                    <View style={styles.transactionMeta}>
                                        {transaction.needWantClassification && (
                                            <Badge
                                                variant={
                                                    transaction.needWantClassification === 'need'
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                                size="small"
                                            >
                                                {transaction.needWantClassification}
                                            </Badge>
                                        )}
                                        <Text
                                            style={[styles.transactionDate, { color: theme.colors.textTertiary }]}
                                        >
                                            {formatTransactionDate(transaction.date)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text
                                        style={[
                                            styles.transactionAmount,
                                            {
                                                color:
                                                    transaction.type === 'income'
                                                        ? theme.colors.success
                                                        : theme.colors.error,
                                            },
                                        ]}
                                    >
                                        {transaction.type === 'income' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteTransaction(transaction.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color={theme.colors.error}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton onPress={() => setModalVisible(true)} />

            {/* Transaction Modal */}
            <TransactionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={addTransaction}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    themeToggle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    greeting: {
        fontSize: 26,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
    },
    summaryGradient: {
        borderRadius: 16,
        padding: 20,
    },
    summaryLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        marginBottom: 8,
    },
    summaryAmount: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    summarySubtext: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
    },
    cashflowCard: {
        marginBottom: 20,
    },
    cashflowContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cashflowLabel: {
        fontSize: 15,
        marginBottom: 8,
    },
    cashflowAmount: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 4,
    },
    cashflowSubtext: {
        fontSize: 13,
    },
    savingsRateBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    savingsRateText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    quickStats: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    quickStatCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    quickStatValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    quickStatLabel: {
        fontSize: 11,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 8,
    },
    habitCard: {
        marginBottom: 20,
    },
    habitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    habitTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    habitSubtitle: {
        fontSize: 13,
        marginTop: 4,
    },
    transactionCard: {
        marginBottom: 12,
    },
    transactionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionDesc: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    transactionDate: {
        fontSize: 12,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    deleteButton: {
        padding: 4,
    },
});

export default HomeScreen;
