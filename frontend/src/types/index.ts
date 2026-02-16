export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  interests: string[];
  favoriteColors: string[];
  personalityTraits: string[];
  favoriteAnimals: string[];
  themes: string[];
}

export interface Book {
  id: string;
  title: string | null;
  status: BookStatus;
  storyType: string;
  illustrationStyle: string;
  bindingType: string;
  paperType: string;
  bookSize: string;
  pageCount: number;
  coverImageUrl: string | null;
  printPdfUrl: string | null;
  digitalPdfUrl: string | null;
  estimatedPrice: number | null;
  childProfile: ChildProfile;
  pages: BookPage[];
  createdAt: string;
}

export interface BookPage {
  id: string;
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  layoutType: string;
  imageUrl: string | null;
  isGenerated: boolean;
}

export type BookStatus =
  | 'DRAFT'
  | 'GENERATING_STORY'
  | 'GENERATING_ILLUSTRATIONS'
  | 'ASSEMBLING_PDF'
  | 'REVIEW_READY'
  | 'APPROVED'
  | 'SENT_TO_PRINT'
  | 'PRINTING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface Order {
  id: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  bookId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  book: Book;
}
