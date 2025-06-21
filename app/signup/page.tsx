'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

export default function SignUpPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect home if already logged in
  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  // Google OAuth sign-up
  const handleGoogleSignUp = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
    if (error) setErrorMsg(error.message);
  };

  // Email/password sign-up
  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/signin?from=signup');
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center px-4 py-8 max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Sign Up</h1>

      {errorMsg && <p className="text-center text-red-500">{errorMsg}</p>}

      <Button
        onClick={handleGoogleSignUp}
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

      <form onSubmit={handleEmailSignUp} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing up…' : 'Sign Up with Email'}
        </Button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-600 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </main>
  );
}
