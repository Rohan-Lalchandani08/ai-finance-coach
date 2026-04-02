import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import Papa from 'papaparse';

// Define the shape of our dataset rows
export interface FinanceDataRow {
    user_id: string;
    date: string;
    amount: string; // CSV parses as string initially
    category: string;
    need_want_classification: 'Need' | 'Want'; // Adjust based on actual CSV values
}

class DataLoadService {
    private data: FinanceDataRow[] = [];
    private isLoaded: boolean = false;

    async loadData(): Promise<FinanceDataRow[]> {
        if (this.isLoaded) {
            return this.data;
        }

        try {
            // Load the asset
            const asset = Asset.fromModule(require('../assets/data/ai_personal_finance_dataset.csv'));
            await asset.downloadAsync(); // Ensure it's available

            let fileContent: string;

            if (Platform.OS === 'web') {
                // On web, fetch the file from the URI
                const response = await fetch(asset.uri);
                fileContent = await response.text();
            } else {
                // On native, read from local filesystem
                if (!asset.localUri) {
                    throw new Error('Failed to download asset');
                }
                fileContent = await FileSystem.readAsStringAsync(asset.localUri);
            }

            // Parse CSV
            return new Promise((resolve, reject) => {
                Papa.parse(fileContent, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: Papa.ParseResult<FinanceDataRow>) => {
                        this.data = results.data;
                        this.isLoaded = true;
                        console.log(`Loaded ${this.data.length} rows of training data.`);
                        resolve(this.data);
                    },
                    error: (error: Error) => {
                        reject(error);
                    }
                });
            });

        } catch (error) {
            console.error('Error loading finance dataset:', error);
            return [];
        }
    }

    getData(): FinanceDataRow[] {
        return this.data;
    }
}

export default new DataLoadService();
