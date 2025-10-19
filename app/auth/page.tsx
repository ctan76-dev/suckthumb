"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";

export default function AuthPage() {
  const supabase = useSupabaseClient<Database>();
  const session = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.push("/profile");
  }, [session, router]);

  // Google sign in
  const handleGoogle = () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          "/profile"
        )}`,
      },
    });
    // Do NOT set loading to false here
  };

  // Email/password sign in
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  // Email/password sign up
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (password !== confirm) {
      setErrorMsg("Passwords do not match");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setErrorMsg(error.message);
    else setSuccessMsg("Check your inbox for a confirmation link.");
    setLoading(false);
  };

  // Forgot password
  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery&redirect=${encodeURIComponent(
      `${window.location.origin}/update-password`
    )}&email=${encodeURIComponent(email)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) setErrorMsg(error.message);
    else setSuccessMsg("Password reset email sent! Please check your inbox.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-2">
        {mode === "signin" && "Sign In"}
        {mode === "signup" && "Sign Up"}
        {mode === "forgot" && "Forgot Password"}
      </h1>

      {errorMsg && <p className="text-red-500 text-center">{errorMsg}</p>}
      {successMsg && <p className="text-green-600 text-center">{successMsg}</p>}

      {mode !== "forgot" && (
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogle}
          disabled={loading}
        >
          <span>🔴</span>
          <span>Sign in with Google</span>
        </Button>
      )}

      <div className="text-center text-sm text-gray-500">or</div>

      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing In..." : "Sign In with Email"}
          </Button>
        </form>
      )}

      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up with Email"}
          </Button>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-gray-600 mt-4">
        {mode === "signin" && (
          <>
            Don&apos;t have an account?{' '}
            <button className="text-blue-600 hover:underline" onClick={() => { setMode("signup"); setErrorMsg(null); setSuccessMsg(null); }}>
              Sign Up
            </button>
            <br />
            <button className="text-blue-600 hover:underline" onClick={() => { setMode("forgot"); setErrorMsg(null); setSuccessMsg(null); }}>
              Forgot password?
            </button>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account?{' '}
            <button className="text-blue-600 hover:underline" onClick={() => { setMode("signin"); setErrorMsg(null); setSuccessMsg(null); }}>
              Sign In
            </button>
          </>
        )}
        {mode === "forgot" && (
          <>
            Remembered your password?{' '}
            <button className="text-blue-600 hover:underline" onClick={() => { setMode("signin"); setErrorMsg(null); setSuccessMsg(null); }}>
              Sign In
            </button>
          </>
        )}
      </div>
    </main>
  );
} 
