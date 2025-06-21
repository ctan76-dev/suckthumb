'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already signed in, go home
  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  // Email/password sign-up
  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setErrorMsg(error.message);
    else setErrorMsg('Check your inbox for a confirmation link.');
  };

  // Google OAuth
  const handleGoogleSignUp = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setErrorMsg(error.message);
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Sign Up</h1>

      {errorMsg && <p className="text-red-500 text-center">{errorMsg}</p>}

      {/* Google Button */}
      <Button
        variant="outline"
        onClick={handleGoogleSignUp}
        className="w-full flex items-center justify-center gap-2"
      >
        <span className="text-xl">G</span>
        <span>Connect with Google</span>
      </Button>

      <div className="text-center text-sm text-gray-500">or</div>

      {/* Email / Password */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign Up with Email
        </Button>
      </form>

      {/* Sign in link */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-600 hover:underline">
          Sign In
        </Link>
      </p>
    </main>
  );
}
