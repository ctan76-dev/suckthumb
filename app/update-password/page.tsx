'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Grab the access token from the URL (?access_token=...)
  const accessToken = searchParams.get('access_token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If no token present, bounce back to home/signin
  useEffect(() => {
    if (!accessToken) {
      router.replace('/signin');
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    // Call Supabase to update the password
    const { error: updateError } = await supabase.auth.updateUser({
      accessToken,
      password,
    });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Password updated! Redirecting to sign in…');
      setTimeout(() => router.push('/signin'), 3000);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Reset Password</h1>

      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Confirm Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <Button type="submit" className="w-full">
          Update Password
        </Button>
      </form>
    </main>
  );
}
