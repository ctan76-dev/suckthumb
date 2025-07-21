"use client";

import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ProfilePage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    if (!session) router.push("/auth");
  }, [session, router]);

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not signed in</h1>
          <Button onClick={() => router.push("/auth")}>Go to Sign In</Button>
        </div>
      </main>
    );
  }

  const email = session.user.email;
  const avatar = session.user.user_metadata?.avatar_url;

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        {avatar && (
          <img src={avatar} alt="Avatar" className="mx-auto mb-4 rounded-full h-16 w-16 object-cover" />
        )}
        <div className="mb-4">
          <span className="font-medium">Email:</span>
          <div className="text-gray-700">{email}</div>
        </div>
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => router.push("/")}
          >
            Go to Home (Post Your Stories)
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/auth");
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </main>
  );
} 