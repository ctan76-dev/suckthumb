// File: app/signin/page.tsx
'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect home once logged in
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  // Email/password sign-in
  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
  };

  // Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
    if (error) setErrorMsg(error.message);
  };

  // **Forgot password**
  const handleForgotPassword = async () => {
    setErrorMsg(null);

    if (!email) {
      return setErrorMsg('Please enter your email above.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.suckthumb.com/update-password',
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg('Check your inbox for a reset link!');
    }
  };

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Sign In</h1>

      {errorMsg && <p className="text-red-500 text-center">{errorMsg}</p>}

      {/* Google */}
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
      >
        <span>🔴</span>
        <span>Connect with Google</span>
      </Button>

      <div className="text-center text-sm text-gray-500">or</div>

      {/* Email/Password */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
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
          />
        </div>
        <Button type="submit" className="w-full">
          Sign In with Email
        </Button>
      </form>

      {/* Forgot password */}
      <p className="text-center text-sm text-gray-500">
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>
      </p>

      {/* Sign up link */}
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Sign Up
        </Link>
      </p>
    </main>
  );
}
