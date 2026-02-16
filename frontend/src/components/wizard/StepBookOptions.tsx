'use client';

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

export function StepBookOptions({ onNext, onBack }: Props) {
  const { bookOptions, updateBookOptions } = useWizardStore();

  return (
    <div className="card space-y-8">
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

      {/* Book Specifications */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Count</label>
          <select
            className="input"
            value={bookOptions.pageCount}
            onChange={(e) => updateBookOptions({ pageCount: Number(e.target.value) })}
          >
            <option value={12}>12 pages</option>
            <option value={24}>24 pages (recommended)</option>
            <option value={36}>36 pages</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Illustration Style</label>
          <select
            className="input"
            value={bookOptions.illustrationStyle}
            onChange={(e) => updateBookOptions({ illustrationStyle: e.target.value })}
          >
            <option value="FULL_COLOR">Full Color</option>
            <option value="BLACK_WHITE_COLORING">Black & White (Coloring Book)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Binding</label>
          <select
            className="input"
            value={bookOptions.bindingType}
            onChange={(e) => updateBookOptions({ bindingType: e.target.value })}
          >
            <option value="SOFTCOVER">Softcover</option>
            <option value="HARDCOVER">Hardcover (+$10)</option>
            <option value="SPIRAL_BOUND">Spiral Bound (+$5)</option>
            <option value="SADDLE_STITCH">Saddle Stitch (Stapled)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paper Type</label>
          <select
            className="input"
            value={bookOptions.paperType}
            onChange={(e) => updateBookOptions({ paperType: e.target.value })}
          >
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM_MATTE">Premium Matte (+$5)</option>
            <option value="GLOSSY">Glossy (+$8)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Book Size</label>
          <select
            className="input"
            value={bookOptions.bookSize}
            onChange={(e) => updateBookOptions({ bookSize: e.target.value })}
          >
            <option value="SQUARE_8X8">8&quot; x 8&quot; Square</option>
            <option value="PORTRAIT_8_5X11">8.5&quot; x 11&quot; Portrait</option>
            <option value="LANDSCAPE_11X8_5">11&quot; x 8.5&quot; Landscape</option>
          </select>
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
            { key: 'includeAudiobook' as const, label: 'Audiobook Version', price: '+$9.99' },
            { key: 'includeDigitalPdf' as const, label: 'Digital PDF Download', price: '+$4.99' },
            { key: 'giftWrap' as const, label: 'Gift Wrap', price: '+$3.99' },
          ].map((addon) => (
            <label key={addon.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={bookOptions[addon.key]}
                onChange={(e) => updateBookOptions({ [addon.key]: e.target.checked })}
              />
              <span className="text-sm text-gray-700">{addon.label}</span>
              <span className="text-sm text-gray-400">{addon.price}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={onNext} className="btn-primary">Next: Review</button>
      </div>
    </div>
  );
}
