import { supabase } from '@/lib/supabaseClient'
import { sharedMoments } from '@/lib/moments';

'use client';
import { useEffect, useState } from 'react';

// Temporary memory-based store
let sharedMoments: string[] = [];

export default function WallPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Suck Thumb Wall</h1>

      {sharedMoments.length === 0 ? (
        <p className="text-gray-500">No posts yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {sharedMoments.map((moment, index) => (
            <li
              key={index}
              className="p-4 bg-white rounded shadow border border-gray-200"
            >
              {moment}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

