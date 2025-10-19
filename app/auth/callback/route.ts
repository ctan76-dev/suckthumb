import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Auth callback URL:', request.url);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
  }

  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const code = searchParams.get('code');
  const email = searchParams.get('email');
  const redirectTarget =
    searchParams.get('redirect') ??
    (type === 'recovery' || token ? '/update-password' : '/profile');

  // If this is a password recovery, redirect to update-password
  if (type === 'recovery' || token || code) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error && process.env.NODE_ENV !== 'production') {
        console.error('exchangeCodeForSession error:', error);
      }
    } else if (token && email) {
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token,
        email,
      });
      if (error && process.env.NODE_ENV !== 'production') {
        console.error('verifyOtp error:', error);
      }
    } else if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error && process.env.NODE_ENV !== 'production') {
        console.error('setSession error:', error);
      }
    }

    const redirectUrl = redirectTarget.startsWith('http')
      ? new URL(redirectTarget)
      : new URL(redirectTarget, request.url);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Redirecting recovery to:', redirectUrl.toString());
    }
    return NextResponse.redirect(redirectUrl);
  }

  // For other auth flows, redirect to auth page
  return NextResponse.redirect(new URL('/auth', request.url));
} 
