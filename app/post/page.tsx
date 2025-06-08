'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client';


export default function PostPage() {
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('posts').select('*')
      if (error) console.error(error)
      else setPosts(data)
    }

    fetchPosts()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id} className="mb-2">
            {post.content}
          </li>
        ))}
      </ul>
    </div>
  )
}
