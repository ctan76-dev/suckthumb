// File: app/update-password/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';

export default function UpdatePasswordPage() {
  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessToken = searchParams.get('access_token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // if no token, bounce them back
  useEffect(() => {
    if (!accessToken) router.replace('/signin');
  }, [accessToken, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg("Passwords don't match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      accessToken,
      password,
    });
    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Password updated! Redirecting to sign in…');
      setTimeout(() => router.replace('/signin'), 2000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Set New Password</h1>
        {msg && <p className="text-center text-red-500">{msg}</p>}
        <div>
          <label className="block mb-1">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Confirm password</label>
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
