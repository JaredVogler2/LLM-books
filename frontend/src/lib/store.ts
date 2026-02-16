import { create } from 'zustand';

interface ChildData {
  name: string;
  age: number;
  gender?: string;
  interests: string[];
  favoriteColors: string[];
  personalityTraits: string[];
  favoriteAnimals: string[];
  themes: string[];
}

interface BookOptions {
  storyType: string;
  illustrationStyle: string;
  bindingType: string;
  paperType: string;
  bookSize: string;
  pageCount: number;
  moralLesson: string;
  dedicationText: string;
  includeAudiobook: boolean;
  includeDigitalPdf: boolean;
  giftWrap: boolean;
}

interface WizardState {
  currentStep: number;
  childData: ChildData;
  bookOptions: BookOptions;
  childProfileId: string | null;
  characterProfileId: string | null;
  bookId: string | null;
  referenceImage: File | null;

  setStep: (step: number) => void;
  updateChildData: (data: Partial<ChildData>) => void;
  updateBookOptions: (data: Partial<BookOptions>) => void;
  setChildProfileId: (id: string) => void;
  setCharacterProfileId: (id: string) => void;
  setBookId: (id: string) => void;
  setReferenceImage: (file: File | null) => void;
  reset: () => void;
}

const defaultChildData: ChildData = {
  name: '',
  age: 5,
  gender: '',
  interests: [],
  favoriteColors: [],
  personalityTraits: [],
  favoriteAnimals: [],
  themes: [],
};

const defaultBookOptions: BookOptions = {
  storyType: 'BEDTIME',
  illustrationStyle: 'FULL_COLOR',
  bindingType: 'SOFTCOVER',
  paperType: 'STANDARD',
  bookSize: 'SQUARE_8X8',
  pageCount: 24,
  moralLesson: '',
  dedicationText: '',
  includeAudiobook: false,
  includeDigitalPdf: false,
  giftWrap: false,
};

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 0,
  childData: { ...defaultChildData },
  bookOptions: { ...defaultBookOptions },
  childProfileId: null,
  characterProfileId: null,
  bookId: null,
  referenceImage: null,

  setStep: (step) => set({ currentStep: step }),
  updateChildData: (data) =>
    set((state) => ({ childData: { ...state.childData, ...data } })),
  updateBookOptions: (data) =>
    set((state) => ({ bookOptions: { ...state.bookOptions, ...data } })),
  setChildProfileId: (id) => set({ childProfileId: id }),
  setCharacterProfileId: (id) => set({ characterProfileId: id }),
  setBookId: (id) => set({ bookId: id }),
  setReferenceImage: (file) => set({ referenceImage: file }),
  reset: () =>
    set({
      currentStep: 0,
      childData: { ...defaultChildData },
      bookOptions: { ...defaultBookOptions },
      childProfileId: null,
      characterProfileId: null,
      bookId: null,
      referenceImage: null,
    }),
}));
