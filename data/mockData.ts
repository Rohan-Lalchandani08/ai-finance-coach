import {
    Transaction,
    Budget,
    Goal,
    Challenge,
    HabitStreak,
    Alert,
    FinancialTerm,
    TransactionCategory,
} from '../types';

// Mock Transactions
export const mockTransactions: Transaction[] = [
    {
        id: '1',
        amount: 45.99,
        category: 'food',
        description: 'Grocery Shopping',
        date: new Date(2026, 1, 10),
        type: 'expense',
        aiCategory: {
            suggested: 'food',
            confidence: 0.95,
        },
        needWantClassification: 'need',
    },
    {
        id: '2',
        amount: 12.50,
        category: 'food',
        description: 'Coffee Shop',
        date: new Date(2026, 1, 9),
        type: 'expense',
        aiCategory: {
            suggested: 'food',
            confidence: 0.88,
        },
        needWantClassification: 'want',
    },
    {
        id: '3',
        amount: 75.00,
        category: 'transport',
        description: 'Gas Station',
        date: new Date(2026, 1, 8),
        type: 'expense',
        aiCategory: {
            suggested: 'transport',
            confidence: 0.92,
        },
        needWantClassification: 'need',
    },
    {
        id: '4',
        amount: 299.99,
        category: 'shopping',
        description: 'Nike Store',
        date: new Date(2026, 1, 7),
        type: 'expense',
        aiCategory: {
            suggested: 'shopping',
            confidence: 0.97,
        },
        needWantClassification: 'want',
    },
    {
        id: '5',
        amount: 3500.00,
        category: 'salary',
        description: 'Monthly Salary',
        date: new Date(2026, 1, 1),
        type: 'income',
    },
];

// Mock Budgets
export const mockBudgets: Budget[] = [
    {
        id: '1',
        category: 'food',
        limit: 500,
        spent: 358.49,
        period: 'monthly',
        needAmount: 300,
        wantAmount: 58.49,
    },
    {
        id: '2',
        category: 'transport',
        limit: 300,
        spent: 175.00,
        period: 'monthly',
        needAmount: 175,
        wantAmount: 0,
    },
    {
        id: '3',
        category: 'shopping',
        limit: 400,
        spent: 299.99,
        period: 'monthly',
        needAmount: 100,
        wantAmount: 199.99,
    },
    {
        id: '4',
        category: 'entertainment',
        limit: 200,
        spent: 85.50,
        period: 'monthly',
        needAmount: 0,
        wantAmount: 85.50,
    },
    {
        id: '5',
        category: 'bills',
        limit: 800,
        spent: 750.00,
        period: 'monthly',
        needAmount: 750,
        wantAmount: 0,
    },
];

// Mock Goals
export const mockGoals: Goal[] = [
    {
        id: '1',
        title: 'Emergency Fund',
        description: 'Build a 6-month emergency fund',
        targetAmount: 15000,
        currentAmount: 8250,
        deadline: new Date(2026, 11, 31),
        category: 'savings',
        milestones: [
            { id: 'm1', title: '25% Complete', amount: 3750, completed: true },
            { id: 'm2', title: '50% Complete', amount: 7500, completed: true },
            { id: 'm3', title: '75% Complete', amount: 11250, completed: false },
            { id: 'm4', title: '100% Complete', amount: 15000, completed: false },
        ],
        priority: 1,
    },
    {
        id: '2',
        title: 'New Laptop',
        description: 'Save for a MacBook Pro',
        targetAmount: 2500,
        currentAmount: 1200,
        deadline: new Date(2026, 5, 30),
        category: 'purchase',
        milestones: [
            { id: 'm1', title: 'Halfway There', amount: 1250, completed: true },
            { id: 'm2', title: 'Almost Done', amount: 2000, completed: false },
            { id: 'm3', title: 'Goal Reached', amount: 2500, completed: false },
        ],
        priority: 2,
    },
    {
        id: '3',
        title: 'Vacation Fund',
        description: 'Summer trip to Europe',
        targetAmount: 5000,
        currentAmount: 1800,
        deadline: new Date(2026, 6, 1),
        category: 'savings',
        milestones: [
            { id: 'm1', title: 'First $1000', amount: 1000, completed: true },
            { id: 'm2', title: '$2500 Mark', amount: 2500, completed: false },
            { id: 'm3', title: 'Full Amount', amount: 5000, completed: false },
        ],
        priority: 3,
    },
];

// Mock Challenges
export const mockChallenges: Challenge[] = [
    {
        id: '1',
        title: 'No-Spend Weekend',
        description: 'Complete a weekend without any non-essential purchases',
        type: 'spending',
        challengeMode: 'days',
        targetDays: 2,
        daysCompleted: 1,
        lastDayLogged: '',
        currentStreak: 1,
        longestStreak: 1,
        history: [{ date: new Date(2026, 2, 13).toISOString(), amountLogged: 1 }],
        startDate: new Date(2026, 2, 13),
        deadline: new Date(2026, 2, 15),
        completed: false,
        icon: '🎯',
    },
    {
        id: '2',
        title: 'Save ₹5,000 This Month',
        description: 'Set aside ₹5,000 in savings',
        type: 'saving',
        challengeMode: 'amount',
        targetAmount: 5000,
        savedAmount: 3200,
        currentStreak: 4,
        longestStreak: 4,
        history: [
            { date: new Date(2026, 2, 10).toISOString(), amountLogged: 1000 },
            { date: new Date(2026, 2, 11).toISOString(), amountLogged: 1000 },
            { date: new Date(2026, 2, 12).toISOString(), amountLogged: 700 },
            { date: new Date(2026, 2, 13).toISOString(), amountLogged: 500 }
        ],
        startDate: new Date(2026, 2, 1),
        deadline: new Date(2026, 2, 31),
        completed: false,
        icon: '💰',
    },
    {
        id: '3',
        title: 'No Dining Out — 21 Days',
        description: 'Avoid restaurants and takeaway for 21 days straight',
        type: 'spending',
        challengeMode: 'days',
        targetDays: 21,
        daysCompleted: 7,
        lastDayLogged: '',
        currentStreak: 7,
        longestStreak: 7,
        history: [], // simplify mock for days
        startDate: new Date(2026, 2, 1),
        deadline: new Date(2026, 2, 22),
        completed: false,
        icon: '🥗',
    },
    {
        id: '4',
        title: 'Coffee Challenge',
        description: 'Make coffee at home for 7 days straight',
        type: 'spending',
        challengeMode: 'days',
        targetDays: 7,
        daysCompleted: 7,
        lastDayLogged: '',
        currentStreak: 7,
        longestStreak: 7,
        history: [],
        startDate: new Date(2026, 2, 5),
        deadline: new Date(2026, 2, 12),
        completed: true,
        icon: '☕',
    },
];

// Mock Habit Streak
export const mockHabitStreak: HabitStreak = {
    currentStreak: 12,
    longestStreak: 18,
    lastActivityDate: new Date(2026, 1, 11),
    activities: [
        new Date(2026, 1, 11),
        new Date(2026, 1, 10),
        new Date(2026, 1, 9),
        new Date(2026, 1, 8),
        new Date(2026, 1, 7),
    ],
    milestones: [
        { days: 7, achieved: true, reward: 'Bronze Badge' },
        { days: 14, achieved: false, reward: 'Silver Badge' },
        { days: 30, achieved: false, reward: 'Gold Badge' },
        { days: 100, achieved: false, reward: 'Diamond Badge' },
    ],
};

// Mock Alerts
export const mockAlerts: Alert[] = [
    {
        id: '1',
        type: 'overspending',
        severity: 'high',
        title: 'Shopping Budget Alert',
        message: 'You have exceeded 75% of your shopping budget for this month',
        timestamp: new Date(2026, 1, 10),
        read: false,
        actionable: true,
    },
    {
        id: '2',
        type: 'unusual',
        severity: 'medium',
        title: 'Unusual Spending Pattern',
        message: 'Your food expenses are 30% higher than usual this week',
        timestamp: new Date(2026, 1, 9),
        read: false,
        actionable: true,
    },
    {
        id: '3',
        type: 'goal',
        severity: 'low',
        title: 'Goal Milestone Reached!',
        message: 'Congratulations! You reached 50% of your Emergency Fund goal',
        timestamp: new Date(2026, 1, 8),
        read: true,
        actionable: false,
    },
];

// Mock Financial Term of the Day
export const mockFinancialTerm: FinancialTerm = {
    term: 'Compound Interest',
    definition: 'Interest calculated on the initial principal and accumulated interest from previous periods',
    example: 'If you invest $1,000 at 5% annual compound interest, after one year you will have $1,050, and in year two, interest is calculated on $1,050.',
    date: new Date(2026, 1, 11),
};

export const getCategoryIcon = (category: TransactionCategory): string => {
    const icons: Record<TransactionCategory, string> = {
        food: '🍔',
        transport: '🚗',
        shopping: '🛍️',
        entertainment: '🎬',
        bills: '📄',
        health: '🏥',
        education: '📚',
        savings: '💰',
        salary: '💵',
        other: '📦',
    };
    return icons[category];
};

export const getCategoryColor = (category: TransactionCategory, theme: any): string => {
    return theme.colors[category] || theme.colors.other;
};
