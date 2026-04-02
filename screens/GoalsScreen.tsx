import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
    Modal, TextInput, KeyboardAvoidingView, Platform, Pressable, PanResponder, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/currency';

const GOAL_CATEGORIES = ['savings', 'debt', 'purchase', 'investment'] as const;
const CHALLENGE_TYPES = ['spending', 'saving', 'learning'] as const;
const CHALLENGE_ICONS = ['🎯', '💪', '🔥', '💰', '📚', '🏆', '⚡', '🌟'];

/* ─────────────────────────────────────────────────────────────────
   BottomSheet — slides up, closes by swiping down OR tapping outside
───────────────────────────────────────────────────────────────── */
interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    bgColor: string;
    children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, bgColor, children }) => {
    const sheetY = useRef(new Animated.Value(0)).current;

    // Reset position every time the sheet opens
    useEffect(() => {
        if (visible) sheetY.setValue(0);
    }, [visible]);

    const dismiss = () => {
        Animated.timing(sheetY, { toValue: 700, duration: 220, useNativeDriver: true }).start(() => {
            sheetY.setValue(0);
            onClose();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            // Only capture downward vertical drags
            onMoveShouldSetPanResponder: (_, gs) =>
                gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) sheetY.setValue(gs.dy);
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 120 || gs.vy > 0.6) {
                    // Swipe was far/fast enough — slide out
                    dismiss();
                } else {
                    // Snap back
                    Animated.spring(sheetY, {
                        toValue: 0, tension: 100, friction: 10, useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={dismiss}>
            <Pressable style={styles.overlay} onPress={dismiss} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
                <Animated.View
                    style={[styles.sheet, { backgroundColor: bgColor, transform: [{ translateY: sheetY }] }]}
                    {...panResponder.panHandlers}
                >
                    {/* Drag handle */}
                    <View style={styles.sheetHandle} />
                    {children}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

/* ─────────────────────────────────────────────────────────────────
   GoalsScreen
───────────────────────────────────────────────────────────────── */
const GoalsScreen = () => {
    const { theme } = useTheme();
    const { goals, challenges, habitStreak, addGoal, addChallenge, updateGoal, updateChallenge, reorderGoals, deleteGoal, deleteChallenge, clearCompletedChallenges, clearAchievedGoals } = useData();

    const [selectedTab, setSelectedTab] = useState<'goals' | 'challenges'>('goals');
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showChallengeModal, setShowChallengeModal] = useState(false);

    // Goal form
    const [gTitle, setGTitle] = useState('');
    const [gDesc, setGDesc] = useState('');
    const [gTarget, setGTarget] = useState('');
    const [gSaved, setGSaved] = useState('');
    const [gDays, setGDays] = useState('90');
    const [gCategory, setGCategory] = useState<typeof GOAL_CATEGORIES[number]>('savings');

    // Challenge form
    const [cTitle, setCTitle] = useState('');
    const [cDesc, setCDesc] = useState('');
    const [cMode, setCMode] = useState<'amount' | 'days'>('days');
    const [cTarget, setCTarget] = useState(''); // ₹ or days count
    const [cDays, setCDays] = useState('30'); // duration
    const [cType, setCType] = useState<typeof CHALLENGE_TYPES[number]>('saving');
    const [cIcon, setCIcon] = useState('🎯');
    const [cRewardGoalId, setCRewardGoalId] = useState('');

    // Add/log modals
    const [addFundsGoal, setAddFundsGoal] = useState<any>(null);
    const [fundsAmount, setFundsAmount] = useState('');
    const [logChallenge, setLogChallenge] = useState<any>(null);
    const [logAmount, setLogAmount] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'goal' | 'challenge', title: string } | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, [selectedTab]);

    // Sort goals by priority (1 = highest)
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).sort((a, b) => a.priority - b.priority);
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).sort((a, b) => a.priority - b.priority);
    const activeChallenges = challenges.filter(c => !c.completed);
    const completedChallenges = challenges.filter(c => c.completed);

    const moveGoal = (id: string, direction: 'up' | 'down') => {
        const sorted = [...activeGoals];
        const idx = sorted.findIndex(g => g.id === id);
        if (direction === 'up' && idx > 0) {
            [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
        } else if (direction === 'down' && idx < sorted.length - 1) {
            [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
        }
        reorderGoals(sorted.map(g => g.id));
    };

    const getDaysLeft = (deadline: Date) => {
        const diff = new Date(deadline).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 86400000));
    };

    const confirmDeleteGoal = (id: string, title: string) => {
        setDeleteTarget({ id, type: 'goal', title });
    };

    const confirmDeleteChallenge = (id: string, title: string) => {
        setDeleteTarget({ id, type: 'challenge', title });
    };

    const handleSaveGoal = () => {
        if (!gTitle.trim() || !gTarget) return;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + parseInt(gDays || '90', 10));
        addGoal({ title: gTitle.trim(), description: gDesc.trim(), targetAmount: parseFloat(gTarget), currentAmount: parseFloat(gSaved) || 0, deadline, category: gCategory });
        setShowGoalModal(false);
        setGTitle(''); setGDesc(''); setGTarget(''); setGSaved(''); setGDays('90'); setGCategory('savings');
    };

    const handleSaveChallenge = () => {
        if (!cTitle.trim() || !cTarget) return;
        const startDate = new Date();
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + parseInt(cDays || '30', 10));
        addChallenge({
            title: cTitle.trim(),
            description: cDesc.trim(),
            type: cType,
            challengeMode: cMode,
            targetAmount: cMode === 'amount' ? parseFloat(cTarget) : undefined,
            savedAmount: cMode === 'amount' ? 0 : undefined,
            targetDays: cMode === 'days' ? parseInt(cTarget, 10) : undefined,
            daysCompleted: cMode === 'days' ? 0 : undefined,
            lastDayLogged: cMode === 'days' ? '' : undefined,
            startDate,
            deadline,
            icon: cIcon,
            rewardGoalId: cRewardGoalId || undefined,
        });
        setShowChallengeModal(false);
        setCTitle(''); setCDesc(''); setCTarget(''); setCDays('30'); setCType('saving'); setCIcon('🎯'); setCRewardGoalId(''); setCMode('days');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* ── DELETE CONFIRMATION MODAL ── */}
            <Modal transparent visible={!!deleteTarget} animationType="fade">
                <View style={styles.deleteOverlay}>
                    <View style={[styles.deleteCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <View style={styles.deleteIconBg}>
                            <Ionicons name="warning" size={32} color="#EF4444" />
                        </View>
                        <Text style={[styles.deleteTitle, { color: theme.colors.textPrimary }]}>
                            {deleteTarget?.type === 'goal' ? 'Delete Goal' : 'Delete Challenge'}
                        </Text>
                        <Text style={[styles.deleteDesc, { color: theme.colors.textSecondary }]}>
                            Are you sure you want to permanently delete "{deleteTarget?.title}"? This action cannot be undone.
                        </Text>
                        <View style={styles.deleteBtns}>
                            <TouchableOpacity style={[styles.deleteCancelBtn, { backgroundColor: theme.colors.background }]} onPress={() => setDeleteTarget(null)}>
                                <Text style={[styles.deleteBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.deleteConfirmBtn]} onPress={() => {
                                if (deleteTarget?.type === 'goal') deleteGoal(deleteTarget.id);
                                else if (deleteTarget?.type === 'challenge') deleteChallenge(deleteTarget.id);
                                setDeleteTarget(null);
                            }}>
                                <Text style={[styles.deleteBtnText, { color: '#fff' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── ADD FUNDS MODAL ── */}
            <BottomSheet visible={!!addFundsGoal} onClose={() => { setAddFundsGoal(null); setFundsAmount(''); }} bgColor={theme.colors.surface}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Add Funds</Text>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Amount to add (₹)</Text>
                <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="500" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" value={fundsAmount} onChangeText={setFundsAmount} />
                <TouchableOpacity onPress={() => {
                    if (addFundsGoal && fundsAmount) {
                        updateGoal(addFundsGoal.id, addFundsGoal.currentAmount + parseFloat(fundsAmount));
                        setAddFundsGoal(null);
                        setFundsAmount('');
                    }
                }} disabled={!fundsAmount}>
                    <LinearGradient colors={[theme.colors.primary, theme.colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.saveBtn, { opacity: fundsAmount ? 1 : 0.5 }]}>
                        <Text style={styles.saveBtnText}>Save Progress</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </BottomSheet>

            {/* ── LOG ACTION MODAL ── */}
            <BottomSheet visible={!!logChallenge} onClose={() => { setLogChallenge(null); setLogAmount(''); }} bgColor={theme.colors.surface}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                    {logChallenge?.challengeMode === 'amount' ? 'Add Saved Amount' : "Log Today's Day"}
                </Text>
                {logChallenge?.challengeMode === 'amount' ? (
                    <>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Amount saved / avoided (₹)</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                            placeholder="500" placeholderTextColor={theme.colors.textTertiary}
                            keyboardType="numeric" value={logAmount} onChangeText={setLogAmount}
                        />
                        <TouchableOpacity onPress={() => { if (logChallenge && logAmount) { updateChallenge(logChallenge.id, parseFloat(logAmount)); setLogChallenge(null); setLogAmount(''); } }} disabled={!logAmount}>
                            <LinearGradient colors={['#F97316', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.saveBtn, { opacity: logAmount ? 1 : 0.5 }]}>
                                <Text style={styles.saveBtnText}>Save Progress</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
                            Mark today as a completed day. You can only log once per day.
                        </Text>
                        {logChallenge?.lastDayLogged === new Date().toISOString().slice(0, 10) ? (
                            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                                <Text style={{ color: '#10B981', fontWeight: '700', marginTop: 8 }}>Already logged today!</Text>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => { updateChallenge(logChallenge.id, 1); setLogChallenge(null); }}>
                                <LinearGradient colors={['#F97316', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                                    <Text style={styles.saveBtnText}>Mark Today as Done ✔</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </BottomSheet>

            {/* ── GOAL CREATION MODAL ── */}
            <BottomSheet visible={showGoalModal} onClose={() => setShowGoalModal(false)} bgColor={theme.colors.surface}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>New Goal 🎯</Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Goal Title *</Text>
                <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="e.g. Emergency Fund" placeholderTextColor={theme.colors.textTertiary} value={gTitle} onChangeText={setGTitle} />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
                <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="Why is this goal important?" placeholderTextColor={theme.colors.textTertiary} value={gDesc} onChangeText={setGDesc} />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Target (₹) *</Text>
                        <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="100000" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" value={gTarget} onChangeText={setGTarget} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Saved so far (₹)</Text>
                        <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="0" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" value={gSaved} onChangeText={setGSaved} />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Duration (days)</Text>
                        <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="90" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" value={gDays} onChangeText={setGDays} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {GOAL_CATEGORIES.map(cat => (
                                <TouchableOpacity key={cat} onPress={() => setGCategory(cat)} style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: gCategory === cat ? theme.colors.primary : theme.colors.background }]}>
                                    <Text style={{ color: gCategory === cat ? '#fff' : theme.colors.textSecondary, fontSize: 12, textTransform: 'capitalize' }}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <TouchableOpacity onPress={handleSaveGoal} disabled={!gTitle.trim() || !gTarget}>
                    <LinearGradient colors={[theme.colors.primary, theme.colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.saveBtn, { opacity: gTitle.trim() && gTarget ? 1 : 0.5 }]}>
                        <Text style={styles.saveBtnText}>Create Goal</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </BottomSheet>

            {/* ── CHALLENGE CREATION MODAL ── */}
            <BottomSheet visible={showChallengeModal} onClose={() => setShowChallengeModal(false)} bgColor={theme.colors.surface}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>New Challenge 🔥</Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Pick an Icon</Text>
                <View style={styles.iconRow}>
                    {CHALLENGE_ICONS.map(ic => (
                        <TouchableOpacity key={ic} onPress={() => setCIcon(ic)} style={[styles.iconBtn, { borderColor: ic === cIcon ? theme.colors.primary : theme.colors.border, backgroundColor: ic === cIcon ? theme.colors.primary + '20' : theme.colors.background }]}>
                            <Text style={{ fontSize: 22 }}>{ic}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Challenge Title *</Text>
                <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="e.g. No Takeaway Week" placeholderTextColor={theme.colors.textTertiary} value={cTitle} onChangeText={setCTitle} />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
                <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="What's the challenge about?" placeholderTextColor={theme.colors.textTertiary} value={cDesc} onChangeText={setCDesc} />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Type</Text>
                <View style={[styles.row, { marginBottom: 12 }]}>
                    {CHALLENGE_TYPES.map(t => (
                        <TouchableOpacity key={t} onPress={() => setCType(t)} style={[styles.pill, { flex: 1, marginRight: 6, justifyContent: 'center', borderColor: theme.colors.border, backgroundColor: cType === t ? theme.colors.primary : theme.colors.background }]}>
                            <Text style={{ color: cType === t ? '#fff' : theme.colors.textSecondary, fontSize: 13, textTransform: 'capitalize', textAlign: 'center' }}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Track Mode */}
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Track by</Text>
                <View style={[styles.row, { marginBottom: 12 }]}>
                    {(['amount', 'days'] as const).map(m => (
                        <TouchableOpacity key={m} onPress={() => setCMode(m)} style={[styles.pill, { flex: 1, marginRight: 6, justifyContent: 'center', borderColor: theme.colors.border, backgroundColor: cMode === m ? '#10B981' : theme.colors.background }]}>
                            <Text style={{ color: cMode === m ? '#fff' : theme.colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                                {m === 'amount' ? '₹ Amount' : '📅 Days'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                            {cMode === 'amount' ? 'Target Amount (₹) *' : 'Number of Days *'}
                        </Text>
                        <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder={cMode === 'amount' ? '5000' : '21'} placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" value={cTarget} onChangeText={setCTarget} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Duration (days)</Text>
                        <TextInput style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]} placeholder="30" placeholderTextColor={theme.colors.textTertiary} keyboardType="numeric" value={cDays} onChangeText={setCDays} />
                    </View>
                </View>

                {/* Reward goal selector */}
                {cMode === 'amount' && parseFloat(cTarget) > 0 && activeGoals.length > 0 && (
                    <>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Deposit reward into goal</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                            <TouchableOpacity onPress={() => setCRewardGoalId('')} style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: !cRewardGoalId ? '#10B98120' : theme.colors.background }]}>
                                <Text style={{ color: !cRewardGoalId ? '#10B981' : theme.colors.textSecondary, fontSize: 12 }}>🏆 Top Priority</Text>
                            </TouchableOpacity>
                            {activeGoals.map(g => (
                                <TouchableOpacity key={g.id} onPress={() => setCRewardGoalId(g.id)} style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: cRewardGoalId === g.id ? theme.colors.primary + '20' : theme.colors.background }]}>
                                    <Text style={{ color: cRewardGoalId === g.id ? theme.colors.primary : theme.colors.textSecondary, fontSize: 12 }}>{g.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                <TouchableOpacity onPress={handleSaveChallenge} disabled={!cTitle.trim() || !cTarget}>
                    <LinearGradient colors={['#F97316', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.saveBtn, { opacity: cTitle.trim() && cTarget ? 1 : 0.5 }]}>
                        <Text style={styles.saveBtnText}>Create Challenge</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </BottomSheet>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Goals & Challenges</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Track your financial journey</Text>
                </View>

                {/* Streak */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Card variant="gradient" style={styles.streakCard}>
                        <View style={styles.streakContent}>
                            <Ionicons name="flame" size={52} color="#F97316" />
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={[styles.streakTitle, { color: theme.colors.textInverse }]}>{habitStreak.currentStreak} Day Streak!</Text>
                                <Text style={[styles.streakSubtitle, { color: theme.colors.textInverse }]}>Longest: {habitStreak.longestStreak} days</Text>
                            </View>
                        </View>
                        <View style={styles.milestoneContainer}>
                            {habitStreak.milestones.map((m, i) => (
                                <View key={i} style={styles.milestoneItem}>
                                    <View style={[styles.milestoneCircle, { backgroundColor: m.achieved ? theme.colors.textInverse : 'rgba(255,255,255,0.3)' }]}>
                                        <Text style={[styles.milestoneText, { color: m.achieved ? theme.colors.primary : theme.colors.textInverse }]}>{m.days}</Text>
                                    </View>
                                    {i < habitStreak.milestones.length - 1 && (
                                        <View style={[styles.milestoneLine, { backgroundColor: m.achieved ? theme.colors.textInverse : 'rgba(255,255,255,0.3)' }]} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </Card>
                </Animated.View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    {(['goals', 'challenges'] as const).map(tab => (
                        <TouchableOpacity key={tab} style={[styles.tab, { backgroundColor: selectedTab === tab ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => setSelectedTab(tab)}>
                            <Text style={[styles.tabText, { color: selectedTab === tab ? theme.colors.textInverse : theme.colors.textSecondary, fontWeight: selectedTab === tab ? '600' : '400' }]}>
                                {tab === 'goals' ? `Goals (${activeGoals.length})` : `Challenges (${activeChallenges.length})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* GOALS */}
                {selectedTab === 'goals' && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {activeGoals.map(goal => {
                            const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
                            const daysLeft = getDaysLeft(goal.deadline);
                            const nextMs = goal.milestones.find(m => !m.completed);
                            return (
                                <Card key={goal.id} style={styles.goalCard}>
                                    <View style={styles.goalHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.goalTitle, { color: theme.colors.textPrimary }]}>{goal.title}</Text>
                                            {!!goal.description && <Text style={[styles.goalDescription, { color: theme.colors.textSecondary }]}>{goal.description}</Text>}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Badge variant="primary" size="small">{goal.category}</Badge>
                                            <TouchableOpacity onPress={() => confirmDeleteGoal(goal.id, goal.title)} style={styles.deleteBtn}>
                                                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.goalProgress}>
                                        <View style={styles.goalAmounts}>
                                            <Text style={[styles.currentAmount, { color: theme.colors.primary }]}>{formatCurrency(goal.currentAmount)}</Text>
                                            <Text style={[styles.targetAmount, { color: theme.colors.textSecondary }]}> of {formatCurrency(goal.targetAmount)}</Text>
                                        </View>
                                        <Text style={[styles.percentage, { color: theme.colors.primary }]}>{(progress * 100).toFixed(0)}%</Text>
                                    </View>
                                    <ProgressBar progress={progress} style={{ marginBottom: 12 }} />

                                    {/* Priority & Actions */}
                                    <View style={styles.priorityRow}>
                                        <View style={styles.priorityBadge}>
                                            <Ionicons name="flag" size={12} color={theme.colors.primary} />
                                            <Text style={[styles.priorityText, { color: theme.colors.primary }]}>Priority #{goal.priority}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                            <TouchableOpacity onPress={() => moveGoal(goal.id, 'up')} style={[styles.arrowBtn, { borderColor: theme.colors.border }]} disabled={goal.priority === 1}>
                                                <Ionicons name="chevron-up" size={16} color={goal.priority === 1 ? theme.colors.textTertiary : theme.colors.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => moveGoal(goal.id, 'down')} style={[styles.arrowBtn, { borderColor: theme.colors.border }]} disabled={goal.priority === activeGoals.length}>
                                                <Ionicons name="chevron-down" size={16} color={goal.priority === activeGoals.length ? theme.colors.textTertiary : theme.colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.primary + '30', backgroundColor: theme.colors.primary + '10' }]} onPress={() => setAddFundsGoal(goal)}>
                                        <Ionicons name="add" size={16} color={theme.colors.primary} />
                                        <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Add Funds</Text>
                                    </TouchableOpacity>

                                    <View style={styles.goalFooter}>
                                        <View>
                                            <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Next Milestone</Text>
                                            <Text style={[styles.footerValue, { color: theme.colors.textPrimary }]}>{nextMs ? nextMs.title : '—'}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.footerLabel, { color: theme.colors.textSecondary }]}>Time Left</Text>
                                            <Text style={[styles.footerValue, { color: theme.colors.textPrimary }]}>{daysLeft} days</Text>
                                        </View>
                                    </View>
                                </Card>
                            );
                        })}

                        {completedGoals.length > 0 && (
                            <>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 0, color: theme.colors.textPrimary }]}>Achieved 🏆</Text>
                                    <TouchableOpacity onPress={() => clearAchievedGoals()}>
                                        <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: '600' }}>Clear All</Text>
                                    </TouchableOpacity>
                                </View>
                                {completedGoals.map(g => (
                                    <Card key={g.id} style={{ ...styles.goalCard, opacity: 0.8 }}>
                                        <View style={styles.goalHeader}>
                                            <Text style={[styles.goalTitle, { color: theme.colors.textSecondary, textDecorationLine: 'line-through', flex: 1 }]}>{g.title}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <Badge variant="success" size="small">✓ Done</Badge>
                                                <TouchableOpacity onPress={() => confirmDeleteGoal(g.id, g.title)}>
                                                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Card>
                                ))}
                            </>
                        )}

                        <TouchableOpacity onPress={() => setShowGoalModal(true)}>
                            <LinearGradient colors={[theme.colors.primary + '18', theme.colors.primary + '08']} style={[styles.addBtn, { borderColor: theme.colors.primary + '50' }]}>
                                <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
                                <Text style={[styles.addBtnText, { color: theme.colors.primary }]}>Add New Goal</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* CHALLENGES */}
                {selectedTab === 'challenges' && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Active Challenges</Text>
                        {activeChallenges.length === 0 && <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No active challenges yet. Create one! 💪</Text>}

                        {activeChallenges.map(c => {
                            const progress = c.challengeMode === 'amount'
                                ? Math.min((c.savedAmount ?? 0) / (c.targetAmount ?? 1), 1)
                                : Math.min((c.daysCompleted ?? 0) / (c.targetDays ?? 1), 1);
                            const progressLabel = c.challengeMode === 'amount'
                                ? `${formatCurrency(c.savedAmount ?? 0)} / ${formatCurrency(c.targetAmount ?? 0)}`
                                : `${c.daysCompleted ?? 0} / ${c.targetDays ?? 0} days`;
                            const daysLeft = getDaysLeft(c.deadline);
                            const alreadyLoggedToday = c.challengeMode === 'days' && c.lastDayLogged === new Date().toISOString().slice(0, 10);
                            return (
                                <Card key={c.id} style={styles.challengeCard}>
                                    <View style={styles.challengeHeader}>
                                        <Text style={{ fontSize: 32 }}>{c.icon}</Text>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.challengeTitle, { color: theme.colors.textPrimary }]}>{c.title}</Text>
                                            {!!c.description && <Text style={[styles.challengeDescription, { color: theme.colors.textSecondary }]}>{c.description}</Text>}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            {(c.currentStreak ?? 0) > 0 && (
                                                <View style={[styles.rewardBadge, { backgroundColor: '#F9731615', marginLeft: 8 }]}>
                                                    <Text style={[styles.rewardAmount, { color: '#F97316' }]}>🔥 {c.currentStreak}</Text>
                                                </View>
                                            )}
                                            <TouchableOpacity onPress={() => confirmDeleteChallenge(c.id, c.title)}>
                                                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.challengeProgress}>
                                        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>{progressLabel}</Text>
                                        <Text style={[styles.daysLeft, { color: theme.colors.textSecondary }]}>{daysLeft} days left</Text>
                                    </View>
                                    <ProgressBar progress={progress} color={theme.colors.warning} style={{ marginBottom: 16 }} />

                                    {alreadyLoggedToday ? (
                                        <View style={[styles.actionBtn, { borderColor: '#10B98150', backgroundColor: '#10B98112', marginBottom: 4 }]}>
                                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Today Done ✓</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.warning + '30', backgroundColor: theme.colors.warning + '10', marginBottom: 4 }]} onPress={() => setLogChallenge(c)}>
                                            <Ionicons name="add" size={16} color={theme.colors.warning} />
                                            <Text style={[styles.actionBtnText, { color: theme.colors.warning }]}>
                                                {c.challengeMode === 'amount' ? 'Add Amount' : 'Log Today'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    {c.challengeMode === 'amount' && (c.targetAmount ?? 0) > 0 && (
                                        <View style={styles.rewardHint}>
                                            <Ionicons name="gift-outline" size={12} color="#10B981" />
                                            <Text style={styles.rewardHintText}>
                                                {formatCurrency(c.targetAmount ?? 0)} saved → {c.rewardGoalId ? goals.find(g => g.id === c.rewardGoalId)?.title ?? 'Linked Goal' : 'Top Priority Goal'} on completion
                                            </Text>
                                        </View>
                                    )}
                                    
                                    {/* Recent History */}
                                    {(c.history?.length ?? 0) > 0 && (
                                        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border + '60', paddingTop: 12 }}>
                                            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Recent Logs</Text>
                                            {[...(c.history || [])].reverse().slice(0, 3).map((log, idx) => {
                                                const logDate = new Date(log.date);
                                                const dateStr = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                const isToday = logDate.toDateString() === new Date().toDateString();
                                                const amountStr = c.challengeMode === 'amount' ? `+${formatCurrency(log.amountLogged)}` : 'Done ✓';
                                                
                                                return (
                                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                                                            {isToday ? 'Today' : dateStr}
                                                        </Text>
                                                        <Text style={{ color: c.challengeMode === 'amount' ? theme.colors.primary : '#10B981', fontSize: 12, fontWeight: '600' }}>
                                                            {amountStr}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </Card>
                            );
                        })}

                        {completedChallenges.length > 0 && (
                            <>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 0, color: theme.colors.textPrimary }]}>Completed 🎉</Text>
                                    <TouchableOpacity onPress={() => clearCompletedChallenges()}>
                                        <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: '600' }}>Clear All</Text>
                                    </TouchableOpacity>
                                </View>
                                {completedChallenges.map(c => (
                                    <Card key={c.id} style={{ ...styles.challengeCard, opacity: 0.8 }}>
                                        <View style={styles.challengeHeader}>
                                            <Text style={{ fontSize: 28, opacity: 0.5 }}>{c.icon}</Text>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={[styles.challengeTitle, { color: theme.colors.textSecondary, textDecorationLine: 'line-through' }]}>{c.title}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <Badge variant="success" size="small">✓ Done</Badge>
                                                <TouchableOpacity onPress={() => confirmDeleteChallenge(c.id, c.title)}>
                                                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Card>
                                ))}
                            </>
                        )}

                        <TouchableOpacity onPress={() => setShowChallengeModal(true)}>
                            <LinearGradient colors={['rgba(249,115,22,0.12)', 'rgba(249,115,22,0.05)']} style={[styles.addBtn, { borderColor: 'rgba(249,115,22,0.4)' }]}>
                                <Ionicons name="add-circle-outline" size={22} color="#F97316" />
                                <Text style={[styles.addBtnText, { color: '#F97316' }]}>Add New Challenge</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 50 },
    header: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
    subtitle: { fontSize: 14 },
    streakCard: { marginBottom: 20 },
    streakContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    streakTitle: { fontSize: 24, fontWeight: '700' },
    streakSubtitle: { fontSize: 14, marginTop: 4 },
    milestoneContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    milestoneItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    milestoneCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    milestoneText: { fontSize: 12, fontWeight: '700' },
    milestoneLine: { flex: 1, height: 2, marginHorizontal: 4 },
    tabContainer: { flexDirection: 'row', marginBottom: 20, gap: 12 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    tabText: { fontSize: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    emptyText: { textAlign: 'center', marginVertical: 20, fontSize: 14 },
    goalCard: { marginBottom: 16 },
    goalHeader: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
    goalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
    goalDescription: { fontSize: 13 },
    goalProgress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
    goalAmounts: { flexDirection: 'row', alignItems: 'baseline' },
    currentAmount: { fontSize: 24, fontWeight: '700' },
    targetAmount: { fontSize: 14 },
    percentage: { fontSize: 20, fontWeight: '700' },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
    footerLabel: { fontSize: 11, marginBottom: 4 },
    footerValue: { fontSize: 14, fontWeight: '600' },
    challengeCard: { marginBottom: 12 },
    challengeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    challengeTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    challengeDescription: { fontSize: 13 },
    rewardBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 20 },
    rewardAmount: { fontSize: 14, fontWeight: '700' },
    challengeProgress: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { fontSize: 13 },
    daysLeft: { fontSize: 13 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', paddingVertical: 16, marginTop: 4 },
    addBtnText: { fontSize: 15, fontWeight: '600' },
    deleteBtn: { padding: 4, opacity: 0.8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
    actionBtnText: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
    priorityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.1)' },
    priorityText: { fontSize: 12, fontWeight: '600' },
    arrowBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    rewardHint: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#10B98110', borderRadius: 8, marginBottom: 4 },
    rewardHintText: { fontSize: 11, color: '#10B981', flex: 1 },

    /* Bottom Sheet */
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalWrap: { flex: 1, justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
    input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, marginRight: 6, marginBottom: 6 },
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    iconBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    saveBtn: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 52, marginTop: 16 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    
    /* Delete Modal */
    deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    deleteCard: { width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1 },
    deleteIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    deleteTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    deleteDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    deleteBtns: { flexDirection: 'row', gap: 12, width: '100%' },
    deleteCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    deleteConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#EF4444' },
    deleteBtnText: { fontSize: 15, fontWeight: '600' },
});

export default GoalsScreen;
