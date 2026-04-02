import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ChatMessage as ChatMessageType, QuickAction } from '../types';
import { chatWithCoach } from '../services/ai/aiService';
import { useData } from '../context/DataContext';
import { ALL_CATEGORIES } from '../constants/categories';

const CoachScreen = () => {
    const { theme } = useTheme();
    const { transactions } = useData();
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Calculate context for AI
    const verified = transactions.filter(t => !t.needsVerification);
    const unverifiedCount = transactions.filter(t => t.needsVerification).length;
    const totalSpent = verified.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = verified.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    
    // Find category-wise totals
    const categoryTotals = ALL_CATEGORIES.map(cat => ({
        cat,
        total: verified.filter(t => t.category === cat && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    })).filter(ct => ct.total > 0).sort((a, b) => b.total - a.total);

    const topCategory = categoryTotals[0]?.cat;

    const financialContext = {
        totalSpent,
        totalIncome,
        topCategory,
        unverifiedCount,
        categoryTotals
    };

    // Update initial greeting with real data
    useEffect(() => {
        const greeting = totalSpent > 0 
            ? `Hi! I'm your Financial Coach. I see you've spent ₹${totalSpent.toLocaleString()} so far. Your top spending is in ${topCategory || 'miscellaneous'}. How can I help you save today?`
            : "Hi! I'm your AI Finance Coach. I'm ready to help you manage your money. Since you have no transactions yet, would you like to scan your SMS or import demo data?";

        setMessages([{
            id: '1',
            content: greeting,
            sender: 'ai',
            timestamp: new Date(),
            quickActions: [
                { id: 'qa1', label: 'Analyze spending', action: 'analyze' },
                { id: 'qa2', label: 'Budget tips', action: 'budget' },
                ...(unverifiedCount > 0 ? [{ id: 'qa3', label: `Review ${unverifiedCount} imports`, action: 'review' }] : []),
            ],
        }]);
    }, [totalSpent, totalIncome, unverifiedCount]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: ChatMessageType = {
            id: Date.now().toString(),
            content: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Scroll to bottom
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            const response = await chatWithCoach(inputText, messages, financialContext);

            const aiMessage: ChatMessageType = {
                id: (Date.now() + 1).toString(),
                content: response.response,
                sender: 'ai',
                timestamp: new Date(),
                quickActions: response.quickActions,
            };

            setMessages((prev) => [...prev, aiMessage]);
            setIsTyping(false);

            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            setIsTyping(false);
            console.error('Chat error:', error);
        }
    };

    const handleQuickAction = (action: QuickAction) => {
        setInputText(action.label);
        handleSend();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                <View style={[styles.coachAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="sparkles" size={26} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                        Financial Coach
                    </Text>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                            Always learning
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.avatarSmall, { backgroundColor: theme.colors.background }]}>
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} onQuickAction={handleQuickAction} />
                ))}

                {isTyping && (
                    <View style={[styles.messageBubble, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.typingIndicator}>
                            <TypingDots />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: theme.colors.background,
                            color: theme.colors.textPrimary,
                            borderColor: theme.colors.border,
                        },
                    ]}
                    placeholder="Ask me anything..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        {
                            backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border,
                        },
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const MessageBubble: React.FC<{
    message: ChatMessageType;
    onQuickAction: (action: QuickAction) => void;
}> = ({ message, onQuickAction }) => {
    const { theme } = useTheme();
    const isAI = message.sender === 'ai';

    return (
        <View style={[styles.messageRow, isAI ? styles.aiMessageRow : styles.userMessageRow]}>
            {isAI && (
                <View style={[styles.avatarSmall, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Ionicons name="sparkles" size={16} color="#6366F1" />
                </View>
            )}
            <View style={{ flex: 1, maxWidth: '80%' }}>
                <View
                    style={[
                        styles.messageBubble,
                        {
                            backgroundColor: isAI ? theme.colors.surface : theme.colors.primary,
                            borderColor: theme.colors.border,
                            borderWidth: isAI ? 1 : 0,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            { color: isAI ? theme.colors.textPrimary : theme.colors.textInverse },
                        ]}
                    >
                        {message.content}
                    </Text>
                </View>

                {message.quickActions && message.quickActions.length > 0 && (
                    <View style={styles.quickActionsContainer}>
                        {message.quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.quickActionChip, { borderColor: theme.colors.primary }]}
                                onPress={() => onQuickAction(action)}
                            >
                                <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );
};

const TypingDots: React.FC = () => {
    const { theme } = useTheme();
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 200);
        animate(dot3, 400);
    }, []);

    const opacity1 = dot1.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    const opacity2 = dot2.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    const opacity3 = dot3.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    return (
        <View style={styles.typingDotsContainer}>
            <Animated.View
                style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary, opacity: opacity1 }]}
            />
            <Animated.View
                style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary, opacity: opacity2 }]}
            />
            <Animated.View
                style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary, opacity: opacity3 }]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    coachAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 13,
    },
    messagesContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    aiMessageRow: {
        justifyContent: 'flex-start',
    },
    userMessageRow: {
        justifyContent: 'flex-end',
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        borderRadius: 16,
        padding: 12,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
        marginLeft: 4,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    quickActionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: '500',
    },
    typingIndicator: {
        padding: 8,
    },
    typingDotsContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    input: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        maxHeight: 100,
        borderWidth: 1,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CoachScreen;
