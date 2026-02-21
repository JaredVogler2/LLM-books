'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/lib/store';
import { api } from '@/lib/api';

interface Props {
  onBack: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function calculateEstimatedPrice(options: {
  pageCount: number;
  bindingType: string;
  paperType: string;
  bookSize: string;
  includeAudiobook: boolean;
  includeDigitalPdf: boolean;
  giftWrap: boolean;
}) {
  let total = 0;
  if (options.pageCount <= 12) total += 1999;
  else if (options.pageCount <= 24) total += 2499;
  else total += 3499;
  if (options.bindingType === 'HARDCOVER') total += 1000;
  if (options.paperType === 'PREMIUM_MATTE') total += 500;
  else if (options.paperType === 'GLOSSY') total += 800;
  if (options.bookSize === 'PORTRAIT_8_5X11' || options.bookSize === 'LANDSCAPE_11X8_5') total += 300;
  if (options.includeAudiobook) total += 999;
  if (options.includeDigitalPdf) total += 499;
  if (options.giftWrap) total += 399;
  return total;
}

export function StepReview({ onBack }: Props) {
  const router = useRouter();
  const { childData, bookOptions, referenceImage } = useWizardStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedPrice = useMemo(() => calculateEstimatedPrice(bookOptions), [bookOptions]);

  const handleProceedToCheckout = async () => {
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

      // Step 2: Create book configuration (generation starts after payment)
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

      // Step 3: Redirect to checkout — payment first, then generation
      router.push(`/checkout/${book.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

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
          {childData.favoriteAnimals.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Favorite Animals:</span> {childData.favoriteAnimals.join(', ')}
            </div>
          )}
          {childData.personalityTraits.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Personality:</span> {childData.personalityTraits.join(', ')}
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
            {bookOptions.includeAudiobook && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Audiobook +$9.99</span>}
            {bookOptions.includeDigitalPdf && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Digital PDF +$4.99</span>}
            {bookOptions.giftWrap && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Gift Wrap +$3.99</span>}
          </div>
        )}
      </div>

      {bookOptions.dedicationText && (
        <div className="rounded-xl bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-700">Dedication</h4>
          <p className="mt-1 text-sm text-gray-600 italic">&ldquo;{bookOptions.dedicationText}&rdquo;</p>
        </div>
      )}

      {/* Price Summary */}
      <div className="rounded-xl bg-primary-50 border border-primary-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary-800">Estimated Book Price</span>
          <span className="text-2xl font-bold text-primary-900">{formatPrice(estimatedPrice)}</span>
        </div>
        <p className="text-xs text-primary-600 mt-1">Shipping and tax calculated at checkout.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary" disabled={loading}>
          Back
        </button>
        <button
          onClick={handleProceedToCheckout}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Preparing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}
