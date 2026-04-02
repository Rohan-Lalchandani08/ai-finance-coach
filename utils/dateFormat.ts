/**
 * Date formatting utilities for Indian timezone
 */
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

/**
 * Format date for display
 * @param date - Date to format
 * @param formatStr - Format string (default: 'dd MMM yyyy')
 */
export function formatDate(date: Date | string, formatStr: string = 'dd MMM yyyy'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMM yyyy, hh:mm a');
}

/**
 * Format date for transaction display
 * Shows "Today", "Yesterday", or date
 */
export function formatTransactionDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isToday(dateObj)) {
        return 'Today';
    }

    if (isYesterday(dateObj)) {
        return 'Yesterday';
    }

    if (isThisWeek(dateObj)) {
        return format(dateObj, 'EEEE'); // Day name
    }

    return format(dateObj, 'dd MMM yyyy');
}

/**
 * Format relative time
 * e.g., "2 hours ago", "5 minutes ago"
 */
export function formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format month and year
 */
export function formatMonthYear(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM yyyy');
}

/**
 * Get month name
 */
export function getMonthName(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM');
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'hh:mm a');
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isThisMonth(dateObj);
}

/**
 * Get greeting based on time
 */
export function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Good Morning';
    } else if (hour < 17) {
        return 'Good Afternoon';
    } else if (hour < 21) {
        return 'Good Evening';
    } else {
        return 'Good Night';
    }
}

/**
 * Format date for API (ISO string)
 */
export function formatDateForAPI(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
}

/**
 * Parse date from API
 */
export function parseDateFromAPI(dateString: string): Date {
    return new Date(dateString);
}
