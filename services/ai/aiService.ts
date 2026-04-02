import {
    Transaction,
    TransactionCategory,
    SpendingPrediction,
    AIInsight,
    Budget,
    ChatMessage,
    QuickAction,
} from '../../types';
import { ALL_CATEGORIES } from '../../constants/categories';

/**
 * AI Service Layer
 * This file contains mock implementations of AI features.
 * Replace these functions with actual ML model API calls when ready.
 */

// 1. Auto Expense Classification
export const classifyTransaction = async (
    transaction: Partial<Transaction>
): Promise<{ category: TransactionCategory; confidence: number }> => {
    // Mock AI classification logic
    await delay(500);

    const description = transaction.description?.toLowerCase() || '';

    // Simple keyword-based mock classification
    if (description.includes('grocery') || description.includes('restaurant') || description.includes('food')) {
        return { category: 'food', confidence: 0.95 };
    }
    if (description.includes('gas') || description.includes('uber') || description.includes('taxi')) {
        return { category: 'transport', confidence: 0.92 };
    }
    if (description.includes('netflix') || description.includes('movie') || description.includes('concert')) {
        return { category: 'entertainment', confidence: 0.88 };
    }
    if (description.includes('rent') || description.includes('electricity') || description.includes('bill')) {
        return { category: 'bills', confidence: 0.93 };
    }
    if (description.includes('doctor') || description.includes('pharmacy') || description.includes('hospital')) {
        return { category: 'health', confidence: 0.90 };
    }

    return { category: 'other', confidence: 0.60 };
};

// 2. Spending Predictions and Future Forecasting
export const predictSpending = async (
    transactions: Transaction[],
    category?: TransactionCategory
): Promise<SpendingPrediction[]> => {
    await delay(800);

    // Mock prediction based on historical average with slight increase
    const predictions: SpendingPrediction[] = [
        {
            category: 'food',
            predictedAmount: 520,
            confidence: 0.87,
            trend: 'increasing',
        },
        {
            category: 'transport',
            predictedAmount: 285,
            confidence: 0.82,
            trend: 'stable',
        },
        {
            category: 'shopping',
            predictedAmount: 380,
            confidence: 0.75,
            trend: 'decreasing',
        },
        {
            category: 'entertainment',
            predictedAmount: 210,
            confidence: 0.79,
            trend: 'increasing',
        },
    ];

    return category ? predictions.filter((p) => p.category === category) : predictions;
};

// 3. Overspending Detection
export const detectOverspending = async (
    transactions: Transaction[],
    budgets: Budget[]
): Promise<AIInsight[]> => {
    await delay(600);

    const insights: AIInsight[] = [];

    budgets.forEach((budget) => {
        const spentPercentage = (budget.spent / budget.limit) * 100;

        if (spentPercentage > 90) {
            insights.push({
                id: `alert-${budget.id}`,
                type: 'warning',
                title: `${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)} Budget Critical`,
                message: `You've used ${spentPercentage.toFixed(0)}% of your ${budget.category} budget. Consider reducing spending.`,
                timestamp: new Date(),
                icon: '⚠️',
            });
        } else if (spentPercentage > 75) {
            insights.push({
                id: `alert-${budget.id}`,
                type: 'tip',
                title: `${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)} Budget Warning`,
                message: `You've used ${spentPercentage.toFixed(0)}% of your ${budget.category} budget.`,
                timestamp: new Date(),
                icon: '💡',
            });
        }
    });

    return insights;
};

// 4. Smart Budgeting Recommendations
export const generateBudgetRecommendations = async (
    transactions: Transaction[],
    budgets: Budget[]
): Promise<AIInsight[]> => {
    await delay(700);

    return [
        {
            id: 'rec-1',
            type: 'suggestion',
            title: 'Optimize Your Food Budget',
            message: 'Based on your spending, you could save $150/month by reducing dining out and cooking more at home.',
            timestamp: new Date(),
            icon: '🎯',
        },
        {
            id: 'rec-2',
            type: 'tip',
            title: 'Increase Savings Allocation',
            message: 'You have an extra $200 this month. Consider moving it to your emergency fund.',
            timestamp: new Date(),
            icon: '💰',
        },
    ];
};

// 5. Need vs Want Analyzer
export const classifyNeedWant = async (
    transaction: Transaction
): Promise<{ classification: 'need' | 'want'; confidence: number; reasoning: string }> => {
    await delay(500);

    const essentialCategories: TransactionCategory[] = ['food', 'transport', 'bills', 'health'];
    const description = transaction.description.toLowerCase();

    // Basic necessities
    if (essentialCategories.includes(transaction.category)) {
        if (transaction.category === 'food') {
            if (description.includes('restaurant') || description.includes('coffee') || description.includes('bar')) {
                return {
                    classification: 'want',
                    confidence: 0.85,
                    reasoning: 'Dining out is typically a discretionary expense',
                };
            }
            return {
                classification: 'need',
                confidence: 0.90,
                reasoning: 'Groceries and basic food are essential',
            };
        }
        return {
            classification: 'need',
            confidence: 0.88,
            reasoning: 'Essential expense for daily living',
        };
    }

    // Discretionary spending
    return {
        classification: 'want',
        confidence: 0.92,
        reasoning: 'Non-essential discretionary purchase',
    };
};

// 6. Generate AI Insights
export const generateInsights = async (
    transactions: Transaction[],
    budgets: Budget[]
): Promise<AIInsight[]> => {
    await delay(900);

    return [
        {
            id: 'insight-1',
            type: 'achievement',
            title: 'Great Job!',
            message: 'You spent 20% less on entertainment this week compared to last week.',
            timestamp: new Date(),
            icon: '🎉',
        },
        {
            id: 'insight-2',
            type: 'tip',
            title: 'Spending Pattern Detected',
            message: 'You tend to spend more on weekends. Try planning your weekend activities in advance.',
            timestamp: new Date(),
            icon: '📊',
        },
        {
            id: 'insight-3',
            type: 'suggestion',
            title: 'Save on Subscriptions',
            message: 'You have 5 active subscriptions. Review and cancel unused ones to save ~$50/month.',
            timestamp: new Date(),
            icon: '💡',
        },
    ];
};

// 7. AI Coach Chat
export const chatWithCoach = async (
    message: string,
    conversationHistory: ChatMessage[],
    financialContext?: {
        totalSpent: number;
        totalIncome: number;
        topCategory?: string;
        unverifiedCount?: number;
        categoryTotals?: { cat: string; total: number }[];
    }
): Promise<{ response: string; quickActions?: QuickAction[] }> => {
    await delay(1000);

    const lowerMessage = message.toLowerCase();

    // ── Context-Aware Responses (Improved) ───────────────────
    
    if (lowerMessage.includes('how much') || lowerMessage.includes('spent') || lowerMessage.includes('analyze')) {
        if (financialContext) {
            const { totalSpent, totalIncome, topCategory, categoryTotals } = financialContext;
            const savings = totalIncome - totalSpent;
            
            let response = `I've analyzed your data! Currently, you've spent ₹${totalSpent.toLocaleString()} this period. Your largest expense is in ${topCategory || 'miscellaneous'}.`;
            
            // Check if user is asking about a specific category
            const mentionedCategory = ALL_CATEGORIES.find(cat => lowerMessage.includes(cat.toLowerCase()));
            if (mentionedCategory) {
                const catTotal = categoryTotals?.find(ct => ct.cat === mentionedCategory)?.total || 0;
                response = `On ${mentionedCategory}, you've spent ₹${catTotal.toLocaleString()} so far. ${catTotal > totalSpent * 0.3 ? "This seems to be a significant portion of your budget." : "This is well within reasonable limits."}`;
            } else if (categoryTotals && categoryTotals.length > 1) {
                const secondCategory = categoryTotals[1];
                response += ` Closely followed by ${secondCategory.cat} at ₹${secondCategory.total.toLocaleString()}.`;
            }

            if (savings > 0 && !mentionedCategory) {
                response += ` You've also saved ₹${savings.toLocaleString()}—great work!`;
            } else if (savings < 0 && !mentionedCategory) {
                response += ` You're spending more than your income—let's look at where we can cut back.`;
            }
            
            return {
                response,
                quickActions: [
                    { id: 'qa1', label: 'View Breakdown', action: 'navigate_analyze' },
                    { id: 'qa2', label: 'Budget Tips', action: 'budget_tips' },
                ],
            };
        }
    }

    if (financialContext?.unverifiedCount && financialContext.unverifiedCount > 0 && lowerMessage.includes('review')) {
        return {
            response: `You have ${financialContext.unverifiedCount} new transactions waiting for review! Shall we go through them now? It'll only take a minute to keep your records accurate.`,
            quickActions: [
                { id: 'qa1', label: 'Go to Review', action: 'navigate_analyze' },
            ],
        };
    }

    // Default conversational responses
    if (lowerMessage.includes('budget')) {
        return {
            response: "Based on your spending patterns, you're doing well with your budgets! However, I noticed you're approaching the limit on your shopping budget. Would you like me to help you create a plan to stay within budget?",
            quickActions: [
                { id: 'qa1', label: 'Show my budgets', action: 'navigate_budgets' },
                { id: 'qa2', label: 'Create savings plan', action: 'create_plan' },
                { id: 'qa3', label: 'View insights', action: 'view_insights' },
            ],
        };
    }

    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
        return {
            response: "Great question! Based on your income and expenses, you could potentially save an additional $300-400 per month. Want me to break down where you can cut costs?",
            quickActions: [
                { id: 'qa1', label: 'Show breakdown', action: 'show_breakdown' },
                { id: 'qa2', label: 'Set savings goal', action: 'set_goal' },
            ],
        };
    }

    if (lowerMessage.includes('goal')) {
        return {
            response: "You have 3 active goals! Your Emergency Fund is at 55% completion - you're making excellent progress! Would you like to see detailed progress on all your goals?",
            quickActions: [
                { id: 'qa1', label: 'View all goals', action: 'navigate_goals' },
                { id: 'qa2', label: 'Add new goal', action: 'add_goal' },
            ],
        };
    }

    // Default response
    return {
        response: "I'm here to help you manage your finances better! You can ask me about your spending, budgets, savings goals, or get personalized financial advice. What would you like to know?",
        quickActions: [
            { id: 'qa1', label: 'Analyze my spending', action: 'analyze_spending' },
            { id: 'qa2', label: 'Budget tips', action: 'budget_tips' },
            { id: 'qa3', label: 'Savings advice', action: 'savings_advice' },
        ],
    };
};

// Utility function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * INTEGRATION GUIDE:
 * 
 * To integrate your ML models:
 * 1. Replace the mock functions above with actual API calls to your model endpoints
 * 2. Keep the same function signatures (input/output types)
 * 3. Handle errors appropriately with try-catch blocks
 * 4. Consider adding caching for frequently called predictions
 * 
 * Example integration:
 * 
 * export const classifyTransaction = async (transaction: Partial<Transaction>) => {
 *   try {
 *     const response = await fetch('YOUR_ML_API_ENDPOINT/classify', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ description: transaction.description }),
 *     });
 *     const data = await response.json();
 *     return { category: data.category, confidence: data.confidence };
 *   } catch (error) {
 *     console.error('Classification error:', error);
 *     return { category: 'other', confidence: 0.5 };
 *   }
 * };
 */
