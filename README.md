# AI Finance Coach App

A comprehensive React Native mobile application that combines AI-powered financial insights with gamification to help users manage their finances effectively.

## Features

### 1. **Auto Expense Classification (AI-Based Categorization)**
- Automatic transaction categorization using AI
- Confidence scores for AI suggestions
- Manual override capability
- Category icons and color coding

### 2. **Spending Predictions and Future Forecasting**
- AI-powered spending predictions by category
- Monthly spending forecasts with confidence levels
- Trend analysis (increasing, decreasing, stable)
- Expected spending ranges

### 3. **Overspending Detection and Smart Alerts**
- Real-time budget monitoring
- Smart alerts when approaching budget limits
- Unusual spending pattern detection
- Actionable recommendations

### 4. **Smart Budgeting and Personalized Recommendations**
- Category-wise budget allocation
- Visual progress tracking
- **Need vs Want Analyzer** - AI-powered classification
- Budget optimization suggestions

### 5. **Smart Challenges and Gamified Savings Goals**
- Interactive savings challenges
- Reward system with points
- Progress tracking with visual feedback
- Multiple challenge types (spending, saving, learning)

### 6. **Habit Streaks and Daily Financial Discipline**
- Daily streak tracking with fire animation
- Milestone achievements (7, 14, 30, 100 days)
- Visual calendar of activities
- Motivational rewards

### 7. **Financial Term of the Day (Learning Feature)**
- Daily financial education
- Term definitions with examples
- Glassmorphic card design
- Knowledge building

### 8. **Monthly and Weekly Spending Analysis Dashboard**
- Comprehensive analytics dashboard
- Period selector (week/month/year)
- Category breakdown with percentages
- Income vs. expenses comparison
- Savings rate calculation

### 9. **Goal Tracking and Future Planning**
- Multiple goal types (savings, debt, purchase, investment)
- Milestone tracking with visual progress
- Deadline monitoring
- Achievement celebrations

### 10. **Smart AI Coach Interface (Chat Feature)**
- Conversational AI chatbot
- Context-aware financial advice
- Quick action chips for common queries
- Typing indicators and smooth animations
- Personalized insights

## Design Features

- **Light mode by default** with dark mode toggle
- Modern, premium UI with vibrant colors
- Glassmorphism effects on cards
- Gradient backgrounds
- Smooth animations using Reanimated
- Responsive design
- Bottom tab navigation
- Custom theme system

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs, Stack)
- **Animations**: React Native Reanimated
- **UI**: Custom components with Expo Linear Gradient
- **State Management**: React Context (Theme)
- **Storage**: AsyncStorage (theme preferences)
- **Gestures**: React Native Gesture Handler

## Project Structure

```
ai-finance-coach/
├── components/
│   └── ui/
│       ├── Button.tsx          # Reusable button with variants
│       ├── Card.tsx            # Card component (default, gradient, glass)
│       ├── ProgressBar.tsx     # Animated progress bar
│       └── Badge.tsx           # Badge for categories/status
├── constants/
│   └── theme.ts                # Theme system (colors, typography, spacing)
├── context/
│   └── ThemeContext.tsx        # Theme provider (light/dark mode)
├── data/
│   └── mockData.ts             # Mock data for development
├── navigation/
│   └── RootNavigator.tsx       # Bottom tab navigation
├── screens/
│   ├── HomeScreen.tsx          # Dashboard with overview
│   ├── AnalyzeScreen.tsx       # Analytics and insights
│   ├── GoalsScreen.tsx         # Goals and challenges
│   └── CoachScreen.tsx         # AI chat interface
├── services/
│   └── ai/
│       └── aiService.ts        # AI/ML integration layer
├── types/
│   └── index.ts                # TypeScript type definitions
├── App.tsx                     # Main app entry point
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (optional)

### Installation

1. Navigate to the project directory:
```bash
cd ai-finance-coach
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w`

## ML Model Integration

The app is designed to easily integrate your custom ML models. All AI features are abstracted in `services/ai/aiService.ts` with well-defined interfaces.

### Integration Points

1. **Transaction Classification** - `classifyTransaction()`
2. **Spending Predictions** - `predictSpending()`
3. **Overspending Detection** - `detectOverspending()`
4. **Budget Recommendations** - `generateBudgetRecommendations()`
5. **Need vs Want Analysis** - `classifyNeedWant()`
6. **AI Insights** - `generateInsights()`
7. **Chat Responses** - `chatWithCoach()`

### How to Integrate Your Models

Replace the mock implementations in `aiService.ts` with actual API calls to your ML endpoints:

```typescript
export const classifyTransaction = async (transaction: Partial<Transaction>) => {
  try {
    const response = await fetch('YOUR_ML_API_ENDPOINT/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: transaction.description }),
    });
    const data = await response.json();
    return { category: data.category, confidence: data.confidence };
  } catch (error) {
    console.error('Classification error:', error);
    return { category: 'other', confidence: 0.5 };
  }
};
```

## Theme Customization

Toggle between light and dark mode using the theme button (sun/moon icon) in the top right of the Home screen. Theme preference is saved to AsyncStorage.

## Screenshots & Demo

Run the app to see:
- ✨ Stunning gradient cards and glassmorphic effects
- 🎯 Smooth animations and micro-interactions
- 📊 Interactive charts and visualizations
- 💬 Conversational AI chat interface
- 🔥 Gamified streak tracking
- 🎨 Beautiful, modern UI design

## Development Notes

- All screens are fully functional with mock data
- Animations are optimized using Reanimated
- Theme system supports easy color customization
- Components are reusable and customizable
- TypeScript ensures type safety throughout

## Future Enhancements

- Add real transaction data integration
- Implement data persistence (SQLite or Realm)
- Add push notifications for alerts
- Implement actual chart components (react-native-chart-kit)
- Add biometric authentication
- Multi-currency support
- Export reports (PDF)
- Social features (leaderboards)

## License

This project is private and proprietary.

---

Built with ❤️ using React Native and AI
