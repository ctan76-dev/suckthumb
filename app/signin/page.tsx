// File: app/signin/page.tsx
'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

export default function SignInPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect home if already logged in
  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
    if (error) setErrorMsg(error.message);
  };

  return (
    <main className="flex flex-col px-4 py-8 max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Sign In</h1>

      {errorMsg && <p className="text-center text-red-500">{errorMsg}</p>}

      <Button
        onClick={handleGoogleSignIn}
        className="
          flex items-center justify-center gap-2
          w-full py-2 px-4
          border border-gray-300 rounded
          bg-white text-gray-800 font-medium
          hover:bg-gray-50
        "
      >
        <FcGoogle size={20} />
        <span>Connect with Google</span>
      </Button>

      <div className="text-center text-sm text-gray-500">or</div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign In with Email
        </Button>
      </form>

      <p className="text-center text-sm">
        Don’t have an account?{' '}
        <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    </main>
  );
}
