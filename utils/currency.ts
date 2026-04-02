/**
 * Currency formatting utilities for Indian Rupee (₹)
 */

/**
 * Formats a number as Indian currency with ₹ symbol
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted currency string (e.g., "₹1,23,456")
 */
export function formatCurrency(amount: number, showDecimals: boolean = false): string {
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: showDecimals ? 2 : 0,
        minimumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);

    return formatted;
}

/**
 * Formats amount without currency symbol
 * Useful for input fields
 */
export function formatAmount(amount: number, showDecimals: boolean = false): string {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: showDecimals ? 2 : 0,
        minimumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
}

/**
 * Parses Indian formatted number string to number
 * Handles: "1,23,456", "1,23,456.50", "₹1,23,456"
 */
export function parseCurrency(value: string): number {
    // Remove currency symbol and spaces
    const cleaned = value.replace(/[₹\s]/g, '').replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats amount in words (Indian system)
 * e.g., 150000 => "1.5 Lakh", 1500000 => "15 Lakh", 10000000 => "1 Crore"
 */
export function formatAmountInWords(amount: number): string {
    const absAmount = Math.abs(amount);

    if (absAmount >= 10000000) {
        // Crores
        return `${(absAmount / 10000000).toFixed(1)} Cr`;
    } else if (absAmount >= 100000) {
        // Lakhs
        return `${(absAmount / 100000).toFixed(1)} L`;
    } else if (absAmount >= 1000) {
        // Thousands
        return `${(absAmount / 1000).toFixed(1)} K`;
    }

    return formatAmount(absAmount);
}

/**
 * Get currency symbol
 */
export const CURRENCY_SYMBOL = '₹';

/**
 * Validates amount input
 */
export function isValidAmount(value: string): boolean {
    const cleaned = value.replace(/[₹,\s]/g, '');
    return /^\d+(\.\d{0,2})?$/.test(cleaned);
}

/**
 * Format amount for display with sign
 */
export function formatSignedAmount(amount: number, type: 'income' | 'expense'): string {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(amount))}`;
}
