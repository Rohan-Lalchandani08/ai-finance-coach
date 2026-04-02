import { Platform, PermissionsAndroid } from 'react-native';
// @ts-ignore
import SmsAndroid from 'react-native-get-sms-android';
import { Transaction, TransactionCategory } from '../types';

interface ParsedSMS {
    amount: number;
    type: 'income' | 'expense';
    description: string;
    category: TransactionCategory;
    bank: string;
    rawMessage: string;
    matchedKeyword?: string;
}

// ─── Keyword → Category Mapping ─────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<TransactionCategory, string[]> = {
    food: ['swiggy', 'zomato', 'dominos', 'mcdonalds', 'restaurant', 'hotel', 'cafe', 'pizza', 'food', 'dhaba', 'biryani', 'starbucks', 'caterer', 'bakery', 'kfc', 'burger', 'subway', 'pizza hut', 'dine', 'breakfast', 'lunch', 'dinner'],
    transport: ['uber', 'ola', 'rapido', 'metro', 'irctc', 'flight', 'bus', 'fuel', 'petrol', 'diesel', 'parking', 'toll', 'cab', 'indianoil', 'hpcl', 'bpcl', 'shell', 'bharat petrol', 'train', 'railway'],
    shopping: ['amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'mall', 'h&m', 'zara', 'decathlon', 'reliance', 'dmart', 'shop', 'store', 'kirana', 'westside', 'lifestyle', 'pantaloons', 'electronics', 'fashion'],
    groceries: ['bigbasket', 'blinkit', 'zepto', 'market', 'grocery', 'vegetable', 'fruit', 'milk', 'dairy', 'amul', 'mother dairy', 'provison', 'supermarket', 'instamart', 'fresh'],
    travel: ['makemytrip', 'goibibo', 'cleartrip', 'expedia', 'airbnb', 'hotel', 'resort', 'vacation', 'flight', 'airline', 'indigo', 'air india', 'vistara', 'spicejet', 'booking.com', 'trivago'],
    entertainment: ['netflix', 'hotstar', 'jiocinema', 'spotify', 'prime', 'youtube', 'cinema', 'pvr', 'inox', 'game', 'bookmyshow', 'theatre', 'club', 'playstation', 'xbox'],
    personal_care: ['salon', 'spa', 'barber', 'haircut', 'beauty', 'cosmetics', 'purplle', 'wellness', 'gym', 'cult.fit', 'fitness', 'massage', 'skin', 'urban company'],
    maintenance: ['service', 'repair', 'mechanic', 'urban company', 'plumber', 'electrician', 'carpentry', 'car service', 'bike service', 'garage', 'hardware', 'painting'],
    bills: ['electricity', 'water', 'gas', 'internet', 'broadband', 'rent', 'emi', 'loan', 'insurance', 'recharge', 'mobile', 'dth', 'jio', 'airtel', 'vi', 'bsnl', 'tata play', 'lic', 'fastag', 'bescom', 'tneb', 'mseb'],
    health: ['pharmacy', 'apollo', 'medplus', 'hospital', 'clinic', 'doctor', 'medicine', 'health', 'lab', 'diagnostic', 'netmeds', 'medical', 'pharma', 'dr ', 'dental', 'vision', 'lenskart'],
    education: ['udemy', 'coursera', 'school', 'college', 'tuition', 'fees', 'course', 'book', 'library', 'byjus', 'unacademy'],
    savings: ['mutual fund', 'sip', 'ppf', 'fd', 'fixed deposit', 'nps', 'savings', 'post office', 'kyc', 'pension', 'lic'],
    investment: ['zerodha', 'groww', 'angel', 'upstox', 'stocks', 'share', 'brokerage', 'smallcase', 'coin', 'wealth', 'indmoney', 'kite', 'securities'],
    salary: ['salary', 'payroll', 'stipend', 'wages', 'ctc', 'neft credit', 'imps credit', 'bonus'],
    other: ['xerox', 'print', 'stationery', 'scan', 'courier', 'blue dart', 'dtdc', 'post', 'misc'],
};

function guessCategory(description: string): { category: TransactionCategory; keyword: string } {
    const lower = description.toLowerCase();
    
    // Check for investment keywords first (Forced Category)
    // Both credits and debits for these should be 'investment'
    const investmentKeywords = CATEGORY_KEYWORDS.investment;
    for (const kw of investmentKeywords) {
        if (lower.includes(kw)) {
            return { category: 'investment', keyword: kw };
        }
    }

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (cat === 'investment') continue; // Handled above
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                return { category: cat as TransactionCategory, keyword: kw };
            }
        }
    }
    return { category: 'other', keyword: '' };
}

// ─── SMS Regex Patterns ──────────────────────────────────────────────────────
const DEBIT_PATTERNS: RegExp[] = [
    /(?:debited|deducted|paid|spent|withdrawn).*?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?).*?(?:debited|deducted|paid)/i,
    /(?:upi|imps|neft|rtgs).*?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /debit\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i, // A/C X2812 Debit Rs.6.00
];

const CREDIT_PATTERNS: RegExp[] = [
    /(?:credited|received|added|deposited).*?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?).*?(?:credited|received|deposited)/i,
    /(?:credited with)\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i, // is credited with Rs. 1,000.00
];

function extractAmount(msg: string): number | null {
    const allPatterns = [...DEBIT_PATTERNS, ...CREDIT_PATTERNS];
    for (const pattern of allPatterns) {
        const match = msg.match(pattern);
        if (match?.[1]) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
    }
    // Fallback: grab the first number after Rs/₹/INR
    const generic = msg.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (generic?.[1]) return parseFloat(generic[1].replace(/,/g, ''));
    return null;
}

function extractType(msg: string): 'income' | 'expense' {
    const lower = msg.toLowerCase();
    if (CREDIT_PATTERNS.some((p) => p.test(msg)) || lower.includes('credited') || lower.includes('received')) {
        return 'income';
    }
    return 'expense';
}

function extractMerchant(msg: string): string {
    // Check IPPB/Axis specific formats first: "for UPI to <Merchant> on" or "by <Name>."
    const upiTargetMatch = msg.match(/for upi to\s+([a-z0-9 &.'-]+)\s+on/i);
    if (upiTargetMatch?.[1]) return upiTargetMatch[1].trim();

    const impsSourceMatch = msg.match(/by\s+([a-z0-9 &.'-]+)\.\s*imps/i);
    if (impsSourceMatch?.[1]) return impsSourceMatch[1].trim();
    
    // Look for "at <Merchant>", "to <Merchant>", "from <Merchant>"
    const patterns = [
        /\bat\s+([A-Z][A-Za-z0-9 &.'-]{2,30})/,
        /\bto\s+([A-Z][A-Za-z0-9 &.'-]{2,30})/,
        /\bfrom\s+([A-Z][A-Za-z0-9 &.'-]{2,25})/,
        /upi\/(?:p2m|p2p)\/[0-9]+\/([a-z0-9 &.'-]+)/i // UPI/P2M/102526242324/ANGEL ONE SECURITIE
    ];
    for (const pat of patterns) {
        const m = msg.match(pat);
        if (m?.[1]) return m[1].trim();
    }
    
    // If no explicit merchant is found, extract NEFT/IMPS info if present
    const neftMatch = msg.match(/(?:neft|imps)\/[a-z0-9]+\/([a-z0-9 &.'-]+)/i);
    if (neftMatch?.[1]) return neftMatch[1].trim();

    return 'Unknown Transaction';
}

function extractBank(msg: string): string {
    const lower = msg.toLowerCase();
    const banks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'Yes Bank', 'PNB', 'BOI', 'Canara', 'IndusInd', 'IDBI', 'Federal'];
    for (const bank of banks) {
        if (lower.includes(bank.toLowerCase())) return `${bank} Bank`;
    }
    if (lower.includes('ippb')) return 'IPPB';
    if (lower.includes('paytm')) return 'Paytm';
    if (lower.includes('phonepe')) return 'PhonePe';
    if (lower.includes('gpay') || lower.includes('google pay')) return 'Google Pay';
    return 'Bank';
}

function extractDate(msg: string, defaultDate: Date): Date {
    // Match common Indian SMS dates: DD-MM-YY, DD-MM-YYYY, DD/MM/YY
    const dateMatch = msg.match(/(\d{2})[-/](\d{2})[-/](\d{2,4})/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
        let year = parseInt(dateMatch[3], 10);
        if (year < 100) year += 2000; // Handle YY format

        const extractedDate = new Date(year, month, day);
        // Only return if it's a valid date
        if (!isNaN(extractedDate.getTime())) {
            return extractedDate;
        }
    }
    return defaultDate;
}

// ─── Parse a single SMS ──────────────────────────────────────────────────────
export function parseSMS(message: string, receiveDate: Date = new Date()): ParsedSMS | null {
    const amount = extractAmount(message);
    if (!amount || amount <= 0) return null;

    const type = extractType(message);
    const description = extractMerchant(message);
    const { category, keyword } = guessCategory(message + ' ' + description);
    const bank = extractBank(message);

    return { amount, type, description, category, bank, rawMessage: message, matchedKeyword: keyword };
}

// ─── Simulated SMS List (realistic Indian bank messages) ─────────────────────
const SIMULATED_MESSAGES = [
    'HDFC Bank: Rs.549.00 debited from A/c **7823 via UPI at Swiggy on 15-Mar-26. Avl Bal: Rs.12,450.30. Call 18002586161 for dispute.',
    'Dear SBI Customer, Rs.1,200.00 debited from account ending 4321 via UPI to Uber on 15-Mar-26 09:34:21. Avl Bal: Rs.8,742.20.',
    'ICICI Bk Transaction alert! INR 250.00 debited from A/c XX6789 for Netflix subscription on 14-Mar-26. Avl Bal: INR 45,123.00.',
    'Kotak Bank: INR 15,000.00 credited to A/c No. XX9011 from NEFT transfer on 14-Mar-26. Bal: 63,000.00.',
    'Your A/c XX1234 is debited by Rs.320.00 by UPI at Zomato on 13-Mar-26. Available Balance Rs.22,800.00. -Axis Bank.',
    'PhonePe: Rs.84.00 paid to D-Mart via UPI on 13-Mar-26 07:18. Reference No: 123456789.',
    'HDFC Bank: Rs.3,499.00 debited from your account for Amazon Shopping on 12-Mar-26. Available Balance: Rs.28,900.00.',
    'Dear Customer, Rs.800.00 debited from SBI A/c **6543 at Apollo Pharmacy on 12-Mar-26. Avl Bal Rs.4,120.00.',
    'Google Pay: Rs.2,100 paid to BSNL Broadband for bill payment on 11-Mar-26. Txn Ref: 987654321.',
];

// ─── Public API ──────────────────────────────────────────────────────────────

export async function extractFromRealSMS(): Promise<Omit<Transaction, 'id'>[]> {
    if (Platform.OS !== 'android') {
        return extractFromSimulatedSMS();
    }

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            {
                title: "SMS Permission",
                message: "This app needs access to your SMS to automatically extract transaction details from bank alerts.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
            }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn("SMS permission denied");
            return [];
        }

        return new Promise((resolve, reject) => {
            const filter = {
                box: 'inbox',
                read: 0, // only unread or all? usually we scan all recent ones
                indexFrom: 0,
                maxCount: 200, // look at last 200 messages
            };

            SmsAndroid.list(
                JSON.stringify(filter),
                (fail: string) => {
                    console.error("Failed to list SMS:", fail);
                    reject(fail);
                },
                (count: number, smsList: string) => {
                    const messages = JSON.parse(smsList);
                    const results: Omit<Transaction, 'id'>[] = [];

                    messages.forEach((msg: any) => {
                        const smsDate = new Date(msg.date);
                        const parsed = parseSMS(msg.body, smsDate);
                        if (parsed) {
                            results.push({
                                amount: parsed.amount,
                                type: parsed.type,
                                category: parsed.category,
                                description: parsed.description,
                                // Use the explicit date found in text, otherwise fallback to message receive date
                                date: extractDate(msg.body, smsDate),
                                needsVerification: true,
                                smsSource: parsed.bank,
                                matchedKeyword: parsed.matchedKeyword,
                                rawMessage: msg.body,
                            });
                        }
                    });

                    resolve(results);
                }
            );
        });
    } catch (err) {
        console.error("SMS Extraction Error:", err);
        return extractFromSimulatedSMS();
    }
}

export function extractFromSimulatedSMS(): Omit<Transaction, 'id'>[] {
    const results: Omit<Transaction, 'id'>[] = [];

    const extendedSimulatedMessages = [
        ...SIMULATED_MESSAGES,
        'INR 2000.00 debited A/c no. XX5521 23-01-26, 01:10:12 UPI/P2M/102526242324/ANGEL ONE SECURITIE Not you? SMS BLOCKUPI Cust ID to 919951860002 Axis Bank',
        'A/C X2812 Debit Rs.6.00 for UPI to naresh medical on 07-06-25 Ref 515872727748. Avl Bal Rs.807.44. If not you? SMS FREEZE "full a/c" to 7738062873-IPPB',
        'Your A/C XX2812 is credited with Rs. 1,000.00 on 15-06-2025 12:12:35 by ROHANANIL. IMPS Ref: 516612834525. Avl Bal: Rs. 1,577.44-IPPB',
        'A/C X2812 Debit Rs.17.00 for UPI to aditya caterer on 28-07-25 Ref 557548077324. Avl Bal Rs.1672.44. If not you? SMS FREEZE "full a/c" to 7738062873-IPPB',
        'A/C X2812 Debit Rs.20.00 for UPI to dhiraj xerox   on 04-08-25 Ref 521619247917. Avl Bal Rs.1506.44. If not you? SMS FREEZE "full a/c" to 7738062873-IPPB',
        'INR 75000.00 credited to A/c no. XX5521 on 27-07-25 at 21:31:33 IST. Info - NEFT/YESOB52081995153/ROHA. Chk Bal https://ccm.axbk.in/AXISBK/ltt3Dvko - Axis Bank',
        'HDFC Bank: Rs.2,450.00 debited from a/c for groceries at BigBasket on 10-Mar-26. Avl Bal: Rs.5,120.00.',
        'ICICI Bank: INR 6,500.00 debited for flight to Indigo via Makemytrip on 09-Mar-26. Happy journey!',
        'Your A/c XX9988 is debited by Rs.1,200.00 at Enrich Salon for personal care on 08-Mar-2026. -Axis Bank.',
        'Dear Customer, Rs.3,500.00 debited from account ending 1122 for car service at Maruti Garage on 07-Mar-26.'
    ];

    for (const msg of extendedSimulatedMessages) {
        const parsed = parseSMS(msg);
        if (!parsed) continue;

        results.push({
            amount: parsed.amount,
            type: parsed.type,
            category: parsed.category,
            description: parsed.description,
            date: extractDate(msg, new Date()), 
            needsVerification: true,
            smsSource: parsed.bank,
            matchedKeyword: parsed.matchedKeyword,
            rawMessage: msg,
        });
    }

    return results;
}
