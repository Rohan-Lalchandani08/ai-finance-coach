import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    StatusBar,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@onboarding_complete';

interface Slide {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
}

const SLIDES: Slide[] = [
    {
        icon: 'wallet',
        title: 'Take Control of\nYour Finances',
        subtitle: 'Track every rupee, every day. Know exactly where your money goes with smart categorisation.',
    },
    {
        icon: 'analytics',
        title: 'Smart AI\nInsights',
        subtitle: 'Your personal AI finance coach analyses your patterns and gives intelligent spending predictions.',
    },
    {
        icon: 'trophy',
        title: 'Achieve Your\nGoals',
        subtitle: 'Set savings targets, crush daily challenges and build streaks that transform your financial life.',
    },
];

const OnboardingScreen = ({ navigation }: any) => {
    const { theme, isDarkMode } = useTheme();

    // pageIndex tracks which slide the button/dots label should show
    // It uses a ref for instant sync + state for re-render
    const pageRef = useRef(0);
    const [pageIndex, setPageIndex] = useState(0);

    const scrollRef = useRef<any>(null);
    const btnScale = useRef(new Animated.Value(1)).current;
    const iconAnims = useRef(SLIDES.map(() => new Animated.Value(1))).current;

    // scrollX is driven by Animated.event — updates on EVERY frame during drag
    const scrollX = useRef(new Animated.Value(0)).current;

    // Keep pageIndex in sync with scrollX on every frame
    useEffect(() => {
        const id = scrollX.addListener(({ value }) => {
            const idx = Math.round(value / width);
            if (idx >= 0 && idx < SLIDES.length && idx !== pageRef.current) {
                pageRef.current = idx;
                setPageIndex(idx);
            }
        });
        return () => scrollX.removeListener(id);
    }, []);

    const ACCENTS = [theme.colors.primary, theme.colors.gradientEnd, theme.colors.secondary];

    /* ── When a page settles (swipe or programmatic scroll) ── */
    const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        if (idx >= 0 && idx < SLIDES.length && idx !== pageRef.current) {
            pageRef.current = idx;
            setPageIndex(idx);
            // Bounce the icon of the newly visible slide
            iconAnims[idx].setValue(0.5);
            Animated.spring(iconAnims[idx], {
                toValue: 1, tension: 60, friction: 7, useNativeDriver: true,
            }).start();
        }
    };

    /* ── Programmatic navigation (Next button / dot tap) ── */
    const goTo = (idx: number) => {
        // Update state immediately so button text / accent sync before scroll
        pageRef.current = idx;
        setPageIndex(idx);
        (scrollRef.current as any)?.scrollTo({ x: idx * width, animated: true });
    };

    const handleNext = () => {
        if (pageRef.current < SLIDES.length - 1) {
            goTo(pageRef.current + 1);
        } else {
            handleGetStarted();
        }
    };

    const handleGetStarted = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        navigation.replace('Login');
    };

    const pressIn = () => Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, tension: 200, friction: 12 }).start();
    const pressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }).start();

    const accent = ACCENTS[pageIndex] ?? theme.colors.primary;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Decorative blobs */}
            <View style={[styles.blob1, { backgroundColor: accent + '22' }]} />
            <View style={[styles.blob2, { backgroundColor: accent + '14' }]} />

            {/* Skip */}
            {pageIndex < SLIDES.length - 1 && (
                <TouchableOpacity style={[styles.skipBtn, { borderColor: theme.colors.border }]} onPress={handleGetStarted}>
                    <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
                </TouchableOpacity>
            )}

            {/* ── Slides ── */}
            <Animated.ScrollView
                ref={scrollRef as any}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                scrollEventThrottle={16}
                style={styles.scrollView}
                onMomentumScrollEnd={handleMomentumEnd}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false },
                )}
            >
                {SLIDES.map((s, i) => (
                    <View key={i} style={styles.slide}>
                        <Animated.View style={[
                            styles.iconWrap,
                            {
                                backgroundColor: ACCENTS[i] + '18',
                                borderColor: ACCENTS[i] + '40',
                                transform: [{ scale: iconAnims[i] }],
                            },
                        ]}>
                            <View style={[styles.iconInner, { backgroundColor: ACCENTS[i] + '28' }]}>
                                <Ionicons name={s.icon} size={64} color={ACCENTS[i]} />
                            </View>
                        </Animated.View>
                        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{s.title}</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{s.subtitle}</Text>
                    </View>
                ))}
            </Animated.ScrollView>

            {/* ── Dots — animated in real-time with scrollX ── */}
            <View style={styles.dotsRow}>
                {SLIDES.map((_, i) => {
                    // Each dot grows/shrinks as scrollX changes
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 28, 8],
                        extrapolate: 'clamp',
                    });
                    const dotColor = scrollX.interpolate({
                        inputRange,
                        outputRange: [
                            theme.colors.border,
                            ACCENTS[i] ?? theme.colors.primary,
                            theme.colors.border,
                        ],
                        extrapolate: 'clamp',
                    });

                    return (
                        <TouchableOpacity key={i} onPress={() => goTo(i)}>
                            <Animated.View style={[
                                styles.dot,
                                { width: dotWidth, backgroundColor: dotColor },
                            ]} />
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── CTA Button ── */}
            <Animated.View style={[styles.btnWrapper, { transform: [{ scale: btnScale }] }]}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                    onPress={handleNext}
                    style={[styles.button, { backgroundColor: accent }]}
                >
                    <Text style={styles.buttonText}>
                        {pageIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Ionicons
                        name={pageIndex === SLIDES.length - 1 ? 'rocket' : 'arrow-forward'}
                        size={20}
                        color="#FFFFFF"
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 48 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    blob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -100, right: -80 },
    blob2: { position: 'absolute', width: 240, height: 240, borderRadius: 120, bottom: 60, left: -100 },
    skipBtn: {
        position: 'absolute', top: 56, right: 24, zIndex: 10,
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
    },
    skipText: { fontSize: 14, fontWeight: '500' },
    scrollView: { flex: 1 },
    slide: {
        width,
        height: height * 0.65,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        paddingTop: 60,
    },
    iconWrap: {
        width: 160, height: 160, borderRadius: 80,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, marginBottom: 48,
    },
    iconInner: {
        width: 120, height: 120, borderRadius: 60,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 34, fontWeight: '800', textAlign: 'center', lineHeight: 42, marginBottom: 18, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
    dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
    dot: { height: 8, borderRadius: 4 },
    btnWrapper: { width: width - 64, alignSelf: 'center' },
    button: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 56, borderRadius: 18,
    },
    buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});

export default OnboardingScreen;
