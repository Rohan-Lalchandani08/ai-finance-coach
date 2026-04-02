import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';

interface BarChartProps {
    data: {
        labels: string[];
        datasets: { data: number[] }[];
    };
    title?: string;
}

const { width } = Dimensions.get('window');

export const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const { theme } = useTheme();

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => theme.colors.primary,
        labelColor: (opacity = 1) => theme.colors.textSecondary,
        style: {
            borderRadius: 16,
        },
        propsForBackgroundLines: {
            strokeDasharray: '', // Solid lines
            stroke: theme.colors.border,
            strokeWidth: 1,
        },
        barPercentage: 0.7,
    };

    return (
        <View style={styles.container}>
            {title && (
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            )}
            <RNBarChart
                data={data}
                width={width - 60}
                height={220}
                yAxisLabel="₹"
                yAxisSuffix=""
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                fromZero
                showValuesOnTopOfBars={false}
                style={styles.chart}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    chart: {
        borderRadius: 16,
    },
});
