// app/institutions/[id]/rate/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RatingInput {
  categoryId: number;
  score: number;
  comment: string;
}

export default function RatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ratings, setRatings] = useState<RatingInput[]>([
    { categoryId: 1, score: 5, comment: '' }
  ]);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (index: number, field: keyof RatingInput, value: number | string) => {
    const newRatings = [...ratings];
    newRatings[index] = {
      ...newRatings[index],
      [field]: value
    };
    setRatings(newRatings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/institutions/${params.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ratings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit ratings');
      }

      // Redirect to institution page or show success message
      router.push(`/institutions/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRating = () => {
    setRatings([...ratings, { categoryId: 1, score: 5, comment: '' }]);
  };

  const removeRating = (index: number) => {
    if (ratings.length > 1) {
      setRatings(ratings.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Rate Institution</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {ratings.map((rating, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={rating.categoryId}
                onChange={(e) => handleRatingChange(index, 'categoryId', parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              >
                <option value={1}>Category 1</option>
                <option value={2}>Category 2</option>
                {/* Add more categories as needed */}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Score (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating.score}
                onChange={(e) => handleRatingChange(index, 'score', parseInt(e.target.value))}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comment</label>
              <textarea
                value={rating.comment}
                onChange={(e) => handleRatingChange(index, 'comment', e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>

            {ratings.length > 1 && (
              <button
                type="button"
                onClick={() => removeRating(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove Rating
              </button>
            )}
          </div>
        ))}

        <div className="space-x-4">
          <button
            type="button"
            onClick={addRating}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
          >
            Add Another Rating
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ratings'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}