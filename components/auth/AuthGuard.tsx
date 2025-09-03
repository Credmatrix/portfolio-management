"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = "/auth/login" 
}: AuthGuardProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized || loading) return;

    if (requireAuth && !user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?redirectTo=${returnUrl}`);
    } else if (!requireAuth && user) {
      // Redirect authenticated users away from auth pages
      router.replace("/portfolio");
    }
  }, [user, loading, initialized, requireAuth, router, redirectTo, pathname]);

  // Show loading spinner while checking authentication
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-60">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}