import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Animated,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const SignupScreen = ({ navigation }: any) => {
    const { signup } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Staggered entrance animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const field1Y = useRef(new Animated.Value(40)).current;
    const field1Op = useRef(new Animated.Value(0)).current;
    const field2Y = useRef(new Animated.Value(40)).current;
    const field2Op = useRef(new Animated.Value(0)).current;
    const field3Y = useRef(new Animated.Value(40)).current;
    const field3Op = useRef(new Animated.Value(0)).current;
    const btnY = useRef(new Animated.Value(40)).current;
    const btnOp = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    const stagger = (yAnim: Animated.Value, opAnim: Animated.Value, delay: number) =>
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(yAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
                Animated.timing(opAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
            ]),
        ]);

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            stagger(field1Y, field1Op, 180),
            stagger(field2Y, field2Op, 290),
            stagger(field3Y, field3Op, 400),
            stagger(btnY, btnOp, 510),
        ]).start();
    }, []);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Missing Fields', 'Please fill in all fields to continue.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await signup(name.trim(), email.trim(), password);
        } catch (e: any) {
            Alert.alert('Signup Failed', e?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 12 }).start();
    const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }).start();

    const fieldFocusStyle = {
        borderColor: theme.colors.primary,
        backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.06)',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Top accent blob */}
            <LinearGradient
                colors={[theme.colors.gradientEnd + '35', theme.colors.gradientEnd + '05']}
                style={styles.topBlob}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.gradientEnd]}
                            style={[styles.logoCircle, { shadowColor: theme.colors.primary }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="person-add" size={34} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>Create Account</Text>
                        <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>Start your financial journey today</Text>
                    </Animated.View>

                    {/* Card */}
                    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...theme.shadows.lg }]}>
                        {/* Name */}
                        <Animated.View style={{ opacity: field1Op, transform: [{ translateY: field1Y }] }}>
                            <View style={[
                                styles.inputWrapper,
                                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                                focusedField === 'name' && fieldFocusStyle,
                            ]}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={focusedField === 'name' ? theme.colors.primary : theme.colors.textTertiary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.textPrimary }]}
                                    placeholder="Full name"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </Animated.View>

                        {/* Email */}
                        <Animated.View style={{ opacity: field2Op, transform: [{ translateY: field2Y }] }}>
                            <View style={[
                                styles.inputWrapper,
                                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                                focusedField === 'email' && fieldFocusStyle,
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
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </Animated.View>

                        {/* Password */}
                        <Animated.View style={{ opacity: field3Op, transform: [{ translateY: field3Y }] }}>
                            <View style={[
                                styles.inputWrapper,
                                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                                focusedField === 'password' && fieldFocusStyle,
                            ]}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={focusedField === 'password' ? theme.colors.primary : theme.colors.textTertiary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1, color: theme.colors.textPrimary }]}
                                    placeholder="Password (min. 6 chars)"
                                    placeholderTextColor={theme.colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
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
                        </Animated.View>

                        {/* Button */}
                        <Animated.View style={{ opacity: btnOp, transform: [{ translateY: btnY }, { scale: btnScale }], marginTop: 8 }}>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPressIn={pressIn}
                                onPressOut={pressOut}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={[theme.colors.primary, theme.colors.gradientEnd]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.button, { shadowColor: theme.colors.primary }]}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.buttonText}>Create Account</Text>
                                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                            <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>or</Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={[styles.link, { color: theme.colors.primary }]}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={[styles.terms, { color: theme.colors.textTertiary }]}>
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBlob: {
        position: 'absolute', top: -80, left: -80,
        width: 260, height: 260, borderRadius: 130,
    },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    logoContainer: { alignItems: 'center', marginBottom: 28 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
    },
    appName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    tagline: { fontSize: 13, marginTop: 4 },
    card: { borderRadius: 24, padding: 24, borderWidth: 1 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1.5,
        marginBottom: 12, paddingHorizontal: 14, height: 54,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, height: '100%' },
    eyeBtn: { padding: 4 },
    button: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 54, borderRadius: 14,
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 12, fontSize: 13 },
    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { fontSize: 14 },
    link: { fontSize: 14, fontWeight: '700' },
    terms: { textAlign: 'center', fontSize: 11, marginTop: 20, paddingHorizontal: 16, lineHeight: 18 },
});

export default SignupScreen;
