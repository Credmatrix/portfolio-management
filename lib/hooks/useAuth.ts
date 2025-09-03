"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        initialized: false,
    });
    const router = useRouter();

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error getting session:", error);
            }

            setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
                initialized: true,
            });
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                    initialized: true,
                });

                // Handle auth events
                if (event === 'SIGNED_IN') {
                    // Redirect to dashboard after successful sign in
                    // router.push('/portfolio');
                } else if (event === 'SIGNED_OUT') {
                    // Redirect to login after sign out
                    router.push('/auth/login');
                } else if (event === 'PASSWORD_RECOVERY') {
                    // Redirect to password reset page
                    router.push('/auth/reset-password');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const signOut = async () => {
        setAuthState(prev => ({ ...prev, loading: true }));

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Error signing out:", error);
            setAuthState(prev => ({ ...prev, loading: false }));
            return { error };
        }

        return { error: null };
    };

    const refreshSession = async () => {
        const { data: { session }, error } = await supabase.auth.refreshSession();

        if (error) {
            console.error("Error refreshing session:", error);
            return { error };
        }

        return { session, error: null };
    };

    return {
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        initialized: authState.initialized,
        isAuthenticated: !!authState.user,
        signOut,
        refreshSession,
    };
}