'use client';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function WallPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: moments, error } = await supabase
    .from('moments')
    .select('*')
    .order('inserted_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-500">Error loading moments: {error.message}</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🧱 Suck Thumb Wall</h1>

      {moments.length === 0 ? (
        <p className="text-gray-500">No moments yet. Be the first to share!</p>
      ) : (
        <ul className="space-y-4">
          {moments.map((moment) => (
            <li
              key={moment.id}
              className="border border-gray-200 rounded p-3 shadow-sm bg-white"
            >
              {moment.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
