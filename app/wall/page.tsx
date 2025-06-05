'use client';
import { useEffect, useState } from 'react';

// Temporary memory-based store
let sharedMoments: string[] = [];

export default function WallPage() {
  const [moments, setMoments] = useState<string[]>([]);

  // Load moments on mount
  useEffect(() => {
    setMoments([...sharedMoments]);
  }, []);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Wall of Suck Thumb Moments</h1>

      {moments.length === 0 ? (
        <p className="text-gray-500">No moments yet. Be the first to share!</p>
      ) : (
        <ul className="space-y-4">
          {moments.map((moment, index) => (
            <li key={index} className="p-4 border rounded shadow-sm bg-white">
              {moment}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
