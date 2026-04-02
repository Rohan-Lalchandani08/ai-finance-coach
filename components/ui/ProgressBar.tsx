import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
    variant?: 'default' | 'gradient';
    color?: string;
    backgroundColor?: string;
    style?: ViewStyle;
    animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 8,
    variant = 'gradient',
    color,
    backgroundColor,
    style,
    animated = true,
}) => {
    const { theme } = useTheme();
    const progressValue = useSharedValue(0);

    useEffect(() => {
        if (animated) {
            progressValue.value = withSpring(Math.min(Math.max(progress, 0), 1), {
                damping: 15,
                stiffness: 100,
            });
        } else {
            progressValue.value = withTiming(Math.min(Math.max(progress, 0), 1), {
                duration: 0,
            });
        }
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressValue.value * 100}%`,
        };
    });

    return (
        <View
            style={[
                styles.container,
                {
                    height,
                    backgroundColor: backgroundColor || theme.colors.borderLight,
                    borderRadius: height / 2,
                },
                style,
            ]}
        >
            {variant === 'gradient' ? (
                <Animated.View style={[styles.progress, animatedStyle, { borderRadius: height / 2 }]}>
                    <LinearGradient
                        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.gradient, { borderRadius: height / 2 }]}
                    />
                </Animated.View>
            ) : (
                <Animated.View
                    style={[
                        styles.progress,
                        animatedStyle,
                        {
                            backgroundColor: color || theme.colors.primary,
                            borderRadius: height / 2,
                        },
                    ]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
    },
    gradient: {
        flex: 1,
    },
});
