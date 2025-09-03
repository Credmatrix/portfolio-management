"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { 
  AuthService, 
  getAuthErrorMessage, 
  validateEmail, 
  validatePassword, 
  validatePasswordConfirmation 
} from "@/lib/utils/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Form validation errors
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  const router = useRouter();
  const { user, initialized } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (initialized && user) {
      router.replace("/portfolio");
    }
  }, [user, initialized, router]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate full name
    if (!fullName.trim()) {
      setFullNameError("Full name is required");
      isValid = false;
    } else {
      setFullNameError("");
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      isValid = false;
    } else {
      setEmailError("");
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      isValid = false;
    } else {
      setPasswordError("");
    }

    // Validate password confirmation
    const confirmPasswordValidation = validatePasswordConfirmation(password, confirmPassword);
    if (confirmPasswordValidation) {
      setConfirmPasswordError(confirmPasswordValidation);
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await AuthService.signUp(email, password, fullName);

      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else if (user) {
        setSuccess(true);
        // Redirect to login with success message
        setTimeout(() => {
          router.push("/auth/login?message=registration-success");
        }, 2000);
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
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-90 mb-4">
            Registration Successful!
          </h1>
          <Alert variant="success" className="mb-6">
            Please check your email and click the confirmation link to activate your account.
          </Alert>
          <p className="text-neutral-60 mb-6">
            Redirecting you to the login page...
          </p>
          <Link href="/auth/login">
            <Button variant="outline" fullWidth>
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
            Create Account
          </h1>
          <p className="text-neutral-60 mt-2">
            Join Credit Portfolio Manager
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <Input
            type="text"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            placeholder="John Doe"
            error={fullNameError}
            fullWidth
            disabled={loading}
          />

          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            placeholder="john@company.com"
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
            helperText="Must be at least 6 characters long"
            fullWidth
            disabled={loading}
          />

          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm Password"
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
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-60">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}