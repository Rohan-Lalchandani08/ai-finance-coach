import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    style,
}) => {
    const { theme } = useTheme();

    const getButtonHeight = () => {
        switch (size) {
            case 'small':
                return 36;
            case 'large':
                return 56;
            default:
                return 48;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small':
                return theme.typography.sm;
            case 'large':
                return theme.typography.lg;
            default:
                return theme.typography.base;
        }
    };

    const renderButton = () => {
        const content = (
            <>
                {loading ? (
                    <ActivityIndicator
                        color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.textInverse}
                    />
                ) : (
                    <>
                        {icon}
                        <Text
                            style={[
                                styles.text,
                                {
                                    color:
                                        variant === 'outline' || variant === 'ghost'
                                            ? theme.colors.primary
                                            : theme.colors.textInverse,
                                    fontSize: getFontSize(),
                                    fontWeight: theme.typography.semibold,
                                    marginLeft: icon ? theme.spacing.sm : 0,
                                },
                            ]}
                        >
                            {title}
                        </Text>
                    </>
                )}
            </>
        );

        if (variant === 'primary') {
            return (
                <TouchableOpacity
                    onPress={onPress}
                    disabled={disabled || loading}
                    activeOpacity={0.8}
                    style={[style]}
                >
                    <LinearGradient
                        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                            styles.button,
                            {
                                height: getButtonHeight(),
                                borderRadius: theme.borderRadius.md,
                                opacity: disabled ? 0.5 : 1,
                            },
                        ]}
                    >
                        {content}
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        const backgroundColor =
            variant === 'secondary'
                ? theme.colors.secondary
                : variant === 'ghost'
                    ? 'transparent'
                    : theme.colors.surface;

        const borderColor = variant === 'outline' ? theme.colors.primary : 'transparent';

        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    styles.button,
                    {
                        backgroundColor,
                        borderColor,
                        borderWidth: variant === 'outline' ? 2 : 0,
                        height: getButtonHeight(),
                        borderRadius: theme.borderRadius.md,
                        opacity: disabled ? 0.5 : 1,
                    },
                    style,
                ]}
            >
                {content}
            </TouchableOpacity>
        );
    };

    return renderButton();
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    text: {
        textAlign: 'center',
    },
});
