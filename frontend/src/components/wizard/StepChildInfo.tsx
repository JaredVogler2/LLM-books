'use client';

import { useWizardStore } from '@/lib/store';

const INTEREST_OPTIONS = [
  'Dinosaurs', 'Space', 'Animals', 'Art', 'Music', 'Sports',
  'Science', 'Cooking', 'Nature', 'Superheroes', 'Princesses', 'Robots',
];

const COLOR_OPTIONS = [
  'Red', 'Blue', 'Green', 'Purple', 'Pink', 'Yellow', 'Orange', 'Teal',
];

const TRAIT_OPTIONS = [
  'Curious', 'Brave', 'Kind', 'Funny', 'Creative', 'Adventurous',
  'Gentle', 'Energetic', 'Thoughtful', 'Playful',
];

const ANIMAL_OPTIONS = [
  'Dogs', 'Cats', 'Horses', 'Dolphins', 'Butterflies', 'Bears',
  'Rabbits', 'Birds', 'Elephants', 'Dragons',
];

const THEME_OPTIONS = [
  'Adventure', 'Space', 'Ocean', 'Forest', 'Princess', 'STEM',
  'Soccer', 'Magic', 'Dinosaurs', 'Friendship',
];

interface Props {
  onNext: () => void;
}

function TagSelector({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected.includes(option)
                ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepChildInfo({ onNext }: Props) {
  const { childData, updateChildData } = useWizardStore();

  const canProceed = childData.name.trim() !== '' && childData.age > 0;

  return (
    <div className="card space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Child&apos;s Name *
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter child's name"
            value={childData.name}
            onChange={(e) => updateChildData({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <select
            className="input"
            value={childData.age}
            onChange={(e) => updateChildData({ age: Number(e.target.value) })}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((age) => (
              <option key={age} value={age}>{age} years old</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender (optional)
          </label>
          <select
            className="input"
            value={childData.gender || ''}
            onChange={(e) => updateChildData({ gender: e.target.value })}
          >
            <option value="">Prefer not to say</option>
            <option value="male">Boy</option>
            <option value="female">Girl</option>
            <option value="non-binary">Non-binary</option>
          </select>
        </div>
      </div>

      <TagSelector
        label="Interests (select all that apply)"
        options={INTEREST_OPTIONS}
        selected={childData.interests}
        onChange={(interests) => updateChildData({ interests })}
      />

      <TagSelector
        label="Favorite Colors"
        options={COLOR_OPTIONS}
        selected={childData.favoriteColors}
        onChange={(favoriteColors) => updateChildData({ favoriteColors })}
      />

      <TagSelector
        label="Personality Traits"
        options={TRAIT_OPTIONS}
        selected={childData.personalityTraits}
        onChange={(personalityTraits) => updateChildData({ personalityTraits })}
      />

      <TagSelector
        label="Favorite Animals"
        options={ANIMAL_OPTIONS}
        selected={childData.favoriteAnimals}
        onChange={(favoriteAnimals) => updateChildData({ favoriteAnimals })}
      />

      <TagSelector
        label="Themes"
        options={THEME_OPTIONS}
        selected={childData.themes}
        onChange={(themes) => updateChildData({ themes })}
      />

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Upload Photo
        </button>
      </div>
    </div>
  );
}
