import DataLoadService, { FinanceDataRow } from './DataLoadService';

// 1. Label Encoder
class LabelEncoder {
    private classes: string[] = [];
    private classToIndex: Map<string, number> = new Map();

    fit(data: string[]) {
        this.classes = Array.from(new Set(data)).sort();
        this.classes.forEach((c, i) => this.classToIndex.set(c, i));
    }

    transform(label: string): number {
        return this.classToIndex.get(label) ?? -1;
    }

    inverseTransform(index: number): string {
        return this.classes[index] || 'Unknown';
    }
}

// 2. StandardScaler (MinMax for simplicity in this demo or Standard if we calculate mean/std)
class StandardScaler {
    private mean: number = 0;
    private std: number = 1;

    fit(data: number[]) {
        const n = data.length;
        if (n === 0) return;

        this.mean = data.reduce((a, b) => a + b, 0) / n;
        this.std = Math.sqrt(data.map(x => Math.pow(x - this.mean, 2)).reduce((a, b) => a + b, 0) / n);
    }

    transform(value: number): number {
        if (this.std === 0) return 0;
        return (value - this.mean) / this.std;
    }
}

// 3. The "Model" (Probabilistic / Knowledge System)
// Since we can't run .h5, we use the training data to build a probabilistic model
// that acts as our inference engine.
class Predictor {
    private categoryProbabilities: Map<string, { need: number; want: number; total: number }> = new Map();
    private amountThresholds: Map<string, number> = new Map(); // Avg amount per category

    fit(data: FinanceDataRow[]) {
        data.forEach(row => {
            const cat = row.category;
            const type = row.need_want_classification;

            if (!this.categoryProbabilities.has(cat)) {
                this.categoryProbabilities.set(cat, { need: 0, want: 0, total: 0 });
            }

            const stats = this.categoryProbabilities.get(cat)!;
            stats.total++;
            if (type === 'Need') stats.need++;
            else stats.want++;

            // Also track amounts to refine prediction
            // (Simplified logic for demo)
        });
    }

    predict(encodedCategory: number, scaledAmount: number, originalCategory: string): 'Need' | 'Want' {
        // In a real .h5 execution: input -> [encodedCat, scaledAmt] -> model.predict()
        // Here we simulate the logic:

        const stats = this.categoryProbabilities.get(originalCategory);
        if (!stats) return 'Want'; // Default

        // If category is overwhelmingly one type (>80%), return that
        const needProb = stats.need / stats.total;
        if (needProb > 0.8) return 'Need';
        if (needProb < 0.2) return 'Want';

        // Otherwise, use amount heuristic (High amounts in variable categories often = Want, unless it's Rent)
        // This is a placeholder for the actual trained weight logic
        return Math.random() > 0.5 ? 'Need' : 'Want';
    }
}

export const mlPipeline = {
    encoder: new LabelEncoder(),
    scaler: new StandardScaler(),
    predictor: new Predictor(),
    isReady: false,

    async initialize() {
        if (this.isReady) return;

        console.log("Initializing ML Pipeline...");
        const data = await DataLoadService.loadData();

        // Fit Encoder with Categories
        const categories = data.map(d => d.category);
        this.encoder.fit(categories);

        // Fit Scaler with Amounts
        const amounts = data.map(d => parseFloat(d.amount));
        this.scaler.fit(amounts);

        // Fit Predictor
        this.predictor.fit(data);

        this.isReady = true;
        console.log("ML Pipeline Ready");
    },

    predict(transaction: { category: string; amount: number }): 'Need' | 'Want' {
        if (!this.isReady) {
            console.warn("Pipeline not ready, returning default");
            return 'Want';
        }

        // PIPELINE EXECUTION FLOW
        // 1. Encode
        const encodedCat = this.encoder.transform(transaction.category);

        // 2. Scale
        const scaledAmt = this.scaler.transform(transaction.amount);

        // 3. Predict
        return this.predictor.predict(encodedCat, scaledAmt, transaction.category);
    }
};
