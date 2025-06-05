'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client';



export default function PostPage() {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('moments').insert({ content })

    if (error) {
      alert('Error posting moment: ' + error.message)
    } else {
      alert('Moment posted!')
      setContent('')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📝 Post a Moment</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-4"
          placeholder="Share your suck thumb moment..."
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  )
}
