"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";

export default function UpdatePasswordPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get all URL parameters for debugging
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const code = searchParams.get("code");
    
    // Log the full URL and all parameters
    console.log("Full URL:", window.location.href);
    console.log("URL Parameters:", {
      token,
      type,
      accessToken,
      refreshToken,
      code,
      allParams: Object.fromEntries(searchParams.entries())
    });

    setDebugInfo(`Full URL: ${window.location.href}\nToken: ${token}\nType: ${type}\nAccess Token: ${accessToken ? 'Present' : 'Missing'}\nCode: ${code}\nAll Params: ${JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}`);

    // Check if we have the required parameters
    if (!token && !accessToken && !code) {
      setError("Invalid or missing reset token. Please request a new password reset.");
      return;
    }

    if (type && type !== "recovery") {
      setError("Invalid token type. Please request a new password reset.");
      return;
    }

    // Handle recovery code - this is the correct flow for password reset
    if (code) {
      handleRecoveryCode(code);
    } else if (accessToken) {
      // If we have an access token, we're already authenticated
      setIsAuthenticated(true);
    }
  }, [searchParams]);

  const handleRecoveryCode = async (code: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Get the email from the URL
      const email = searchParams.get("email");
      if (!email) {
        setError("Missing email in reset link. Please use the link from your email.");
        return;
      }

      // Use both email and code to verify
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery"
      });

      if (error) {
        setError(`Recovery failed: ${error.message}`);
        return;
      }

      if (data.session) {
        setIsAuthenticated(true);
        setMessage("Recovery successful! You can now set your new password.");
      } else {
        setError("Recovery failed. Please try the password reset link again.");
      }
    } catch (error) {
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!isAuthenticated) {
      setError("Please complete the recovery process first");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("No active session. Please try the password reset link again.");
        return;
      }

      console.log("Updating password for user:", session.user.email);

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("Password updated successfully! Redirecting to login...");
      
      // Sign out the user after password change
      await supabase.auth.signOut();
      
      // Redirect to auth page after 2 seconds
      setTimeout(() => {
        router.push("/auth");
      }, 2000);

    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        {/* Debug info - remove this in production */}
        {debugInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600 text-xs">Debug: {debugInfo}</p>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your new password"
              required
              minLength={6}
              disabled={!isAuthenticated}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your new password"
              required
              minLength={6}
              disabled={!isAuthenticated}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !password || !confirmPassword || !isAuthenticated}
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/auth")}
            className="text-sm"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    </main>
  );
} 