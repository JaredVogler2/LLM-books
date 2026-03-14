'use client';

import { useWizardStore } from '@/lib/store';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

// ─── Occasion definitions (mirrors backend occasion-registry.ts) ────────────

interface OccasionWizardField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  /** Only show this field when another field has a specific value */
  showWhen?: { field: string; value: string };
}

interface OccasionOption {
  value: string;
  label: string;
  description: string;
  emoji: string;
  fields: OccasionWizardField[];
}

const OCCASIONS: OccasionOption[] = [
  {
    value: 'BIRTHDAY',
    label: 'Birthday',
    description: 'Celebrate turning a new age',
    emoji: '🎂',
    fields: [
      { key: 'turningAge', label: 'What age are they turning?', type: 'number', placeholder: '5', required: true },
      { key: 'birthdayWish', label: "Birthday wish (optional)", type: 'text', placeholder: 'e.g., A puppy, to fly, to visit the moon', required: false },
      { key: 'partyTheme', label: 'Party theme (optional)', type: 'text', placeholder: 'e.g., Dinosaurs, Under the Sea, Superheroes', required: false },
    ],
  },
  {
    value: 'NEW_SIBLING',
    label: 'New Sibling',
    description: 'Welcoming a new baby brother or sister',
    emoji: '👶',
    fields: [
      { key: 'siblingName', label: "Baby's name (or 'the baby')", type: 'text', placeholder: 'e.g., Baby Lily', required: true },
      {
        key: 'siblingRelation', label: 'Becoming a...', type: 'select', required: true,
        options: [
          { value: 'big_brother', label: 'Big Brother' },
          { value: 'big_sister', label: 'Big Sister' },
          { value: 'big_sibling', label: 'Big Sibling' },
        ],
      },
    ],
  },
  {
    value: 'FIRST_DAY_OF_SCHOOL',
    label: 'First Day of School',
    description: 'Starting school or a new grade',
    emoji: '🎒',
    fields: [
      {
        key: 'schoolMilestone', label: 'School milestone', type: 'select', required: true,
        options: [
          { value: 'first_preschool', label: 'First day of preschool' },
          { value: 'first_kindergarten', label: 'First day of kindergarten' },
          { value: 'new_grade', label: 'Starting a new grade' },
          { value: 'new_school', label: 'Starting at a new school' },
        ],
      },
      { key: 'teacherName', label: "Teacher's name (optional)", type: 'text', placeholder: 'e.g., Mrs. Johnson', required: false },
      { key: 'bestFriendName', label: "Best friend's name (optional)", type: 'text', placeholder: 'e.g., Max', required: false },
    ],
  },
  {
    value: 'HOLIDAY',
    label: 'Holiday',
    description: 'A seasonal celebration or holiday story',
    emoji: '🎄',
    fields: [
      {
        key: 'holidayName', label: 'Which holiday?', type: 'select', required: true,
        options: [
          { value: 'christmas', label: 'Christmas' },
          { value: 'hanukkah', label: 'Hanukkah' },
          { value: 'eid', label: 'Eid' },
          { value: 'diwali', label: 'Diwali' },
          { value: 'easter', label: 'Easter' },
          { value: 'thanksgiving', label: 'Thanksgiving' },
          { value: 'lunar_new_year', label: 'Lunar New Year' },
          { value: 'valentines', label: "Valentine's Day" },
          { value: 'halloween', label: 'Halloween' },
          { value: 'kwanzaa', label: 'Kwanzaa' },
          { value: 'other', label: 'Other' },
        ],
      },
      { key: 'holidayCustom', label: 'If "Other", which holiday?', type: 'text', placeholder: 'e.g., Nowruz, Vesak', required: false, showWhen: { field: 'holidayName', value: 'other' } },
      { key: 'familyTradition', label: 'A family tradition to include (optional)', type: 'text', placeholder: 'e.g., We bake cookies together', required: false },
    ],
  },
  {
    value: 'GRADUATION',
    label: 'Graduation',
    description: 'Celebrating a school milestone',
    emoji: '🎓',
    fields: [
      {
        key: 'graduatingFrom', label: 'Graduating from...', type: 'select', required: true,
        options: [
          { value: 'preschool', label: 'Preschool' },
          { value: 'kindergarten', label: 'Kindergarten' },
          { value: 'elementary', label: 'Elementary School' },
          { value: 'middle_school', label: 'Middle School' },
        ],
      },
      { key: 'favoriteMemory', label: 'A favorite school memory (optional)', type: 'text', placeholder: 'e.g., the class hamster, the big science fair', required: false },
    ],
  },
  {
    value: 'MOVING',
    label: 'Moving',
    description: 'The adventure of moving to a new home',
    emoji: '🏠',
    fields: [
      { key: 'newPlace', label: 'Where are you moving to? (optional)', type: 'text', placeholder: 'e.g., a new city, a house with a big yard', required: false },
      { key: 'favoriteThing', label: 'Favorite thing about the old home (optional)', type: 'text', placeholder: 'e.g., the backyard tree, their neighbor friend', required: false },
    ],
  },
  {
    value: 'OVERCOMING_FEARS',
    label: 'Overcoming Fears',
    description: 'Helping conquer a specific fear',
    emoji: '💪',
    fields: [
      {
        key: 'fearType', label: 'What fear?', type: 'select', required: true,
        options: [
          { value: 'dark', label: 'The dark' },
          { value: 'monsters', label: 'Monsters under the bed' },
          { value: 'thunder', label: 'Thunder and storms' },
          { value: 'water', label: 'Water / swimming' },
          { value: 'dogs', label: 'Dogs or animals' },
          { value: 'doctors', label: 'Doctors / dentists' },
          { value: 'sleeping_alone', label: 'Sleeping alone' },
          { value: 'loud_noises', label: 'Loud noises' },
          { value: 'bugs', label: 'Bugs or insects' },
          { value: 'other', label: 'Other' },
        ],
      },
      { key: 'fearCustom', label: 'If "Other", what fear?', type: 'text', placeholder: 'e.g., elevators, haircuts', required: false, showWhen: { field: 'fearType', value: 'other' } },
    ],
  },
  {
    value: 'GET_WELL_SOON',
    label: 'Get Well Soon',
    description: 'A comforting story for an unwell child',
    emoji: '🌈',
    fields: [],
  },
  {
    value: 'TOOTH_FAIRY',
    label: 'Tooth Fairy',
    description: 'A magical tooth fairy adventure',
    emoji: '🧚',
    fields: [
      {
        key: 'whichTooth', label: 'Tooth milestone', type: 'select', required: true,
        options: [
          { value: 'first_tooth', label: 'First tooth lost!' },
          { value: 'another_tooth', label: 'Another tooth lost' },
          { value: 'wiggly_tooth', label: 'Has a wiggly tooth right now' },
        ],
      },
    ],
  },
  {
    value: 'POTTY_TRAINING',
    label: 'Potty Training',
    description: 'Celebrating the potty training milestone',
    emoji: '⭐',
    fields: [],
  },
  {
    value: 'WELCOME_ADOPTION',
    label: 'Welcome Home',
    description: 'Welcoming a child to their forever family',
    emoji: '💜',
    fields: [
      { key: 'familyMessage', label: 'A message from the family (optional)', type: 'text', placeholder: 'e.g., We waited so long for you', required: false },
    ],
  },
  {
    value: 'JUST_BECAUSE',
    label: 'Just Because',
    description: 'No special occasion — just for fun!',
    emoji: '✨',
    fields: [],
  },
];

export function StepOccasion({ onNext, onBack }: Props) {
  const { bookOptions, updateBookOptions } = useWizardStore();

  const selectedOccasion = OCCASIONS.find((o) => o.value === bookOptions.occasion) || OCCASIONS[OCCASIONS.length - 1];

  const updateOccasionContext = (key: string, value: any) => {
    updateBookOptions({
      occasionContext: { ...bookOptions.occasionContext, [key]: value },
    });
  };

  const handleSelectOccasion = (value: string) => {
    // Reset occasion context when switching occasions
    updateBookOptions({ occasion: value, occasionContext: {} });
  };

  // Check if all required fields for the selected occasion are filled
  const requiredFieldsFilled = selectedOccasion.fields
    .filter((f) => f.required)
    .filter((f) => {
      // Don't require fields that aren't visible
      if (f.showWhen && bookOptions.occasionContext[f.showWhen.field] !== f.showWhen.value) {
        return false;
      }
      return true;
    })
    .every((f) => {
      const val = bookOptions.occasionContext[f.key];
      return val !== undefined && val !== '' && val !== null;
    });

  const canProceed = requiredFieldsFilled;

  return (
    <div className="card space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">What&apos;s the occasion?</h3>
        <p className="text-sm text-gray-500 mb-6">
          This helps us create a story perfectly tailored to the moment. Each occasion shapes the narrative, tone, and themes of your child&apos;s book.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {OCCASIONS.map((occasion) => (
            <button
              key={occasion.value}
              onClick={() => handleSelectOccasion(occasion.value)}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                bookOptions.occasion === occasion.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">{occasion.emoji}</span>
              <span className="font-medium text-gray-900 text-sm">{occasion.label}</span>
              <p className="text-xs text-gray-500 mt-1">{occasion.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Occasion-specific fields */}
      {selectedOccasion.fields.length > 0 && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Tell us more about this {selectedOccasion.label.toLowerCase()}
          </h4>
          <div className="space-y-4">
            {selectedOccasion.fields.map((field) => {
              // Handle conditional visibility
              if (field.showWhen) {
                const parentValue = bookOptions.occasionContext[field.showWhen.field];
                if (parentValue !== field.showWhen.value) return null;
              }

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'select' && field.options ? (
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateOccasionContext(field.key, opt.value)}
                          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            bookOptions.occasionContext[field.key] === opt.value
                              ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      className="input w-32"
                      placeholder={field.placeholder}
                      min={1}
                      max={18}
                      value={bookOptions.occasionContext[field.key] || ''}
                      onChange={(e) => updateOccasionContext(field.key, parseInt(e.target.value) || '')}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input"
                      placeholder={field.placeholder}
                      value={bookOptions.occasionContext[field.key] || ''}
                      onChange={(e) => updateOccasionContext(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`btn-primary ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Next: Book Options
        </button>
      </div>
    </div>
  );
}
