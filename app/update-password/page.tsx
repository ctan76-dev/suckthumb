// File: app/update-password/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Grab the access_token from the URL (?access_token=…)
  const accessToken = searchParams.get('access_token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If there's no token, kick back to sign in
  useEffect(() => {
    if (!accessToken) {
      router.replace('/signin');
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    // Correctly call updateUser(password) with the accessToken as the
    // second argument to the helper
    const { error: updateError } = await supabase.auth.updateUser(
      { password },
      { accessToken }
    );

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Password updated! Redirecting to Sign In…');
      setTimeout(() => router.push('/signin'), 2000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}
        {message && <p className="text-green-600 text-center">{message}</p>}

        <div>
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Confirm Password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
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
