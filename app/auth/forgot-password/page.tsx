"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { AuthService, getAuthErrorMessage, validateEmail } from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  const router = useRouter();
  const { user, initialized } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && user) {
      router.replace("/portfolio");
    }
  }, [user, initialized, router]);

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await AuthService.resetPassword(email);

      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else {
        setSuccess(true);
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-fluent-2 p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-90 mb-4">
            Check Your Email
          </h1>
          <Alert variant="success" className="mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your inbox and follow the instructions to reset your password.
          </Alert>
          <p className="text-neutral-60 mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              variant="outline"
              fullWidth
            >
              Try Different Email
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost" fullWidth>
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-xl shadow-fluent-2 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4 shadow-fluent-1">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-90">
            Reset Password
          </h1>
          <p className="text-neutral-60 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
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
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}