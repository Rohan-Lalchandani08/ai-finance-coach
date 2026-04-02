import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Goal, Challenge, HabitStreak, TransactionCategory } from '../types';
import {
    mockTransactions,
    mockBudgets,
    mockGoals,
    mockChallenges,
    mockHabitStreak,
} from '../data/mockData';
import { mlPipeline } from '../services/MLPipelineService';

interface DataContextType {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
    challenges: Challenge[];
    habitStreak: HabitStreak;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    addTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (id: string, data: Partial<Transaction>) => void;
    verifyTransaction: (id: string, correction?: Partial<Transaction>) => void;
    addBudget: (budget: Omit<Budget, 'id'>) => void;
    updateBudget: (id: string, data: Partial<Budget>) => void;
    addGoal: (goal: Omit<Goal, 'id' | 'milestones' | 'priority'>) => void;
    updateGoal: (id: string, currentAmount: number) => void;
    deleteGoal: (id: string) => void;
    clearAchievedGoals: () => void;
    clearUnverifiedTransactions: () => void;
    clearAllTransactions: () => void;
    seedDemoTransactions: () => void;
    reorderGoals: (orderedIds: string[]) => void;
    addChallenge: (challenge: Omit<Challenge, 'id' | 'completed'>) => void;
    updateChallenge: (id: string, value: number) => void; // ₹ for amount-mode, 1 for day-mode
    deleteChallenge: (id: string) => void;
    clearCompletedChallenges: () => void;
    updateActivity: () => void;
    addUserKeyword: (merchant: string, category: TransactionCategory) => void;
    propagateCorrection: (editedTxnId: string, originalMerchant: string, newMerchant: string, newCategory: TransactionCategory) => void;
    userKeywords: Record<string, TransactionCategory>;
    isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
    TRANSACTIONS: '@finance_coach_transactions',
    BUDGETS: '@finance_coach_budgets',
    GOALS: '@finance_coach_goals',
    CHALLENGES: '@finance_coach_challenges',
    HABIT_STREAK: '@finance_coach_habit_streak',
    USER_KEYWORDS: '@finance_coach_user_keywords',
};

// Words too generic to use as keywords (common banking/transaction terms)
const GENERIC_WORDS = new Set([
    'bank', 'account', 'debit', 'credit', 'payment', 'transfer', 
    'securitie', 'securities', 'limited', 'private', 'pvt', 'ltd',
    'upi', 'neft', 'imps', 'rtgs', 'the', 'and', 'for', 'from',
    'with', 'your', 'this', 'that', 'ref', 'avl', 'bal'
]);

// Extract individually meaningful words from a name/description
const getKeyWords = (name: string): string[] =>
    name.toLowerCase()
        .split(/[\s/\-_.,]+/)
        .filter(w => w.length >= 2 && !GENERIC_WORDS.has(w) && !/^\d+$/.test(w));

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
    const [goals, setGoals] = useState<Goal[]>(mockGoals);
    const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
    const [habitStreak, setHabitStreak] = useState<HabitStreak>(mockHabitStreak);
    const [userKeywords, setUserKeywords] = useState<Record<string, TransactionCategory>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load data from storage on mount
    useEffect(() => {
        loadData();
        // Initialize ML Pipeline
        const initML = async () => {
            try {
                await mlPipeline.initialize();
            } catch (e) {
                console.error("Failed to init ML pipeline", e);
            }
        };
        initML();
    }, []);

    // Save data whenever it changes
    useEffect(() => {
        if (!isLoading) {
            saveData();
        }
    }, [transactions, budgets, goals, challenges, habitStreak, userKeywords]);

    const loadData = async () => {
        try {
            const [
                storedTransactions,
                storedBudgets,
                storedGoals,
                storedChallenges,
                storedHabitStreak,
                storedUserKeywords,
            ] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
                AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
                AsyncStorage.getItem(STORAGE_KEYS.GOALS),
                AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES),
                AsyncStorage.getItem(STORAGE_KEYS.HABIT_STREAK),
                AsyncStorage.getItem(STORAGE_KEYS.USER_KEYWORDS),
            ]);

            if (storedTransactions) {
                const parsed = JSON.parse(storedTransactions);
                // Convert date strings back to Date objects
                const withDates = parsed.map((t: any) => ({
                    ...t,
                    date: new Date(t.date),
                }));
                setTransactions(withDates);
            }

            if (storedBudgets) {
                setBudgets(JSON.parse(storedBudgets));
            }

            if (storedGoals) {
                const parsed = JSON.parse(storedGoals);
                const withDates = parsed.map((g: any) => ({
                    ...g,
                    deadline: new Date(g.deadline),
                }));
                setGoals(withDates);
            }

            if (storedChallenges) {
                const parsed = JSON.parse(storedChallenges);
                const withDates = parsed.map((c: any) => ({
                    ...c,
                    deadline: new Date(c.deadline),
                }));
                setChallenges(withDates);
            }

            if (storedHabitStreak) {
                const parsed = JSON.parse(storedHabitStreak);
                setHabitStreak({
                    ...parsed,
                    lastActivityDate: new Date(parsed.lastActivityDate),
                    activities: parsed.activities.map((a: string) => new Date(a)),
                });
            }

            if (storedUserKeywords) {
                setUserKeywords(JSON.parse(storedUserKeywords));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            updateActivity();
            setIsLoading(false);
        }
    };

    const saveData = async () => {
        try {
            await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)),
                AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets)),
                AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),
                AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges)),
                AsyncStorage.setItem(STORAGE_KEYS.HABIT_STREAK, JSON.stringify(habitStreak)),
                AsyncStorage.setItem(STORAGE_KEYS.USER_KEYWORDS, JSON.stringify(userKeywords)),
            ]);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction: Transaction = {
            ...transaction,
            id: Date.now().toString(),
        };
        setTransactions((prev) => [newTransaction, ...prev]);
        updateActivity();

        // Update budget spent amount
        if (transaction.type === 'expense') {
            setBudgets((prev) =>
                prev.map((budget) =>
                    budget.category === transaction.category
                        ? { ...budget, spent: budget.spent + transaction.amount }
                        : budget
                )
            );
        }
    };

    const addTransactions = (txns: Omit<Transaction, 'id'>[]) => {
        const now = Date.now();
        
        // Learning logic: Check all unverified transactions against user-learned keywords
        // Use smart word overlap matching
        const updatedTxns = txns.map((t) => {
            const lowerMerchant = t.description.toLowerCase();
            const currentWords = getKeyWords(lowerMerchant);
            
            // Check for any learned keyword that has word overlap or substring match
            const sortedLearnedKeywords = Object.keys(userKeywords).sort((a, b) => b.length - a.length);
            
            for (const kw of sortedLearnedKeywords) {
                const lowerKW = kw.toLowerCase();
                const kwWords = getKeyWords(lowerKW);
                
                const substringMatch = lowerMerchant.includes(lowerKW) || lowerKW.includes(lowerMerchant);
                const wordMatch = currentWords.some(w => kwWords.includes(w)) || currentWords.includes(lowerKW);

                if (substringMatch || wordMatch) {
                    return { 
                        ...t, 
                        category: userKeywords[kw], 
                        matchedKeyword: `learned:${kw}` 
                    };
                }
            }
            return t;
        });

        const newTxns: Transaction[] = updatedTxns.map((t, i) => ({ ...t, id: (now + i).toString() }));
        setTransactions((prev) => [...newTxns, ...prev]);
        updateActivity();
    };

    const verifyTransaction = (id: string, correction?: Partial<Transaction>) => {
        setTransactions((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, ...correction, needsVerification: false } : t
            )
        );
    };

    const deleteTransaction = (id: string) => {
        const transaction = transactions.find((t) => t.id === id);
        if (!transaction) return;

        setTransactions((prev) => prev.filter((t) => t.id !== id));

        // Update budget spent amount
        if (transaction.type === 'expense') {
            setBudgets((prev) =>
                prev.map((budget) =>
                    budget.category === transaction.category
                        ? { ...budget, spent: Math.max(0, budget.spent - transaction.amount) }
                        : budget
                )
            );
        }
    };

    const clearUnverifiedTransactions = () => {
        setTransactions((prev) => prev.filter((t) => !t.needsVerification));
    };

    const clearAllTransactions = async () => {
        setTransactions([]);
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        } catch (e) {
            console.error("Failed to clear transactions from storage", e);
        }
    };

    const seedDemoTransactions = () => {
        const now = new Date();
        const demoTxns: Transaction[] = [];
        
        // 1. Unverified (Review) Transactions - Last 2 days
        const merchantsForReview = [
            { name: 'ANGEL ONE SECURITIES', amount: 5000, category: 'investment', rawSnippet: 'Debited INR 5000.00 for AngelOne' },
            { name: 'ANGEL BROKING LTD', amount: 2500, category: 'investment', rawSnippet: 'Ref: ANGEL BROKING Debit 2500' },
            { name: 'SWIGGY', amount: 450, category: 'food', rawSnippet: 'Paid 450 to Swiggy via UPI' },
            { name: 'ZEPTO', amount: 320, category: 'groceries', rawSnippet: 'Zepto groceries order 320' },
            { name: 'NETFLIX', amount: 499, category: 'entertainment', rawSnippet: 'Netflix subscription 499 debited' },
        ];

        merchantsForReview.forEach((m, i) => {
            const date = new Date();
            date.setDate(now.getDate() - (i % 2)); // Spread over today/yesterday
            demoTxns.push({
                id: `demo-review-${i}`,
                description: m.name,
                amount: m.amount,
                date,
                category: m.category as TransactionCategory,
                type: 'expense',
                needsVerification: true,
                rawMessage: m.rawSnippet,
                matchedKeyword: 'auto-regex'
            });
        });

        // 2. Verified Transactions - Last 7 days (Week)
        const weekMerchants = [
            { name: 'Zomato', amount: 800, cat: 'food' },
            { name: 'Uber', amount: 350, cat: 'travel' },
            { name: 'Amazon', amount: 1200, cat: 'shopping' },
            { name: 'Salary', amount: 75000, cat: 'income', type: 'income' },
        ];
        weekMerchants.forEach((m, i) => {
            const date = new Date();
            date.setDate(now.getDate() - i - 2);
            demoTxns.push({
                id: `demo-week-${i}`,
                description: m.name,
                amount: m.amount,
                date,
                category: (m.cat || 'other') as TransactionCategory,
                type: (m.type || 'expense') as 'income' | 'expense',
                needsVerification: false,
            });
        });

        // 3. Verified Transactions - Earlier this month
        const monthMerchants = [
            { name: 'Rent', amount: 25000, cat: 'bills' },
            { name: 'Electricity', amount: 2100, cat: 'bills' },
            { name: 'Gym', amount: 1500, cat: 'health' },
        ];
        monthMerchants.forEach((m, i) => {
            const date = new Date(now.getFullYear(), now.getMonth(), 5 + i);
            demoTxns.push({
                id: `demo-month-${i}`,
                description: m.name,
                amount: m.amount,
                date,
                category: m.cat as TransactionCategory,
                type: 'expense',
                needsVerification: false,
            });
        });

        // 4. Verified Transactions - Earlier this year
        const yearMerchants = [
            { name: 'Flight to Goa', amount: 8500, cat: 'travel' },
            { name: 'Apple Store', amount: 65000, cat: 'shopping' },
        ];
        yearMerchants.forEach((m, i) => {
            const date = new Date(now.getFullYear(), 0, 15 + i); // January
            demoTxns.push({
                id: `demo-year-${i}`,
                description: m.name,
                amount: m.amount,
                date,
                category: m.cat as TransactionCategory,
                type: 'expense',
                needsVerification: false,
            });
        });

        setTransactions(demoTxns);
    };

    const updateTransaction = (id: string, data: Partial<Transaction>) => {
        setTransactions((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...data } : t))
        );
    };

    const addBudget = (budget: Omit<Budget, 'id'>) => {
        const newBudget: Budget = {
            ...budget,
            id: Date.now().toString(),
        };
        setBudgets((prev) => [...prev, newBudget]);
    };

    const updateBudget = (id: string, data: Partial<Budget>) => {
        setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    };

    const addGoal = (goal: Omit<Goal, 'id' | 'milestones' | 'priority'>) => {
        setGoals((prev) => {
            const nextPriority = prev.length + 1;
            const newGoal: Goal = {
                ...goal,
                id: Date.now().toString(),
                milestones: [],
                priority: nextPriority,
            };
            return [newGoal, ...prev];
        });
    };

    // Reorder goals by providing a sorted list of IDs
    const reorderGoals = (orderedIds: string[]) => {
        setGoals((prev) => {
            const reordered = orderedIds
                .map((id, index) => {
                    const g = prev.find((g) => g.id === id);
                    return g ? { ...g, priority: index + 1 } : null;
                })
                .filter(Boolean) as Goal[];
            // Keep any goals not in orderedIds at the end
            const rest = prev.filter((g) => !orderedIds.includes(g.id));
            return [...reordered, ...rest];
        });
    };

    const addChallenge = (challenge: Omit<Challenge, 'id' | 'completed'>) => {
        const newChallenge: Challenge = {
            ...challenge,
            id: Date.now().toString(),
            savedAmount: challenge.challengeMode === 'amount' ? (challenge.savedAmount ?? 0) : undefined,
            daysCompleted: challenge.challengeMode === 'days' ? (challenge.daysCompleted ?? 0) : undefined,
            lastDayLogged: challenge.challengeMode === 'days' ? '' : undefined,
            currentStreak: 0,
            longestStreak: 0,
            history: [],
            completed: false,
        };
        setChallenges((prev) => [newChallenge, ...prev]);
    };

    const deleteChallenge = (id: string) => {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
    };

    const clearCompletedChallenges = () => {
        setChallenges((prev) => prev.filter((c) => !c.completed));
    };

    const deleteGoal = (id: string) => {
        setGoals((prev) => {
            const updated = prev.filter((g) => g.id !== id);
            // Re-normalize priorities
            return updated.map((g, index) => ({ ...g, priority: index + 1 }));
        });
    };

    const clearAchievedGoals = () => {
        setGoals((prev) => prev.filter((g) => g.currentAmount < g.targetAmount));
    };

    const updateGoal = (id: string, currentAmount: number) => {
        setGoals((prev) => prev.map((g) => {
            if (g.id !== id) return g;
            
            // Check if any milestones are now reached
            const updatedMilestones = g.milestones.map(m => 
                !m.completed && currentAmount >= m.amount ? { ...m, completed: true } : m
            );

            return { ...g, currentAmount, milestones: updatedMilestones };
        }));
        updateActivity();
    };

    // value = ₹ added (amount-mode) or 1 (day-mode, marks today as done)
    const updateChallenge = (id: string, value: number) => {
        setChallenges((prev) => prev.map((c) => {
            if (c.id !== id || c.completed) return c;

            let nowCompleted = false;
            let updated: Partial<Challenge> = {};

            let newStreak = c.currentStreak ?? 0;
            const history = c.history ? [...c.history] : [];
            const todayStr = new Date().toISOString().slice(0, 10);

            // Handle Streak Logic (did they log yesterday?)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);

            // If last log wasn't today or yesterday, they broke the streak
            if (c.lastDayLogged && c.lastDayLogged !== todayStr && c.lastDayLogged !== yesterdayStr) {
                newStreak = 0;
            }

            if (c.challengeMode === 'amount') {
                const newSaved = (c.savedAmount ?? 0) + value;
                nowCompleted = newSaved >= (c.targetAmount ?? 0);
                
                // For amount, we can log multiple times a day or just once. We'll bump streak if first log today.
                if (c.lastDayLogged !== todayStr) {
                    newStreak += 1;
                }
                
                history.push({ date: new Date().toISOString(), amountLogged: value });

                updated = { 
                    savedAmount: newSaved, 
                    currentStreak: newStreak,
                    longestStreak: Math.max(c.longestStreak ?? 0, newStreak),
                    history,
                    lastDayLogged: todayStr 
                };
            } else {
                // days mode — only allow one log per calendar day
                if (c.lastDayLogged === todayStr) return c; // already logged today
                
                newStreak += 1;
                const newDays = (c.daysCompleted ?? 0) + 1;
                nowCompleted = newDays >= (c.targetDays ?? 0);
                
                history.push({ date: new Date().toISOString(), amountLogged: 1 });

                updated = { 
                    daysCompleted: newDays, 
                    lastDayLogged: todayStr,
                    currentStreak: newStreak,
                    longestStreak: Math.max(c.longestStreak ?? 0, newStreak),
                    history
                };
            }

            // Auto-deposit targetAmount into linked goal on first completion (amount-mode only)
            if (nowCompleted && c.challengeMode === 'amount' && (c.targetAmount ?? 0) > 0) {
                const depositAmount = c.targetAmount ?? 0;
                console.log(`[Challenge Deposit] Challenge ${c.id} completed. Attempting to deposit ₹${depositAmount}`);
                
                setGoals((prevGoals) => {
                    const targetId = c.rewardGoalId
                        ? c.rewardGoalId
                        : prevGoals
                            .filter((g) => g.currentAmount < g.targetAmount)
                            .sort((a, b) => a.priority - b.priority)[0]?.id;

                    console.log(`[Challenge Deposit] targetId resolved to: ${targetId} (rewardGoalId was: ${c.rewardGoalId})`);

                    if (!targetId) {
                        console.log(`[Challenge Deposit] No valid target goal found to deposit into.`);
                        return prevGoals;
                    }

                    return prevGoals.map((g) => {
                        if (g.id !== targetId) return g;
                        const newAmount = g.currentAmount + depositAmount;
                        console.log(`[Challenge Deposit] Depositing ₹${depositAmount} into goal: ${g.title}. New amount: ${newAmount}`);
                        
                        const updatedMilestones = g.milestones.map((m) =>
                            !m.completed && newAmount >= m.amount ? { ...m, completed: true } : m
                        );
                        return { ...g, currentAmount: newAmount, milestones: updatedMilestones };
                    });
                });
            }

            return { ...c, ...updated, completed: nowCompleted };
        }));
        updateActivity();
    };

    const updateActivity = () => {
        setHabitStreak((prev) => {
            const now = new Date();
            const last = new Date(prev.lastActivityDate);
            
            // Normalize to start of day for comparison
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
            
            const diffTime = today.getTime() - lastDay.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already checked in today
                return {
                    ...prev,
                    lastActivityDate: now,
                    activities: [...prev.activities, now]
                };
            }

            let newStreak = prev.currentStreak;
            if (diffDays === 1) {
                newStreak += 1; // Consecutive day!
            } else if (diffDays > 1) {
                newStreak = 1; // Streak broken
            }

            const newLongest = Math.max(prev.longestStreak, newStreak);

            // Check if any streak milestones were achieved
            const updatedMilestones = prev.milestones.map(m => 
                !m.achieved && newStreak >= m.days ? { ...m, achieved: true } : m
            );

            return {
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastActivityDate: now,
                activities: [...prev.activities, now],
                milestones: updatedMilestones
            };
        });
    };

    const addUserKeyword = (merchant: string, category: TransactionCategory) => {
        const words = getKeyWords(merchant);
        const updates: Record<string, TransactionCategory> = {};
        // Save the full name AND each individual word
        updates[merchant.toLowerCase()] = category;
        for (const w of words) updates[w] = category;
        setUserKeywords(prev => ({ ...prev, ...updates }));
    };

    const propagateCorrection = (editedTxnId: string, originalMerchant: string, newMerchant: string, newCategory: TransactionCategory) => {
        const lowerOriginal = originalMerchant.toLowerCase();
        const lowerNew = newMerchant.toLowerCase();

        // 1. Save full names AND each individual word as keywords
        const keywordUpdates: Record<string, TransactionCategory> = {
            [lowerOriginal]: newCategory,
            [lowerNew]: newCategory,
        };
        for (const w of getKeyWords(lowerOriginal)) keywordUpdates[w] = newCategory;
        for (const w of getKeyWords(lowerNew)) keywordUpdates[w] = newCategory;
        setUserKeywords(prev => ({ ...prev, ...keywordUpdates }));

        const originalWords = getKeyWords(lowerOriginal);
        const newWords = getKeyWords(lowerNew);
        const allTriggerWords = new Set([...originalWords, ...newWords]);

        // 2. Update all unverified transactions that share ANY significant word + the explicitly edited one
        setTransactions(prev => prev.map(t => {
            // Only examine unverified transactions
            if (!t.needsVerification) return t;
            
            // Forcefully update the exact transaction the user edited
            if (t.id === editedTxnId) {
                return {
                    ...t,
                    description: newMerchant,
                    category: newCategory,
                    needsVerification: false
                };
            }

            const desc = t.description.toLowerCase();
            const descWords = getKeyWords(desc);

            // Match if: substring OR any key word overlaps
            const substringMatch = desc.includes(lowerOriginal) || desc.includes(lowerNew);
            const wordMatch = descWords.some(w => allTriggerWords.has(w));

            if (substringMatch || wordMatch) {
                // Determine the matched trigger word for transparency, prioritizing a trigger word if one was matched
                const matchedWord = descWords.find(w => allTriggerWords.has(w)) || lowerNew;
                return {
                    ...t,
                    description: newMerchant,
                    category: newCategory,
                    matchedKeyword: `user:${matchedWord}`,
                    needsVerification: false
                };
            }
            return t;
        }));
    };

    return (
        <DataContext.Provider
            value={{
                transactions,
                budgets,
                goals,
                challenges,
                habitStreak,
                addTransaction,
                addTransactions,
                deleteTransaction,
                updateTransaction,
                verifyTransaction,
                addBudget,
                updateBudget,
                addGoal,
                deleteGoal,
                clearAchievedGoals,
                updateGoal,
                reorderGoals,
                addChallenge,
                deleteChallenge,
                clearCompletedChallenges,
                updateChallenge,
                updateActivity,
                addUserKeyword,
                propagateCorrection,
                clearUnverifiedTransactions,
                clearAllTransactions,
                seedDemoTransactions,
                userKeywords,
                isLoading,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
