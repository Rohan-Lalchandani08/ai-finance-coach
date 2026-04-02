import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const ACCOUNTS_KEY = '@auth_accounts';
const SESSION_KEY = '@auth_user';

const getAccounts = async (): Promise<StoredAccount[]> => {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    console.log('[Auth] Accounts in storage:', parsed.length, parsed.map((a: StoredAccount) => a.email));
    return parsed;
  } catch (e) {
    console.error('[Auth] getAccounts error:', e);
    return [];
  }
};

const saveAccounts = async (accounts: StoredAccount[]) => {
  try {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    console.log('[Auth] Saved accounts:', accounts.map(a => a.email));
  } catch (e) {
    console.error('[Auth] saveAccounts error:', e);
    throw e;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('[Auth] Restored session:', parsed.email);
        setUser(parsed);
      } else {
        console.log('[Auth] No active session found');
      }
    } catch (e) {
      console.error('[Auth] Session restore failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── SIGN UP ─────────────────────────────────────────────── */
  const signup = async (name: string, email: string, pass: string) => {
    const normalEmail = email.toLowerCase().trim();
    console.log('[Auth] Attempting signup for:', normalEmail);

    const accounts = await getAccounts();
    const exists = accounts.find(a => a.email === normalEmail);

    if (exists) {
      console.log('[Auth] Signup blocked — email already registered');
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const newAccount: StoredAccount = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: normalEmail,
      password: pass,
    };

    accounts.push(newAccount);
    await saveAccounts(accounts);
    console.log('[Auth] Signup success, saved account:', normalEmail);

    const sessionUser: User = { id: newAccount.id, name: newAccount.name, email: newAccount.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  /* ── LOG IN ──────────────────────────────────────────────── */
  const login = async (email: string, pass: string) => {
    const normalEmail = email.toLowerCase().trim();
    console.log('[Auth] Login attempt for:', normalEmail);

    const accounts = await getAccounts();
    console.log('[Auth] Total accounts found:', accounts.length);

    if (accounts.length === 0) {
      console.log('[Auth] No accounts in storage at all — user needs to sign up');
      throw new Error('No account found. Please sign up first.');
    }

    const emailMatch = accounts.find(a => a.email === normalEmail);
    if (!emailMatch) {
      console.log('[Auth] Email not found in accounts:', normalEmail);
      throw new Error('No account found with this email. Please sign up first.');
    }

    console.log('[Auth] Email found, checking password...');
    if (emailMatch.password !== pass) {
      console.log('[Auth] Password mismatch for:', normalEmail);
      throw new Error('Incorrect password. Please try again.');
    }

    console.log('[Auth] Login success for:', normalEmail);
    const sessionUser: User = { id: emailMatch.id, name: emailMatch.name, email: emailMatch.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  /* ── LOG OUT ─────────────────────────────────────────────── */
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      console.log('[Auth] Logged out');
      setUser(null);
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    }
  };

  /* ── FORGOT PASSWORD ─────────────────────────────────────── */
  const requestPasswordReset = async (email: string): Promise<string> => {
    const normalEmail = email.toLowerCase().trim();
    const accounts = await getAccounts();
    const account = accounts.find(a => a.email === normalEmail);
    if (!account) throw new Error('No account found with that email address.');
    return account.email;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
