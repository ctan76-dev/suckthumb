'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SubmitMomentPage() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);

    const { data, error } = await supabase.from('moments').insert([{ content }]);

    if (error) {
      alert('Something went wrong: ' + error.message);
    } else {
      setContent('');
      router.push('/wall'); // Redirect to the wall after posting
    }

    setIsSubmitting(false);
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Share Your Suck Thumb Moment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened? What did you feel? Write it out..."
          className="w-full p-3 border rounded-md shadow"
          rows={6}
        ></textarea>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isSubmitting ? 'Submitting...' : 'Post Moment'}
        </button>
      </form>
    </main>
  );
}
