'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/supabase';

type MomentRow = Database['public']['Tables']['moments']['Row'];

export default function TestPage() {
  const supabase = useSupabaseClient<Database>();
  const [moments, setMoments] = useState<MomentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMoments() {
      const { data, error } = await supabase.from('moments').select('*');
      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        setMoments(data || []);
      }
      setLoading(false);
    }

    fetchMoments();
  }, [supabase]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>
      <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">{JSON.stringify(moments, null, 2)}</pre>
    </div>
  );
}
