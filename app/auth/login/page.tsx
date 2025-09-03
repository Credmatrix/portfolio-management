"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthService, getAuthErrorMessage, validateEmail, validatePassword } from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialized } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && user) {
      const redirectTo = searchParams.get("redirectTo") || "/portfolio";
      router.replace(redirectTo);
    }
  }, [user, initialized, router, searchParams]);

  // Show success message if redirected from registration
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "registration-success") {
      setError("");
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    let isValid = true;

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      isValid = false;
    } else {
      setEmailError("");
    }

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await AuthService.signIn(email, password);

      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else if (user) {
        // Redirect will be handled by the auth hook
        const redirectTo = searchParams.get("redirectTo") || "/portfolio";
        router.push(redirectTo);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is already authenticated
  if (initialized && user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-xl shadow-fluent-2 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4 shadow-fluent-1">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-90">
            Credmatrix
          </h1>
          <p className="text-neutral-60 mt-2">
            Enterprise Credit Risk Management
          </p>
        </div>

        {searchParams.get("message") === "registration-success" && (
          <Alert variant="success" className="mb-6">
            Registration successful! Please check your email to verify your account before signing in.
          </Alert>
        )}

        {searchParams.get("message") === "password-reset" && (
          <Alert variant="success" className="mb-6">
            Password reset email sent! Please check your inbox and follow the instructions.
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            placeholder="admin@company.com"
            error={emailError}
            fullWidth
            disabled={loading}
          />

          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-50 hover:text-neutral-70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            placeholder="••••••••"
            error={passwordError}
            fullWidth
            disabled={loading}
          />

          <div className="flex items-center justify-between">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-60">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
