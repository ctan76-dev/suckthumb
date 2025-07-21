import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Log all parameters for debugging
  console.log('Auth callback URL:', request.url);
  console.log('All search params:', Object.fromEntries(searchParams.entries()));

  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const code = searchParams.get('code');

  // If this is a password recovery, redirect to update-password
  if (type === 'recovery' || token) {
    const redirectUrl = new URL('/update-password', request.url);
    
    // Pass all the parameters
    if (token) redirectUrl.searchParams.set('token', token);
    if (type) redirectUrl.searchParams.set('type', type);
    if (accessToken) redirectUrl.searchParams.set('access_token', accessToken);
    if (refreshToken) redirectUrl.searchParams.set('refresh_token', refreshToken);
    
    console.log('Redirecting recovery to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // For OAuth flows (like Google sign-in), redirect to auth page
  if (code) {
    console.log('OAuth flow detected, redirecting to auth page');
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // For other auth flows, redirect to auth page
  return NextResponse.redirect(new URL('/auth', request.url));
} 