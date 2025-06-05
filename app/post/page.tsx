import { supabase } from '@/lib/supabaseClient'
import { sharedMoments } from '@/lib/moments';

'use client';
import { useState } from 'react';

export default function PostPage() {
  const [story, setStory] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const form = e.currentTarget as HTMLFormElement
  const formData = new FormData(form)
  const content = formData.get('content')?.toString().trim()

  if (!content) return

  const { error } = await supabase.from('moments').insert({ content })

  if (error) {
    alert('Failed to save moment!')
    console.error(error)
  } else {
    alert('Moment posted!')
    form.reset()
  }
}


  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Post Your Suck Thumb Moment</h1>
      {submitted && (
        <p className="text-green-600 mb-4">
          ✅ Thanks for sharing! You're not alone.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 border rounded-md mb-4"
          rows={6}
          placeholder="Share your moment here..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
