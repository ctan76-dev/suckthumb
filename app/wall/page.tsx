'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Your Supabase client path

export default function WallPage() {
  const supabase = createClient(); // initialize client
  const [moments, setMoments] = useState<any[]>([]); // store moments

  useEffect(() => {
    async function fetchMoments() {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setMoments(data);
      if (error) console.error(error);
    }

    fetchMoments(); // fetch when component loads
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Community Wall</h1>
      {moments.length === 0 ? (
        <p>No moments yet. Be the first to share!</p>
      ) : (
        <ul>
          {moments.map((moment) => (
            <li key={moment.id} className="border-b py-2">
              {moment.content}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
