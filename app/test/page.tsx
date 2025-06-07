'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestPage() {
  const [moments, setMoments] = useState<any[]>([]);
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
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Moments from Supabase</h1>
      <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">{JSON.stringify(moments, null, 2)}</pre>
    </div>
  );
}
