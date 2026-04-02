import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Switch, Animated, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

/* ── Avatar with user initials ── */
const Avatar = ({ name, size = 80, primary }: { name: string; size?: number; primary: string }) => {
    const initials = name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <LinearGradient
            colors={[primary, primary + 'aa']}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        >
            <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
        </LinearGradient>
    );
};

/* ── Single settings row ── */
interface RowProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    label: string;
    value?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    textColor: string;
    subtextColor: string;
    borderColor: string;
}
const SettingsRow: React.FC<RowProps> = ({ icon, iconColor, label, value, onPress, right, textColor, subtextColor, borderColor }) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: borderColor }]} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
        <View style={[styles.rowIcon, { backgroundColor: iconColor + '18' }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.rowContent}>
            <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
            {value ? <Text style={[styles.rowValue, { color: subtextColor }]}>{value}</Text> : null}
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={subtextColor} /> : null)}
    </TouchableOpacity>
);

/* ── Section card ── */
const Section = ({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) => (
    <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...theme.shadows.sm }]}>
            {children}
        </View>
    </View>
);

/* ─────────────────────────────────────────────────────────────
   Profile Screen
───────────────────────────────────────────────────────────────*/
const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const { transactions, goals, challenges } = useData();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const [notificationsOn, setNotificationsOn] = useState(true);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        ]).start();
    }, []);

    /* ── Stats ── */
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    const doneChallenge = challenges.filter(c => c.completed).length;

    const formatAmt = (n: number) =>
        n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* ── Hero banner ── */}
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.gradientEnd]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroOverlay} />
                    <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Avatar name={user?.name ?? 'U'} size={88} primary="#ffffff44" />
                        <Text style={styles.heroName}>{user?.name ?? 'User'}</Text>
                        <View style={styles.heroBadge}>
                            <Ionicons name="mail-outline" size={13} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.heroEmail}>{user?.email ?? '—'}</Text>
                        </View>
                    </Animated.View>
                </LinearGradient>

                {/* ── Stats row ── */}
                <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {[
                        { label: 'Transactions', value: transactions.length.toString(), icon: 'receipt-outline' as const, color: theme.colors.primary },
                        { label: 'Tracked Income', value: formatAmt(totalIncome), icon: 'trending-up-outline' as const, color: '#10B981' },
                        { label: 'Goals Done', value: completedGoals.toString(), icon: 'trophy-outline' as const, color: '#F59E0B' },
                        { label: 'Challenges', value: doneChallenge.toString(), icon: 'flame-outline' as const, color: '#F97316' },
                    ].map(stat => (
                        <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <View style={[styles.statIcon, { backgroundColor: stat.color + '18' }]}>
                                <Ionicons name={stat.icon} size={16} color={stat.color} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* ── Preferences ── */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Section title="PREFERENCES" theme={theme}>
                        <SettingsRow
                            icon="moon-outline" iconColor={theme.colors.primary}
                            label="Dark Mode"
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                            right={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }} thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'} />}
                        />
                        <SettingsRow
                            icon="notifications-outline" iconColor="#F59E0B"
                            label="Notifications"
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                            right={<Switch value={notificationsOn} onValueChange={setNotificationsOn} trackColor={{ false: theme.colors.border, true: '#F59E0B80' }} thumbColor={notificationsOn ? '#F59E0B' : '#f4f3f4'} />}
                        />
                        <SettingsRow
                            icon="cash-outline" iconColor="#10B981"
                            label="Currency" value="₹ Indian Rupee (INR)"
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                    </Section>

                    {/* ── Account ── */}
                    <Section title="ACCOUNT" theme={theme}>
                        <SettingsRow
                            icon="person-outline" iconColor={theme.colors.primary}
                            label="Full Name" value={user?.name}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                        <SettingsRow
                            icon="mail-outline" iconColor={theme.colors.primary}
                            label="Email" value={user?.email}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                        <SettingsRow
                            icon="lock-closed-outline" iconColor="#6366F1"
                            label="Change Password"
                            onPress={() => Alert.alert('Coming Soon', 'Password change will be available after Firebase Auth integration.')}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                    </Section>

                    {/* ── Financial summary ── */}
                    <Section title="FINANCIAL SUMMARY" theme={theme}>
                        <SettingsRow
                            icon="arrow-down-circle-outline" iconColor="#10B981"
                            label="Total Income Tracked" value={formatAmt(totalIncome)}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                        <SettingsRow
                            icon="arrow-up-circle-outline" iconColor="#EF4444"
                            label="Total Expenses Tracked" value={formatAmt(totalExpenses)}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                        <SettingsRow
                            icon="save-outline" iconColor="#F59E0B"
                            label="Net Savings" value={formatAmt(totalIncome - totalExpenses)}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                    </Section>

                    {/* ── About ── */}
                    <Section title="ABOUT" theme={theme}>
                        <SettingsRow
                            icon="information-circle-outline" iconColor={theme.colors.primary}
                            label="App Version" value="1.0.0-beta"
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                        <SettingsRow
                            icon="shield-checkmark-outline" iconColor="#10B981"
                            label="Privacy Policy"
                            onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device and never shared.')}
                            textColor={theme.colors.textPrimary} subtextColor={theme.colors.textSecondary} borderColor={theme.colors.border}
                        />
                    </Section>

                    {/* ── Sign Out ── */}
                    <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { borderColor: '#EF444440', backgroundColor: '#EF44440D' }]}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
                        Made with ❤️ for smarter finances
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 40 },

    /* Hero */
    hero: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden' },
    heroOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.08)' },
    heroContent: { alignItems: 'center' },
    heroName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 14, letterSpacing: -0.3 },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    heroEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

    /* Avatar */
    avatar: { alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '800' },

    /* Stats */
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -20, gap: 10, marginBottom: 8 },
    statCard: { flex: 1, borderRadius: 16, borderWidth: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
    statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    statValue: { fontSize: 15, fontWeight: '800' },
    statLabel: { fontSize: 9.5, textAlign: 'center', fontWeight: '500' },

    /* Section */
    section: { paddingHorizontal: 16, marginTop: 24 },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
    sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

    /* Row */
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '500' },
    rowValue: { fontSize: 12, marginTop: 2 },

    /* Logout */
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 28, borderRadius: 16, borderWidth: 1.5, paddingVertical: 16 },
    logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
    footer: { textAlign: 'center', fontSize: 12, marginTop: 28 },
});

export default ProfileScreen;
