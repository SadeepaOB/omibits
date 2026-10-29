import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Wraps the app and provides session, user, and role to all children.
 * Role is stored in user_metadata.role at sign-up time.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);       // 'admin' | 'employee'

  useEffect(() => {
    // 1. Grab the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role,          // 'admin' | 'employee' | null
    isAdmin: role === 'admin',
    isEmployee: role === 'employee',
    loading: session === undefined,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
