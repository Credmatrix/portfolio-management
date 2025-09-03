"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { 
  AuthService, 
  getAuthErrorMessage, 
  validatePassword, 
  validatePasswordConfirmation 
} from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialized } = useAuth();

  // Check if we have the required tokens from the URL
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    
    if (!accessToken || !refreshToken) {
      setError("Invalid or expired reset link. Please request a new password reset.");
    }
  }, [searchParams]);

  // Redirect if already authenticated (but allow password reset)
  useEffect(() => {
    if (initialized && user && !searchParams.get("access_token")) {
      router.replace("/portfolio");
    }
  }, [user, initialized, router, searchParams]);

  const validateForm = (): boolean => {
    let isValid = true;

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      isValid = false;
    } else {
      setPasswordError("");
    }

    const confirmPasswordValidation = validatePasswordConfirmation(password, confirmPassword);
    if (confirmPasswordValidation) {
      setConfirmPasswordError(confirmPasswordValidation);
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    
    if (!accessToken || !refreshToken) {
      setError("Invalid or expired reset link. Please request a new password reset.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await AuthService.updatePassword(password);

      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else {
        setSuccess(true);
        // Redirect to login after successful password reset
        setTimeout(() => {
          router.push("/auth/login?message=password-reset-success");
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-fluent-2 p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-90 mb-4">
            Password Reset Successful!
          </h1>
          <Alert variant="success" className="mb-6">
            Your password has been successfully updated. You can now sign in with your new password.
          </Alert>
          <p className="text-neutral-60 mb-6">
            Redirecting you to the login page...
          </p>
          <Link href="/auth/login">
            <Button fullWidth>
              Go to Login
            </Button>
          </Link>
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
            Set New Password
          </h1>
          <p className="text-neutral-60 mt-2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <Input
            type={showPassword ? "text" : "password"}
            label="New Password"
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
            helperText="Must be at least 6 characters long"
            fullWidth
            disabled={loading}
          />

          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-neutral-50 hover:text-neutral-70 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            placeholder="••••••••"
            error={confirmPasswordError}
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
            disabled={!searchParams.get("access_token")}
          >
            Update Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}