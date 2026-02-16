'use client';

import { useState } from 'react';
import { useWizardStore } from '@/lib/store';
import { api } from '@/lib/api';

interface Props {
  onBack: () => void;
}

export function StepReview({ onBack }: Props) {
  const { childData, bookOptions, referenceImage } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateBook = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create child profile
      const child = await api.createChild({
        name: childData.name,
        age: childData.age,
        gender: childData.gender || undefined,
        interests: childData.interests,
        favoriteColors: childData.favoriteColors,
        personalityTraits: childData.personalityTraits,
        favoriteAnimals: childData.favoriteAnimals,
        themes: childData.themes,
      });

      // Step 2: Create book
      const book = await api.createBook({
        childProfileId: (child as any).id,
        storyType: bookOptions.storyType,
        illustrationStyle: bookOptions.illustrationStyle,
        bindingType: bookOptions.bindingType,
        paperType: bookOptions.paperType,
        bookSize: bookOptions.bookSize,
        pageCount: bookOptions.pageCount,
        moralLesson: bookOptions.moralLesson || undefined,
        dedicationText: bookOptions.dedicationText || undefined,
        includeAudiobook: bookOptions.includeAudiobook,
        includeDigitalPdf: bookOptions.includeDigitalPdf,
        giftWrap: bookOptions.giftWrap,
      });

      // Step 3: Start generation
      await api.startGeneration(book.id);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card text-center py-16">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Your Book Is Being Created!
        </h2>
        <p className="mt-4 text-gray-600 max-w-md mx-auto">
          Our AI is crafting a unique story and illustrations for {childData.name}.
          We&apos;ll notify you when it&apos;s ready for review.
        </p>
        <a href="/dashboard" className="btn-primary mt-8 inline-block">
          Go to My Books
        </a>
      </div>
    );
  }

  return (
    <div className="card space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review Your Book</h3>

      {/* Child Summary */}
      <div className="rounded-xl bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-700">Child Details</h4>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Name:</span> {childData.name}</div>
          <div><span className="text-gray-500">Age:</span> {childData.age}</div>
          {childData.interests.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Interests:</span> {childData.interests.join(', ')}
            </div>
          )}
          {childData.themes.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Themes:</span> {childData.themes.join(', ')}
            </div>
          )}
        </div>
        {referenceImage && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <img src={URL.createObjectURL(referenceImage)} alt="Child" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm text-gray-600">Reference photo uploaded</span>
          </div>
        )}
      </div>

      {/* Book Summary */}
      <div className="rounded-xl bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-700">Book Options</h4>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Story Type:</span> {bookOptions.storyType.replace(/_/g, ' ')}</div>
          <div><span className="text-gray-500">Pages:</span> {bookOptions.pageCount}</div>
          <div><span className="text-gray-500">Style:</span> {bookOptions.illustrationStyle.replace(/_/g, ' ')}</div>
          <div><span className="text-gray-500">Binding:</span> {bookOptions.bindingType.replace(/_/g, ' ')}</div>
          <div><span className="text-gray-500">Paper:</span> {bookOptions.paperType.replace(/_/g, ' ')}</div>
          <div><span className="text-gray-500">Size:</span> {bookOptions.bookSize.replace(/_/g, ' ')}</div>
          {bookOptions.moralLesson && (
            <div className="col-span-2"><span className="text-gray-500">Moral:</span> {bookOptions.moralLesson}</div>
          )}
        </div>
        {(bookOptions.includeAudiobook || bookOptions.includeDigitalPdf || bookOptions.giftWrap) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {bookOptions.includeAudiobook && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Audiobook</span>}
            {bookOptions.includeDigitalPdf && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Digital PDF</span>}
            {bookOptions.giftWrap && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Gift Wrap</span>}
          </div>
        )}
      </div>

      {bookOptions.dedicationText && (
        <div className="rounded-xl bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-700">Dedication</h4>
          <p className="mt-1 text-sm text-gray-600 italic">&ldquo;{bookOptions.dedicationText}&rdquo;</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary" disabled={loading}>
          Back
        </button>
        <button
          onClick={handleCreateBook}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create My Book'}
        </button>
      </div>
    </div>
  );
}
