// Transaction types and models
export interface Transaction {
    id: string;
    amount: number;
    category: TransactionCategory;
    description: string;
    date: Date;
    type: 'income' | 'expense';
    aiCategory?: {
        suggested: TransactionCategory;
        confidence: number;
    };
    needWantClassification?: 'need' | 'want';
    notes?: string;
    needsVerification?: boolean;   // true = imported from SMS, awaiting user confirmation
    smsSource?: string;            // e.g. "HDFC Bank UPI" — the bank/source tag
    matchedKeyword?: string;       // the keyword that triggered this category
    rawMessage?: string;           // the original SMS text for identification
}

export type TransactionCategory =
    | 'food'
    | 'transport'
    | 'shopping'
    | 'entertainment'
    | 'bills'
    | 'health'
    | 'education'
    | 'savings'
    | 'investment'
    | 'groceries'
    | 'travel'
    | 'personal_care'
    | 'maintenance'
    | 'salary'
    | 'other';

// Budget types
export interface Budget {
    id: string;
    category: TransactionCategory;
    limit: number;
    spent: number;
    period: 'weekly' | 'monthly';
    needAmount: number;
    wantAmount: number;
}

// Goal types
export interface Goal {
    id: string;
    title: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    category: 'savings' | 'debt' | 'purchase' | 'investment';
    milestones: Milestone[];
    priority: number; // lower number = higher priority (1 = top)
}

export interface Milestone {
    id: string;
    title: string;
    amount: number;
    completed: boolean;
}

// Challenge types
export type ChallengeMode = 'amount' | 'days';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'spending' | 'saving' | 'learning';
    challengeMode: ChallengeMode;
    // Amount-based (challengeMode === 'amount')
    targetAmount?: number;   // e.g. ₹5000 to save/avoid
    savedAmount?: number;    // running total accumulated
    // Days-based (challengeMode === 'days')
    targetDays?: number;     // e.g. 21 days
    daysCompleted?: number;  // how many days done so far
    lastDayLogged?: string;  // ISO date string, prevents double-logging
    // Tracking & Streaks
    currentStreak?: number;  // current active days in a row
    longestStreak?: number;  // best streak
    history?: { date: string, amountLogged: number }[]; // daily log
    // Common
    startDate: Date;
    deadline: Date;
    completed: boolean;
    icon: string;
    rewardGoalId?: string;
}

// Habit streak types
export interface HabitStreak {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    activities: Date[];
    milestones: StreakMilestone[];
}

export interface StreakMilestone {
    days: number;
    achieved: boolean;
    reward: string;
}

// Alert types
export interface Alert {
    id: string;
    type: 'overspending' | 'budget' | 'unusual' | 'goal';
    severity: 'low' | 'medium' | 'high';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionable: boolean;
    action?: {
        label: string;
        handler: () => void;
    };
}

// Insights and predictions
export interface SpendingPrediction {
    category: TransactionCategory;
    predictedAmount: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AIInsight {
    id: string;
    type: 'tip' | 'warning' | 'achievement' | 'suggestion';
    title: string;
    message: string;
    timestamp: Date;
    icon: string;
}

// Chat types
export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    quickActions?: QuickAction[];
}

export interface QuickAction {
    id: string;
    label: string;
    action: string;
}

// Financial term of the day
export interface FinancialTerm {
    term: string;
    definition: string;
    example: string;
    date: Date;
}

// Analytics types
export interface SpendingAnalytics {
    period: 'week' | 'month' | 'year';
    totalSpent: number;
    totalIncome: number;
    netSavings: number;
    categoryBreakdown: CategorySpending[];
    dailySpending: DailySpending[];
    comparison: {
        previousPeriod: number;
        percentageChange: number;
    };
}

export interface CategorySpending {
    category: TransactionCategory;
    amount: number;
    percentage: number;
    transactionCount: number;
}

export interface DailySpending {
    date: Date;
    amount: number;
}

// User preferences
export interface UserPreferences {
    theme: 'light' | 'dark';
    currency: string;
    budgetPeriod: 'weekly' | 'monthly';
    notificationsEnabled: boolean;
}
