'use client';

import { useMemo } from 'react';
import { useWizardStore } from '@/lib/store';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const STORY_TYPES = [
  { value: 'BEDTIME', label: 'Bedtime Story', description: 'Calm, soothing tales perfect for winding down' },
  { value: 'RHYMING', label: 'Rhyming Book', description: 'Fun rhythmic stories that are great to read aloud' },
  { value: 'ADVENTURE', label: 'Adventure', description: 'Exciting journeys and discoveries' },
  { value: 'CHOOSE_YOUR_OWN', label: 'Choose Your Own', description: 'Interactive stories with choices' },
  { value: 'EDUCATIONAL_STEM', label: 'Educational / STEM', description: 'Learn while having fun' },
];

const MORAL_LESSONS = [
  'Kindness and empathy',
  'Bravery and courage',
  'Sharing and generosity',
  'Honesty and integrity',
  'Perseverance and hard work',
  'Friendship and teamwork',
  'Self-confidence',
  'Respecting differences',
  'Environmental care',
  'Gratitude',
];

const BINDING_OPTIONS = [
  { value: 'SOFTCOVER', label: 'Softcover', price: 0, description: 'Classic paperback with a flexible cover. Perfect for everyday reading.' },
  { value: 'HARDCOVER', label: 'Hardcover', price: 1000, description: 'Durable casewrap cover that lasts for years. Great as a keepsake or gift.' },
  { value: 'SADDLE_STITCH', label: 'Saddle Stitch', price: 0, description: 'Stapled binding ideal for shorter books (32 pages or fewer).' },
];

const PAPER_OPTIONS = [
  { value: 'STANDARD', label: 'Standard White', price: 0, description: 'Bright white 60# paper. Great quality for vibrant color illustrations.' },
  { value: 'PREMIUM_MATTE', label: 'Premium Matte', price: 500, description: 'Thicker, smooth matte paper with a luxurious feel. Reduces glare.' },
  { value: 'GLOSSY', label: 'Glossy', price: 800, description: 'Shiny, photo-quality finish that makes colors pop. Fingerprint-prone.' },
];

const SIZE_OPTIONS = [
  { value: 'SQUARE_8X8', label: '8" × 8" Square', price: 0, description: 'The classic children\'s book format. Most popular choice.' },
  { value: 'PORTRAIT_8_5X11', label: '8.5" × 11" Portrait', price: 300, description: 'Tall format with more room for detailed illustrations.' },
  { value: 'LANDSCAPE_11X8_5', label: '11" × 8.5" Landscape', price: 300, description: 'Wide format perfect for panoramic scenes and adventures.' },
];

const PAGE_OPTIONS = [
  { value: 12, label: '12 pages', description: 'Short and sweet — perfect for toddlers (ages 1–3).' },
  { value: 24, label: '24 pages', description: 'The standard length. Perfect for ages 4–7. Recommended.' },
  { value: 36, label: '36 pages', description: 'A longer story with more detail. Great for ages 6–10.' },
];

/**
 * Client-side price calculator matching the backend logic.
 * Keeps the wizard responsive without needing API calls on every option change.
 */
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

  // Base price by page count
  if (options.pageCount <= 12) total += 1999;
  else if (options.pageCount <= 24) total += 2499;
  else total += 3499;

  // Binding
  const binding = BINDING_OPTIONS.find((b) => b.value === options.bindingType);
  if (binding) total += binding.price;

  // Paper
  const paper = PAPER_OPTIONS.find((p) => p.value === options.paperType);
  if (paper) total += paper.price;

  // Size
  const size = SIZE_OPTIONS.find((s) => s.value === options.bookSize);
  if (size) total += size.price;

  // Add-ons
  if (options.includeAudiobook) total += 999;
  if (options.includeDigitalPdf) total += 499;
  if (options.giftWrap) total += 399;

  return total;
}

/**
 * Returns validation warnings for incompatible option combinations.
 */
function getValidationWarnings(options: {
  pageCount: number;
  bindingType: string;
  bookSize: string;
}): string[] {
  const warnings: string[] = [];

  if (options.bindingType === 'SADDLE_STITCH' && options.pageCount > 32) {
    warnings.push('Saddle stitch is only available for 32 pages or fewer. Please reduce page count or choose a different binding.');
  }

  if ((options.bindingType === 'SOFTCOVER' || options.bindingType === 'HARDCOVER') && options.pageCount < 24) {
    warnings.push(`${options.bindingType === 'HARDCOVER' ? 'Hardcover' : 'Softcover'} requires at least 24 pages. Choose saddle stitch for shorter books.`);
  }

  if (options.bindingType === 'HARDCOVER' && options.bookSize === 'LANDSCAPE_11X8_5') {
    warnings.push('Hardcover is not available in landscape format. Choose portrait or square, or select a different binding.');
  }

  return warnings;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function StepBookOptions({ onNext, onBack }: Props) {
  const { bookOptions, updateBookOptions } = useWizardStore();

  const estimatedPrice = useMemo(
    () => calculateEstimatedPrice(bookOptions),
    [bookOptions],
  );

  const warnings = useMemo(
    () => getValidationWarnings(bookOptions),
    [bookOptions],
  );

  const hasErrors = warnings.length > 0;

  return (
    <div className="card space-y-8">
      {/* Live Price Estimate */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 px-6 py-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700">Estimated Price</span>
          <span className="text-2xl font-bold text-primary-900">{formatPrice(estimatedPrice)}</span>
        </div>
        <p className="text-xs text-primary-600 mt-1">Price updates as you customize. Shipping calculated at checkout.</p>
      </div>

      {/* Story Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Type</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STORY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateBookOptions({ storyType: type.value })}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                bookOptions.storyType === type.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-900">{type.label}</span>
              <p className="text-xs text-gray-500 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Moral Lesson */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Moral Lesson</h3>
        <div className="flex flex-wrap gap-2">
          {MORAL_LESSONS.map((lesson) => (
            <button
              key={lesson}
              onClick={() => updateBookOptions({ moralLesson: lesson })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                bookOptions.moralLesson === lesson
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lesson}
            </button>
          ))}
        </div>
      </div>

      {/* Page Count */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Count</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateBookOptions({ pageCount: option.value })}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                bookOptions.pageCount === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option.label}</span>
                {option.value === 24 && (
                  <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Illustration Style */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Illustration Style</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => updateBookOptions({ illustrationStyle: 'FULL_COLOR' })}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              bookOptions.illustrationStyle === 'FULL_COLOR'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-medium text-gray-900">Full Color</span>
            <p className="text-xs text-gray-500 mt-1">Vibrant, full-color AI-generated illustrations throughout the book.</p>
          </button>
          <button
            onClick={() => updateBookOptions({ illustrationStyle: 'BLACK_WHITE_COLORING' })}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              bookOptions.illustrationStyle === 'BLACK_WHITE_COLORING'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="font-medium text-gray-900">Black & White (Coloring Book)</span>
            <p className="text-xs text-gray-500 mt-1">Line art illustrations your child can color in themselves. A unique interactive experience.</p>
          </button>
        </div>
      </div>

      {/* Binding Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Binding</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BINDING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateBookOptions({ bindingType: option.value })}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                bookOptions.bindingType === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option.label}</span>
                {option.price > 0 && (
                  <span className="text-xs font-medium text-accent-600">+{formatPrice(option.price)}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Paper Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Paper Type</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PAPER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateBookOptions({ paperType: option.value })}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                bookOptions.paperType === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option.label}</span>
                {option.price > 0 && (
                  <span className="text-xs font-medium text-accent-600">+{formatPrice(option.price)}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Book Size */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Size</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateBookOptions({ bookSize: option.value })}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                bookOptions.bookSize === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{option.label}</span>
                {option.price > 0 && (
                  <span className="text-xs font-medium text-accent-600">+{formatPrice(option.price)}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dedication */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dedication Page (optional)
        </label>
        <textarea
          className="input min-h-[80px]"
          placeholder="For our little star, Emma. Love, Grandma & Grandpa"
          value={bookOptions.dedicationText}
          onChange={(e) => updateBookOptions({ dedicationText: e.target.value })}
        />
      </div>

      {/* Add-ons */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-ons</h3>
        <div className="space-y-3">
          {[
            { key: 'includeAudiobook' as const, label: 'Audiobook Version', price: '+$9.99', description: 'AI-narrated audio version of the story with character voices.' },
            { key: 'includeDigitalPdf' as const, label: 'Digital PDF Download', price: '+$4.99', description: 'A downloadable PDF to read on tablets, phones, or computers.' },
            { key: 'giftWrap' as const, label: 'Gift Wrap', price: '+$3.99', description: 'Beautifully wrapped with a gift tag. Perfect for birthdays or holidays.' },
          ].map((addon) => (
            <label key={addon.key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                className="h-5 w-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={bookOptions[addon.key]}
                onChange={(e) => updateBookOptions({ [addon.key]: e.target.checked })}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{addon.label}</span>
                  <span className="text-sm text-gray-400">{addon.price}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Please fix the following:</p>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-700">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button
          onClick={onNext}
          disabled={hasErrors}
          className={`btn-primary ${hasErrors ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Next: Review
        </button>
      </div>
    </div>
  );
}
