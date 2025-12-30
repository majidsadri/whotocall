import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { setupDeepLinkHandler } from '../lib/deepLinking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithLinkedIn: () => Promise<{ url: string } | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Setup deep link handler for OAuth callback
    const cleanup = setupDeepLinkHandler();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      cleanup();
      subscription.unsubscribe();
    };
  }, []);

  const signInWithLinkedIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: 'reachr://auth/callback',
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    return data.url ? { url: data.url } : null;
  };

  const signOut = async () => {
    try {
      // Clear local business cards data first
      await AsyncStorage.removeItem('@business_cards_v2');
      await AsyncStorage.removeItem('@business_card');

      // Try to sign out from Supabase (may fail if offline)
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (networkErr) {
        console.log('Network sign out failed, signing out locally');
      }

      // Always clear local state regardless of network
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Sign out exception:', err);
      // Still clear state even if storage clear fails
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithLinkedIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
