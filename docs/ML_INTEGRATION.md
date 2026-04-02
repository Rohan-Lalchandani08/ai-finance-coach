# ML Model Integration Guide

This document provides detailed instructions on how to integrate your machine learning models into the AI Finance Coach app.

## Overview

All AI functionality in the app is abstracted through the service layer in `services/ai/aiService.ts`. The current implementation uses mock responses to demonstrate the UI and functionality. You can replace these with your actual ML model API calls.

## Integration Architecture

```
Mobile App (React Native)
    ↓
AI Service Layer (aiService.ts)
    ↓
Your ML API Endpoints
    ↓
Your ML Models
```

## Service Functions to Implement

### 1. Transaction Classification

**Function**: `classifyTransaction(transaction)`

**Input**:
```typescript
{
  description: string;  // e.g., "Starbucks Coffee"
  amount?: number;      // e.g., 12.50
  date?: Date;
}
```

**Expected Output**:
```typescript
{
  category: TransactionCategory;  // 'food', 'transport', 'shopping', etc.
  confidence: number;              // 0.0 to 1.0
}
```

**Implementation Example**:
```typescript
export const classifyTransaction = async (transaction: Partial<Transaction>) => {
  try {
    const response = await fetch('https://your-api.com/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        description: transaction.description,
        amount: transaction.amount
      })
    });
    
    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    return {
      category: data.predicted_category,
      confidence: data.confidence_score
    };
  } catch (error) {
    console.error('Classification error:', error);
    // Fallback to default category
    return { category: 'other', confidence: 0.5 };
  }
};
```

### 2. Spending Predictions

**Function**: `predictSpending(transactions, category?)`

**Input**:
```typescript
transactions: Transaction[];  // Historical transactions
category?: string;            // Optional: specific category to predict
```

**Expected Output**:
```typescript
Array<{
  category: TransactionCategory;
  predictedAmount: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}>
```

**Model Requirements**:
- Time series forecasting
- Historical transaction data analysis
- Trend detection

### 3. Overspending Detection

**Function**: `detectOverspending(transactions, budgets)`

**Input**:
```typescript
transactions: Transaction[];  // Recent transactions
budgets: Budget[];            // User's budget settings
```

**Expected Output**:
```typescript
Array<{
  id: string;
  type: 'overspending' | 'budget' | 'unusual' | 'goal';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: Date;
}>
```

**Model Requirements**:
- Anomaly detection
- Pattern recognition
- Budget threshold analysis

### 4. Need vs Want Classification

**Function**: `classifyNeedWant(transaction)`

**Input**:
```typescript
transaction: Transaction;  // Full transaction details
```

**Expected Output**:
```typescript
{
  classification: 'need' | 'want';
  confidence: number;
  reasoning: string;
}
```

**Model Requirements**:
- Natural language processing
- Category-based rules
- Context understanding

### 5. Budget Recommendations

**Function**: `generateBudgetRecommendations(transactions, budgets)`

**Input**:
```typescript
transactions: Transaction[];
budgets: Budget[];
```

**Expected Output**:
```typescript
Array<{
  id: string;
  type: 'suggestion' | 'tip';
  title: string;
  message: string;
  timestamp: Date;
  icon: string;
}>
```

### 6. AI Insights Generation

**Function**: `generateInsights(transactions, budgets)`

**Expected Output**:
```typescript
Array<{
  id: string;
  type: 'achievement' | 'tip' | 'suggestion' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  icon: string;
}>
```

### 7. AI Coach Chat

**Function**: `chatWithCoach(message, conversationHistory)`

**Input**:
```typescript
message: string;                  // User's message
conversationHistory: ChatMessage[];  // Previous messages
```

**Expected Output**:
```typescript
{
  response: string;
  quickActions?: Array<{
    id: string;
    label: string;
    action: string;
  }>;
}
```

**Model Requirements**:
- Conversational AI / NLP
- Context awareness
- Financial domain knowledge

## API Integration Best Practices

### 1. Error Handling

Always implement proper error handling:

```typescript
try {
  const response = await fetch(API_URL, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Return fallback/default values
  return defaultResponse;
}
```

### 2. Loading States

The UI already handles loading states. Make sure your async functions complete within reasonable time:

```typescript
// Add timeout to prevent hanging
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 10000)
);

const result = await Promise.race([
  yourAPICall(),
  timeoutPromise
]);
```

### 3. Caching

Implement caching to reduce API calls:

```typescript
const cache = new Map();

export const classifyTransactionCached = async (transaction) => {
  const cacheKey = transaction.description;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = await classifyTransaction(transaction);
  cache.set(cacheKey, result);
  return result;
};
```

### 4. Rate Limiting

Implement rate limiting if your API has limits:

```typescript
import { throttle } from 'lodash';

const throttledClassify = throttle(classifyTransaction, 1000);
```

### 5. Batch Processing

If possible, batch multiple requests:

```typescript
export const classifyMultipleTransactions = async (transactions) => {
  const response = await fetch(API_URL + '/batch-classify', {
    method: 'POST',
    body: JSON.stringify({ transactions })
  });
  
  return response.json();
};
```

## Environment Configuration

Create a `.env` file for API keys and endpoints:

```env
ML_API_BASE_URL=https://your-api.com
ML_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key  # If using OpenAI for chat
```

Then use it in your service:

```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.manifest?.extra?.mlApiUrl || 'http://localhost:3000';
const API_KEY = Constants.manifest?.extra?.mlApiKey;
```

## Testing Your Integration

### Unit Tests

Create tests for your service functions:

```typescript
// __tests__/aiService.test.ts
import { classifyTransaction } from '../services/ai/aiService';

describe('AI Service', () => {
  it('should classify grocery transaction correctly', async () => {
    const result = await classifyTransaction({
      description: 'Walmart Grocery'
    });
    
    expect(result.category).toBe('food');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### Integration Testing

Test the full flow:

1. Add a transaction in the app
2. Verify AI classification appears
3. Check confidence score is displayed
4. Verify manual override works

## Performance Optimization

### 1. Lazy Loading

Only load models when needed:

```typescript
let model = null;

export const initializeModel = async () => {
  if (!model) {
    model = await loadModel();
  }
  return model;
};
```

### 2. Background Processing

Use background tasks for heavy processing:

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('SYNC_PREDICTIONS', async () => {
  const predictions = await predictSpending(transactions);
  await AsyncStorage.setItem('cached_predictions', JSON.stringify(predictions));
});
```

### 3. Progressive Enhancement

Start with simple rules, enhance with ML:

```typescript
export const classifyTransaction = async (transaction) => {
  // Quick rule-based classification first
  const quickResult = ruleBasedClassify(transaction);
  
  if (quickResult.confidence > 0.8) {
    return quickResult;
  }
  
  // Fall back to ML for uncertain cases
  return await mlClassify(transaction);
};
```

## Monitoring and Analytics

Track ML model performance:

```typescript
const logPrediction = async (input, output, userFeedback) => {
  await fetch('YOUR_ANALYTICS_ENDPOINT', {
    method: 'POST',
    body: JSON.stringify({
      input,
      prediction: output,
      userAccepted: userFeedback,
      timestamp: new Date()
    })
  });
};
```

## Next Steps

1. Deploy your ML models as REST APIs
2. Update the service functions in `aiService.ts`
3. Test each feature individually
4. Monitor performance and accuracy
5. Iterate based on user feedback

## Support

For questions or issues with ML integration, refer to:
- API documentation
- Model training notebooks
- Performance benchmarks
- Error logs

---

Happy integrating! 🚀
