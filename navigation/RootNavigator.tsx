import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import AnalyzeScreen from '../screens/AnalyzeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import CoachScreen from '../screens/CoachScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Separate navigator instances — never share between different stacks
const LoadStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const AppTab = createBottomTabNavigator();

/* ── Loading screen (shown while checking stored session) ── */
const LoadingScreen = () => {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
};

/* ── Unauthenticated flow ── */
const AuthNavigator = ({ onboardingDone }: { onboardingDone: boolean }) => (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!onboardingDone && (
            <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
);

/* ── Authenticated app tabs ── */
const AppNavigator = () => {
    const { theme } = useTheme();
    return (
        <AppTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    ...theme.shadows.lg,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textTertiary,
                tabBarLabelStyle: {
                    fontSize: theme.typography.xs,
                    fontWeight: theme.typography.semibold,
                },
            }}
        >
            <AppTab.Screen
                name="Home" component={HomeScreen}
                options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }}
            />
            <AppTab.Screen
                name="Analyze" component={AnalyzeScreen}
                options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} /> }}
            />
            <AppTab.Screen
                name="Goals" component={GoalsScreen}
                options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} /> }}
            />
            <AppTab.Screen
                name="Coach" component={CoachScreen}
                options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={size} color={color} /> }}
            />
            <AppTab.Screen
                name="Profile" component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} /> }}
            />
        </AppTab.Navigator>
    );
};

/* ─────────────────────────────────────────────────────────────
   RootNavigator — NavigationContainer stays mounted at all times.
   We swap the CHILD navigator based on auth state.
   Each child has a unique `key` so React fully remounts it on swap.
───────────────────────────────────────────────────────────────*/
const RootNavigator = () => {
    const { user, isLoading } = useAuth();
    const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

    useEffect(() => {
        AsyncStorage.getItem('@onboarding_complete').then((val) => {
            setOnboardingDone(val === 'true');
        });
    }, []);

    const appReady = !isLoading && onboardingDone !== null;

    return (
        <NavigationContainer>
            {!appReady ? (
                <LoadStack.Navigator screenOptions={{ headerShown: false }}>
                    <LoadStack.Screen name="Loading" component={LoadingScreen} />
                </LoadStack.Navigator>
            ) : user ? (
                /* key="app" forces full remount when switching from auth→app */
                <AppNavigator key="app" />
            ) : (
                /* key="auth" forces full remount when switching from app→auth */
                <AuthNavigator key="auth" onboardingDone={onboardingDone as boolean} />
            )}
        </NavigationContainer>
    );
};

export default RootNavigator;
