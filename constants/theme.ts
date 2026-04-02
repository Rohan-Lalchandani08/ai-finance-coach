export const lightColors = {
  // Primary brand colors (Blue like Money Manager)
  primary: '#2563EB', // Royal Blue
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',

  // Secondary accent (Amber/Yellow)
  secondary: '#F59E0B', // Amber
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',

  // Success, warning, error
  success: '#10B981', // Emerald
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444', // Red
  errorLight: '#F87171',

  // Backgrounds
  background: '#F0F2F5', // Light Gray (standard app bg)
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1F2937', // Gray 900
  textSecondary: '#6B7280', // Gray 500
  textTertiary: '#9CA3AF', // Gray 400
  textInverse: '#FFFFFF',

  // Borders and dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',

  // Gradients
  gradientStart: '#2563EB',
  gradientEnd: '#4F46E5',

  // Category colors (matched to typical finance apps)
  food: '#EF4444',      // Red
  transport: '#3B82F6', // Blue
  shopping: '#EC4899',  // Pink
  entertainment: '#8B5CF6', // Purple
  bills: '#F59E0B',     // Amber
  health: '#10B981',    // Emerald
  education: '#06B6D4', // Cyan
  savings: '#14B8A6',   // Teal
  other: '#6B7280',     // Gray

  // Chart colors
  chart1: '#2563EB',
  chart2: '#F59E0B',
  chart3: '#10B981',
  chart4: '#EF4444',
  chart5: '#8B5CF6',
  chart6: '#06B6D4',
};

export const darkColors = {
  // Primary brand colors
  primary: '#3B82F6', // Lighter Blue for Dark Mode
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  // Secondary accent
  secondary: '#FBBF24',
  secondaryLight: '#FCD34D',
  secondaryDark: '#F59E0B',

  // Success, warning, error
  success: '#34D399',
  successLight: '#6EE7B7',
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  error: '#F87171',
  errorLight: '#FCA5A5',

  // Backgrounds
  background: '#111827', // Gray 900
  surface: '#1F2937', // Gray 800
  surfaceElevated: '#374151', // Gray 700

  // Text
  textPrimary: '#F9FAFB', // Gray 50
  textSecondary: '#D1D5DB', // Gray 300
  textTertiary: '#9CA3AF', // Gray 400
  textInverse: '#111827',

  // Borders and dividers
  border: '#374151',
  borderLight: '#4B5563',
  divider: '#374151',

  // Gradients
  gradientStart: '#3B82F6',
  gradientEnd: '#60A5FA',

  // Category colors
  food: '#F87171',
  transport: '#60A5FA',
  shopping: '#F472B6',
  entertainment: '#A78BFA',
  bills: '#FBBF24',
  health: '#34D399',
  education: '#22D3EE',
  savings: '#2DD4BF',
  other: '#9CA3AF',

  // Chart colors
  chart1: '#60A5FA',
  chart2: '#FBBF24',
  chart3: '#34D399',
  chart4: '#F87171',
  chart5: '#A78BFA',
  chart6: '#22D3EE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export type Colors = typeof lightColors;
export type Theme = {
  colors: Colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  isDark: boolean;
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  borderRadius,
  typography,
  shadows,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  borderRadius,
  typography,
  shadows,
  isDark: true,
};
