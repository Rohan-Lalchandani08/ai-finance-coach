import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
    children: ReactNode;
    variant?: 'default' | 'gradient' | 'glass';
    padding?: number;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding,
    style,
}) => {
    const { theme } = useTheme();

    if (variant === 'gradient') {
        return (
            <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.card,
                    {
                        borderRadius: theme.borderRadius.lg,
                        padding: padding ?? theme.spacing.lg,
                    },
                    theme.shadows.md,
                    style,
                ]}
            >
                {children}
            </LinearGradient>
        );
    }

    if (variant === 'glass') {
        return (
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: theme.borderRadius.lg,
                        borderWidth: 1,
                        borderColor: theme.isDark
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(255, 255, 255, 0.8)',
                        padding: padding ?? theme.spacing.lg,
                    },
                    theme.shadows.md,
                    style,
                ]}
            >
                {children}
            </View>
        );
    }

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: padding ?? theme.spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                },
                theme.shadows.sm,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
});
