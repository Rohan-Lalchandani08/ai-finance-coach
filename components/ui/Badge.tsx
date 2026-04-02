import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
    children: ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'small' | 'medium';
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'medium',
    style,
}) => {
    const { theme } = useTheme();

    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary':
                return theme.colors.primary;
            case 'success':
                return theme.colors.success;
            case 'warning':
                return theme.colors.warning;
            case 'error':
                return theme.colors.error;
            default:
                return theme.colors.textTertiary;
        }
    };

    const getPadding = () => {
        return size === 'small'
            ? { paddingHorizontal: theme.spacing.sm, paddingVertical: 2 }
            : { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs };
    };

    const getFontSize = () => {
        return size === 'small' ? theme.typography.xs : theme.typography.sm;
    };

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: getBackgroundColor(),
                    borderRadius: theme.borderRadius.full,
                    ...getPadding(),
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: theme.colors.textInverse,
                        fontSize: getFontSize(),
                        fontWeight: theme.typography.semibold,
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
    },
    text: {
        textAlign: 'center',
    },
});
