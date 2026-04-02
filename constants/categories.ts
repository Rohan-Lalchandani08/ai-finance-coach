/**
 * Category icons and colors for the app
 * Uses Ionicons from @expo/vector-icons for stylish vector icons
 */
import { TransactionCategory } from '../types';

export interface CategoryIconConfig {
    name: string; // Ionicons icon name
    color: string;
}

export const CATEGORY_ICON_CONFIGS: Record<TransactionCategory, CategoryIconConfig> = {
    food: { name: 'fast-food', color: '#F59E0B' },
    transport: { name: 'car', color: '#3B82F6' },
    shopping: { name: 'bag-handle', color: '#EC4899' },
    entertainment: { name: 'film', color: '#8B5CF6' },
    bills: { name: 'receipt', color: '#EF4444' },
    health: { name: 'medkit', color: '#10B981' },
    education: { name: 'school', color: '#6366F1' },
    savings: { name: 'wallet', color: '#14B8A6' },
    investment: { name: 'trending-up', color: '#2563EB' },
    groceries: { name: 'basket', color: '#16A34A' },
    travel: { name: 'airplane', color: '#0EA5E9' },
    personal_care: { name: 'sparkles', color: '#D946EF' },
    maintenance: { name: 'construct', color: '#F97316' },
    salary: { name: 'briefcase', color: '#10B981' },
    other: { name: 'cube-outline', color: '#6B7280' },
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
    food: '#F59E0B',
    transport: '#3B82F6',
    shopping: '#EC4899',
    entertainment: '#8B5CF6',
    bills: '#EF4444',
    health: '#10B981',
    education: '#6366F1',
    savings: '#14B8A6',
    investment: '#2563EB',
    groceries: '#16A34A',
    travel: '#0EA5E9',
    personal_care: '#D946EF',
    maintenance: '#F97316',
    salary: '#10B981',
    other: '#6B7280',
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
    food: 'Food & Dining',
    transport: 'Transportation',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills & Utilities',
    health: 'Healthcare',
    education: 'Education',
    savings: 'Savings',
    investment: 'Investment',
    groceries: 'Groceries',
    travel: 'Travel',
    personal_care: 'Personal Care',
    maintenance: 'Maintenance',
    salary: 'Salary',
    other: 'Other',
};

/**
 * Get category icon config (name + color) for use with <Ionicons>
 */
export function getCategoryIconConfig(category: TransactionCategory): CategoryIconConfig {
    return CATEGORY_ICON_CONFIGS[category] || CATEGORY_ICON_CONFIGS.other;
}

/**
 * Get category color
 */
export function getCategoryColor(category: TransactionCategory): string {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
}

/**
 * Get category label
 */
export function getCategoryLabel(category: TransactionCategory): string {
    return CATEGORY_LABELS[category] || 'Other';
}

/**
 * All categories array
 */
export const ALL_CATEGORIES: TransactionCategory[] = [
    'food',
    'transport',
    'shopping',
    'entertainment',
    'bills',
    'health',
    'education',
    'savings',
    'investment',
    'groceries',
    'travel',
    'personal_care',
    'maintenance',
    'salary',
    'other',
];

/**
 * Expense categories only
 */
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
    'food',
    'transport',
    'shopping',
    'entertainment',
    'bills',
    'health',
    'education',
    'groceries',
    'travel',
    'personal_care',
    'maintenance',
    'other',
];

/**
 * Income categories only
 */
export const INCOME_CATEGORIES: TransactionCategory[] = [
    'salary',
    'savings',
    'investment',
    'other',
];
