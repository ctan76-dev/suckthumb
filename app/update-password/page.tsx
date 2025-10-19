"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";

type Status = "checking" | "ready" | "error";

export default function UpdatePasswordPage() {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        setStatus("ready");
        setError("");
      } else {
        setStatus("error");
        setError("Reset link is invalid or has expired. Please request a new password reset email.");
      }
    };

    hydrateSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        setStatus("ready");
        setError("");
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status !== "ready") {
      setError("Please complete the recovery process using the latest reset email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("error");
        setError("Session expired. Please request a new password reset email.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Password updated successfully! Redirecting to sign in…");
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    } catch (updateErr) {
      setError("An unexpected error occurred. Please try again.");
      if (process.env.NODE_ENV !== "production") {
        console.error("Password update error:", updateErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="mt-2 text-sm text-gray-600">Enter your new password below.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
            {message}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Enter your new password"
              minLength={6}
              required
              disabled={status !== "ready" || isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Confirm your new password"
              minLength={6}
              required
              disabled={status !== "ready" || isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={status !== "ready" || isSubmitting}
          >
            {isSubmitting ? "Updating…" : "Update Password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => router.push("/auth")}
            disabled={isSubmitting}
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    </main>
  );
}
