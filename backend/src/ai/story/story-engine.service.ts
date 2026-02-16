import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma.service';

interface StoryOutline {
  title: string;
  acts: Array<{
    actNumber: number;
    description: string;
    pages: number[];
    emotionalArc: string;
  }>;
  moralArc: string;
  readingLevel: string;
  totalPages: number;
}

interface PageContent {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  layoutType: string;
}

const AGE_VOCABULARY_LIMITS: Record<string, { maxWords: number; maxSentenceLength: number; complexity: string }> = {
  '1-3': { maxWords: 20, maxSentenceLength: 6, complexity: 'very simple, repetitive' },
  '4-5': { maxWords: 40, maxSentenceLength: 10, complexity: 'simple, clear' },
  '6-7': { maxWords: 60, maxSentenceLength: 14, complexity: 'moderate, descriptive' },
  '8-10': { maxWords: 100, maxSentenceLength: 18, complexity: 'rich, engaging' },
  '11-12': { maxWords: 150, maxSentenceLength: 22, complexity: 'advanced, nuanced' },
};

@Injectable()
export class StoryEngineService {
  private readonly logger = new Logger(StoryEngineService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
    this.model = config.get('OPENAI_MODEL', 'gpt-4o');
  }

  private getAgeGroup(age: number): string {
    if (age <= 3) return '1-3';
    if (age <= 5) return '4-5';
    if (age <= 7) return '6-7';
    if (age <= 10) return '8-10';
    return '11-12';
  }

  async generateOutline(bookId: string): Promise<StoryOutline> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { childProfile: true },
    });
    if (!book) throw new Error('Book not found');

    const child = book.childProfile;
    const ageGroup = this.getAgeGroup(child.age);
    const vocab = AGE_VOCABULARY_LIMITS[ageGroup];

    const prompt = `You are an expert children's book author. Create a structured story outline.

CHILD PROFILE:
- Name: ${child.name}
- Age: ${child.age} years old
- Interests: ${child.interests.join(', ') || 'general'}
- Favorite Colors: ${child.favoriteColors.join(', ') || 'various'}
- Personality: ${child.personalityTraits.join(', ') || 'curious'}
- Favorite Animals: ${child.favoriteAnimals.join(', ') || 'various'}
- Themes: ${child.themes.join(', ') || 'adventure'}

BOOK PARAMETERS:
- Story Type: ${book.storyType}
- Moral Lesson: ${book.moralLesson || 'kindness and empathy'}
- Total Pages: ${book.pageCount}
- Reading Level: Age ${child.age} (${vocab.complexity})

REQUIREMENTS:
- The story must feature ${child.name} as the main character
- Divide into 3 acts: Setup, Conflict/Journey, Resolution
- Include a clear moral arc that naturally teaches: ${book.moralLesson || 'kindness'}
- Keep vocabulary appropriate for age ${child.age}
- NO violence, scary content, or unsafe themes
- The story should be warm, empowering, and age-appropriate

Respond with a JSON object matching this exact structure:
{
  "title": "string",
  "acts": [
    {
      "actNumber": 1,
      "description": "string",
      "pages": [1, 2, 3, ...],
      "emotionalArc": "string"
    }
  ],
  "moralArc": "string",
  "readingLevel": "string",
  "totalPages": number
}`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a children\'s book story architect. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const outline = JSON.parse(response.choices[0].message.content!) as StoryOutline;

    await this.prisma.book.update({
      where: { id: bookId },
      data: {
        title: outline.title,
        storyOutline: outline as any,
      },
    });

    this.logger.log(`Generated outline for book ${bookId}: "${outline.title}"`);
    return outline;
  }

  async generatePages(bookId: string): Promise<PageContent[]> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        childProfile: true,
        characterProfile: true,
      },
    });
    if (!book || !book.storyOutline) throw new Error('Book or outline not found');

    const child = book.childProfile;
    const ageGroup = this.getAgeGroup(child.age);
    const vocab = AGE_VOCABULARY_LIMITS[ageGroup];
    const outline = book.storyOutline as unknown as StoryOutline;

    const characterDesc = book.characterProfile
      ? `CHARACTER APPEARANCE: ${book.characterProfile.stylePrompt}`
      : `CHARACTER: ${child.name}, a ${child.age}-year-old child`;

    const layoutTypes = [
      'TITLE_PAGE',
      ...Array(book.pageCount - 2).fill(null).map((_, i) => {
        const layouts = ['FULL_PAGE_ILLUSTRATION', 'TEXT_LEFT_IMAGE_RIGHT', 'TEXT_RIGHT_IMAGE_LEFT', 'TEXT_BELOW_IMAGE'];
        return layouts[i % layouts.length];
      }),
      'FULL_PAGE_ILLUSTRATION',
    ];

    if (book.dedicationText) {
      layoutTypes.splice(1, 0, 'DEDICATION_PAGE');
    }

    const prompt = `You are an expert children's book writer. Generate the full page-by-page content for this book.

STORY OUTLINE:
${JSON.stringify(outline, null, 2)}

${characterDesc}

CHILD DETAILS:
- Name: ${child.name}
- Age: ${child.age}
- Interests: ${child.interests.join(', ')}

WRITING CONSTRAINTS:
- Maximum ${vocab.maxWords} words per page
- Maximum sentence length: ${vocab.maxSentenceLength} words
- Vocabulary complexity: ${vocab.complexity}
- Tone: warm, encouraging, age-appropriate
- NO violence, scary imagery, or unsafe content
- Each page must have an illustration prompt describing the scene visually

ILLUSTRATION STYLE: ${book.illustrationStyle === 'FULL_COLOR' ? 'Vibrant full-color children\'s book watercolor style' : 'Clean black and white line art suitable for coloring'}

Generate exactly ${book.pageCount} pages. For each page include:
- pageNumber (1-indexed)
- text (the story text for that page)
- illustrationPrompt (detailed visual description for the illustrator, referencing the character consistently)
- layoutType (one of: TITLE_PAGE, FULL_PAGE_ILLUSTRATION, TEXT_LEFT_IMAGE_RIGHT, TEXT_RIGHT_IMAGE_LEFT, TEXT_BELOW_IMAGE)

Respond with a JSON object: { "pages": [...] }`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a children\'s book writer. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8000,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    const pages: PageContent[] = result.pages;

    // Validate and store pages
    for (const page of pages) {
      await this.prisma.bookPage.upsert({
        where: {
          bookId_pageNumber: { bookId, pageNumber: page.pageNumber },
        },
        update: {
          text: page.text,
          illustrationPrompt: page.illustrationPrompt,
          layoutType: page.layoutType as any,
        },
        create: {
          bookId,
          pageNumber: page.pageNumber,
          text: page.text,
          illustrationPrompt: page.illustrationPrompt,
          layoutType: page.layoutType as any,
        },
      });
    }

    this.logger.log(`Generated ${pages.length} pages for book ${bookId}`);
    return pages;
  }

  async validateContent(text: string, age: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const ageGroup = this.getAgeGroup(age);
    const vocab = AGE_VOCABULARY_LIMITS[ageGroup];

    const words = text.split(/\s+/);
    if (words.length > vocab.maxWords) {
      issues.push(`Page exceeds word limit: ${words.length}/${vocab.maxWords}`);
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/);
      if (sentenceWords.length > vocab.maxSentenceLength) {
        issues.push(`Sentence too long: "${sentence.trim().substring(0, 50)}..." (${sentenceWords.length} words)`);
      }
    }

    // Content safety check via AI
    const safetyResponse = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a children\'s content safety reviewer. Check if text is safe for young children. Respond with JSON: { "safe": boolean, "issues": string[] }',
        },
        {
          role: 'user',
          content: `Check this text for a ${age}-year-old: "${text}"`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const safety = JSON.parse(safetyResponse.choices[0].message.content!);
    if (!safety.safe) {
      issues.push(...safety.issues);
    }

    return { valid: issues.length === 0, issues };
  }
}
