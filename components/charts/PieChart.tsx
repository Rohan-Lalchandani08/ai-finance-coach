import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';

interface PieChartData {
    name: string;
    amount: number;
    color: string;
    legendFontColor?: string;
    legendFontSize?: number;
}

interface PieChartProps {
    data: PieChartData[];
    title?: string;
}

const { width } = Dimensions.get('window');

export const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
    const { theme } = useTheme();

    const chartData = data.map((item) => ({
        ...item,
        legendFontColor: theme.colors.textPrimary,
        legendFontSize: 12,
    }));

    const chartConfig = {
        color: (opacity = 1) => theme.colors.primary,
        labelColor: (opacity = 1) => theme.colors.textPrimary,
    };

    return (
        <View style={styles.container}>
            {title && (
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            )}
            <RNPieChart
                data={chartData}
                width={width - 80}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
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
        marginBottom: 16,
    },
});
