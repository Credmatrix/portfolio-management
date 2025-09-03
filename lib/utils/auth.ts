import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthError {
    message: string;
    code?: string;
}

export interface AuthResponse {
    user?: User;
    error?: AuthError;
}

export class AuthService {
    static async signIn(email: string, password: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) {
                return { error: { message: error.message, code: error.message } };
            }

            return { user: data.user };
        } catch (error) {
            return {
                error: {
                    message: "An unexpected error occurred. Please try again.",
                    code: "UNEXPECTED_ERROR"
                }
            };
        }
    }

    static async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error || !data.user) {
                return { error: { message: error?.message || "", code: error?.message } };
            }

            return { user: data.user };
        } catch (error) {
            return {
                error: {
                    message: "An unexpected error occurred. Please try again.",
                    code: "UNEXPECTED_ERROR"
                }
            };
        }
    }

    static async signOut(): Promise<{ error?: AuthError }> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                return { error: { message: error.message, code: error.message } };
            }

            return {};
        } catch (error) {
            return {
                error: {
                    message: "An unexpected error occurred during sign out.",
                    code: "SIGNOUT_ERROR"
                }
            };
        }
    }

    static async resetPassword(email: string): Promise<{ error?: AuthError }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) {
                return { error: { message: error.message, code: error.message } };
            }

            return {};
        } catch (error) {
            return {
                error: {
                    message: "An unexpected error occurred. Please try again.",
                    code: "RESET_ERROR"
                }
            };
        }
    }

    static async updatePassword(newPassword: string): Promise<{ error?: AuthError }> {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                return { error: { message: error.message, code: error.message } };
            }

            return {};
        } catch (error) {
            return {
                error: {
                    message: "An unexpected error occurred. Please try again.",
                    code: "UPDATE_PASSWORD_ERROR"
                }
            };
        }
    }

    static async getCurrentUser(): Promise<{ user?: User; error?: AuthError }> {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                return { error: { message: error?.message || "", code: error?.message } };
            }

            return { user };
        } catch (error) {
            return {
                error: {
                    message: "Failed to get current user.",
                    code: "GET_USER_ERROR"
                }
            };
        }
    }
}

export function getAuthErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
        "Invalid login credentials": "Invalid email or password. Please check your credentials and try again.",
        "Email not confirmed": "Please check your email and click the confirmation link before signing in.",
        "Too many requests": "Too many login attempts. Please wait a few minutes before trying again.",
        "User not found": "No account found with this email address.",
        "Invalid email": "Please enter a valid email address.",
        "Password should be at least 6 characters": "Password must be at least 6 characters long.",
        "User already registered": "An account with this email already exists. Please sign in instead.",
        "Signup disabled": "New account registration is currently disabled. Please contact your administrator.",
    };

    return errorMessages[error] || error || "An unexpected error occurred. Please try again.";
}

export function validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return "Email is required";
    }

    if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
    }

    return null;
}

export function validatePassword(password: string): string | null {
    if (!password) {
        return "Password is required";
    }

    if (password.length < 6) {
        return "Password must be at least 6 characters long";
    }

    return null;
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
    if (!confirmPassword) {
        return "Please confirm your password";
    }

    if (password !== confirmPassword) {
        return "Passwords do not match";
    }

    return null;
}