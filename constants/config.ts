/**
 * App configuration constants
 */

export const APP_CONFIG = {
    APP_NAME: 'Finance Coach',
    APP_VERSION: '1.0.0',
    CURRENCY: 'INR',
    CURRENCY_SYMBOL: '₹',
    LOCALE: 'en-IN',
    TIMEZONE: 'Asia/Kolkata',
};

export const STORAGE_KEYS = {
    TRANSACTIONS: '@finance_coach_transactions',
    BUDGETS: '@finance_coach_budgets',
    GOALS: '@finance_coach_goals',
    CHALLENGES: '@finance_coach_challenges',
    HABIT_STREAK: '@finance_coach_habit_streak',
    THEME: '@finance_coach_theme',
    USER_PROFILE: '@finance_coach_user_profile',
    SETTINGS: '@finance_coach_settings',
    ONBOARDING_COMPLETE: '@finance_coach_onboarding_complete',
};

export const API_CONFIG = {
    // For future backend integration
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.financecoach.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
};

export const FEATURE_FLAGS = {
    UPI_NOTIFICATION_CAPTURE: true,
    STATEMENT_PARSING: true,
    BIOMETRIC_AUTH: false, // To be implemented
    CLOUD_SYNC: false, // To be implemented with backend
};

export const LIMITS = {
    MAX_TRANSACTIONS_PER_IMPORT: 1000,
    MAX_FILE_SIZE_MB: 10,
    MAX_CATEGORIES: 50,
    MAX_BUDGETS: 20,
};

export const UPI_APPS = [
    { id: 'gpay', name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user' },
    { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app' },
    { id: 'paytm', name: 'Paytm', packageName: 'net.one97.paytm' },
    { id: 'bhim', name: 'BHIM', packageName: 'in.org.npci.upiapp' },
    { id: 'amazonpay', name: 'Amazon Pay', packageName: 'in.amazon.mShop.android.shopping' },
];

export const SUPPORTED_BANKS = [
    'HDFC Bank',
    'State Bank of India',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'IDFC First Bank',
    'Yes Bank',
    'IndusInd Bank',
];
