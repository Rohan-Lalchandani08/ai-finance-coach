import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    ScrollView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const LoginScreen = ({ navigation }: any) => {
    const { login, requestPasswordReset } = useAuth();
    const { theme, isDarkMode } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');      // ← inline error
    const [successMsg, setSuccessMsg] = useState('');      // ← inline success
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const cardY = useRef(new Animated.Value(60)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;
    const errorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.spring(cardY, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const showError = (msg: string) => {
        setErrorMsg(msg);
        setSuccessMsg('');
        errorAnim.setValue(0);
        Animated.spring(errorAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setErrorMsg('');
    };

    const handleLogin = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!email.trim()) {
            showError('Please enter your email address.');
            return;
        }
        if (!password) {
            showError('Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            await login(email.trim(), password);
            // If login succeeds, RootNavigator automatically swaps to AppStack
        } catch (e: any) {
            showError(e?.message || 'Incorrect email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!email.trim()) {
            showError('Enter your email in the field above, then tap "Forgot Password?" again.');
            return;
        }

        setLoading(true);
        try {
            await requestPasswordReset(email.trim());
            showSuccess(`✅ Account found for ${email.trim()}.\nA reset link has been sent to your inbox.`);
        } catch (e: any) {
            showError(e?.message || 'No account found with that email address.');
        } finally {
            setLoading(false);
        }
    };

    const pressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 12 }).start();
    const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }).start();

    const focusStyle = (field: string) =>
        focusedField === field
            ? { borderColor: theme.colors.primary, backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.06)' }
            : {};

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <LinearGradient
                colors={[theme.colors.primary + '28', theme.colors.primary + '00']}
                style={styles.topBlob}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kbView}>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Logo */}
                    <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.gradientEnd]}
                            style={styles.logoCircle}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="sparkles" size={36} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>Finance Coach</Text>
                        <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>Your AI-powered money mentor</Text>
                    </Animated.View>

                    {/* Card */}
                    <Animated.View style={[
                        styles.card,
                        { opacity: cardOpacity, transform: [{ translateY: cardY }], backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...theme.shadows.lg },
                    ]}>
                        <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Welcome back 👋</Text>
                        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>Sign in to continue</Text>

                        {/* ── Inline Error Banner ── */}
                        {errorMsg !== '' && (
                            <Animated.View style={[
                                styles.msgBanner,
                                styles.errorBanner,
                                { transform: [{ scale: errorAnim }] },
                            ]}>
                                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            </Animated.View>
                        )}

                        {/* ── Inline Success Banner ── */}
                        {successMsg !== '' && (
                            <View style={[styles.msgBanner, styles.successBanner]}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
                                <Text style={styles.successText}>{successMsg}</Text>
                            </View>
                        )}

                        {/* Email */}
                        <View style={[
                            styles.inputWrapper,
                            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                            focusStyle('email'),
                        ]}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={focusedField === 'email' ? theme.colors.primary : theme.colors.textTertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                placeholder="Email address"
                                placeholderTextColor={theme.colors.textTertiary}
                                value={email}
                                onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password */}
                        <View style={[
                            styles.inputWrapper,
                            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                            focusStyle('password'),
                        ]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={focusedField === 'password' ? theme.colors.primary : theme.colors.textTertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, color: theme.colors.textPrimary }]}
                                placeholder="Password"
                                placeholderTextColor={theme.colors.textTertiary}
                                value={password}
                                onChangeText={t => { setPassword(t); setErrorMsg(''); }}
                                secureTextEntry={!showPassword}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={theme.colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Forgot password */}
                        <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword} disabled={loading}>
                            <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Sign In button */}
                        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPressIn={pressIn}
                                onPressOut={pressOut}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={[theme.colors.primary, theme.colors.gradientEnd]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.button}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.buttonText}>Sign In</Text>
                                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                            <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>or</Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                        </View>

                        {/* Sign up link */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                                Don't have an account?{' '}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={[styles.link, { color: theme.colors.primary }]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBlob: { position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: 140 },
    kbView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
    logoContainer: { alignItems: 'center', marginBottom: 28 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    appName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    tagline: { fontSize: 14, marginTop: 4 },
    card: { borderRadius: 24, padding: 24, borderWidth: 1 },
    cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
    cardSubtitle: { fontSize: 14, marginBottom: 20 },

    /* Error / success banners */
    msgBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorBanner: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    successBanner: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    errorText: { color: '#EF4444', fontSize: 13, flex: 1, lineHeight: 18 },
    successText: { color: '#10B981', fontSize: 13, flex: 1, lineHeight: 18 },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, marginBottom: 14, paddingHorizontal: 14, height: 54 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, height: '100%' },
    eyeBtn: { padding: 4 },
    forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
    forgotText: { fontSize: 13, fontWeight: '600' },
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 14 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 12, fontSize: 13 },
    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { fontSize: 14 },
    link: { fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
