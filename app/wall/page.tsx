import { supabase } from '@/lib/supabaseClient'
import { sharedMoments } from '@/lib/moments';

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Moment = {
  id: number
  content: string
  inserted_at: string
}

export default function WallPage() {
  const [moments, setMoments] = useState<Moment[]>([])

  useEffect(() => {
    const fetchMoments = async () => {
      const { data, error } = await supabase
        .from('moments')
        .select('*')
        .order('inserted_at', { ascending: false })

      if (error) {
        console.error('Error fetching moments:', error)
      } else {
        setMoments(data || [])
      }
    }

    fetchMoments()
  }, [])

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🧱 The Wall</h1>

      {moments.length === 0 ? (
        <p className="text-gray-500">No moments yet. Be the first to share!</p>
      ) : (
        <ul className="space-y-4">
          {moments.map((moment) => (
            <li key={moment.id} className="bg-white p-4 rounded shadow">
              <p>{moment.content}</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(moment.inserted_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
