import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
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

const AGE_VOCABULARY_LIMITS: Record<string, { maxWords: number; maxSentenceLength: number; complexity: string; readAloudNotes: string }> = {
  '1-3': { maxWords: 20, maxSentenceLength: 6, complexity: 'very simple, repetitive', readAloudNotes: 'Use rhyme, repetition, and onomatopoeia. Every sentence should be fun to say aloud. Think "Brown Bear, Brown Bear" level.' },
  '4-5': { maxWords: 40, maxSentenceLength: 10, complexity: 'simple, clear', readAloudNotes: 'Short declarative sentences with one idea each. Gentle rhythm. Occasional questions to engage the listener. Think "Goodnight Moon" level.' },
  '6-7': { maxWords: 60, maxSentenceLength: 14, complexity: 'moderate, descriptive', readAloudNotes: 'Varied sentence lengths for natural rhythm. Simple dialogue OK. Descriptive but not dense. Think early "Magic Tree House" level.' },
  '8-10': { maxWords: 100, maxSentenceLength: 18, complexity: 'rich, engaging', readAloudNotes: 'Rich vocabulary with context clues. Complex sentences OK but keep them flowing. Dialogue-driven scenes. Think "Charlotte\'s Web" level.' },
  '11-12': { maxWords: 150, maxSentenceLength: 22, complexity: 'advanced, nuanced', readAloudNotes: 'Sophisticated prose with emotional depth. Internal monologue OK. Metaphor and symbolism appropriate. Think "The Phantom Tollbooth" level.' },
};

@Injectable()
export class StoryEngineService {
  private readonly logger = new Logger(StoryEngineService.name);
  private readonly anthropic: Anthropic;
  private readonly storyModel: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: config.get<string>('ANTHROPIC_API_KEY'),
    });
    this.storyModel = config.get<string>(
      'ANTHROPIC_STORY_MODEL',
      'claude-opus-4-6',
    );
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

    const systemPrompt = `You are a world-class children's book author — imagine the creative brilliance of Dr. Seuss, the emotional warmth of Eric Carle, and the narrative craft of Roald Dahl, all combined into one storyteller.

You specialize in creating personalized stories that make children feel like the hero of their own adventure. Your stories are:
- Beautifully paced with natural rhythm perfect for reading aloud
- Emotionally authentic — children feel genuinely seen and celebrated
- Rich with sensory details that spark imagination
- Structurally sound with satisfying narrative arcs
- Age-calibrated down to the year, not just the range

ABSOLUTE SAFETY REQUIREMENTS (non-negotiable):
- ZERO violence, weapons, or physical conflict of any kind
- ZERO scary, dark, or threatening content — no villains, monsters, or dangers that could cause anxiety
- ZERO content involving strangers, separation from parents/guardians (for ages 1-5), or being lost
- ZERO stereotypes, prejudice, or exclusionary language
- ZERO adult themes, innuendo, or content inappropriate for the target age
- ALL conflict must be internal (emotional growth) or environmental (puzzles, challenges) — never interpersonal aggression
- Moral lessons emerge NATURALLY through the story — never preachy, never forced

Respond only with valid JSON.`;

    const userPrompt = `Create a structured story outline for a personalized children's book.

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
- Read-Aloud Notes: ${vocab.readAloudNotes}

NARRATIVE REQUIREMENTS:
- ${child.name} is the protagonist — the story is ABOUT them, not just featuring their name
- Weave ${child.name}'s actual interests (${child.interests.join(', ') || 'adventure'}) into the plot naturally
- Three-act structure: Setup (world + character) → Journey/Challenge (growth) → Resolution (triumph + lesson)
- The emotional arc should feel earned — ${child.name} grows through the experience
- The moral lesson "${book.moralLesson || 'kindness'}" should emerge from the story events, not be stated explicitly
- Include moments of wonder, humor, and warmth
- End with ${child.name} feeling empowered and celebrated

Respond with a JSON object:
{
  "title": "A creative, engaging title that references ${child.name} or their interests",
  "acts": [
    {
      "actNumber": 1,
      "description": "What happens in this act",
      "pages": [1, 2, 3],
      "emotionalArc": "The emotional journey in this act"
    }
  ],
  "moralArc": "How the moral lesson develops through the story",
  "readingLevel": "Specific reading level description",
  "totalPages": ${book.pageCount}
}`;

    const response = await this.anthropic.messages.create({
      model: this.storyModel,
      max_tokens: 2000,
      temperature: 0.85,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const outline = JSON.parse(text) as StoryOutline;

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
      ? `CHARACTER APPEARANCE (use EXACTLY these details in every illustration prompt for consistency):
${book.characterProfile.stylePrompt}
Distinguishing features: ${(book.characterProfile.distinguishingFeatures as string[])?.join(', ') || 'none specified'}
Hair: ${book.characterProfile.hairColor || 'not specified'} ${book.characterProfile.hairStyle || ''}
Eyes: ${book.characterProfile.eyeColor || 'not specified'}
Skin tone: ${book.characterProfile.skinTone || 'not specified'}`
      : `CHARACTER: ${child.name}, a ${child.age}-year-old child`;

    const systemPrompt = `You are a world-class children's book author and illustrator collaborator. You write prose that parents love reading aloud and children beg to hear again.

Your writing style for age ${child.age} (${vocab.complexity}):
${vocab.readAloudNotes}

ABSOLUTE RULES:
- Maximum ${vocab.maxWords} words per page — every word must earn its place
- Maximum ${vocab.maxSentenceLength} words per sentence
- ZERO violence, scary content, unsafe themes, or anything that could distress a child
- Illustration prompts must describe the SAME character consistently on every page
- Every illustration prompt must specify: the character's exact appearance, clothing, expression, pose, and the environment

Respond only with valid JSON.`;

    const userPrompt = `Write the complete page-by-page content for this children's book.

STORY OUTLINE:
${JSON.stringify(outline, null, 2)}

${characterDesc}

CHILD DETAILS:
- Name: ${child.name}
- Age: ${child.age}
- Interests: ${child.interests.join(', ')}

ILLUSTRATION STYLE: ${book.illustrationStyle === 'FULL_COLOR' ? 'Vibrant full-color children\'s book watercolor style with warm lighting, soft edges, and whimsical atmosphere' : 'Clean black and white line art suitable for coloring — clear outlines, no shading, simple shapes'}

PAGE LAYOUT INSTRUCTIONS:
Generate exactly ${book.pageCount} pages. For each page:

1. "pageNumber": Sequential (1-indexed)
2. "text": The story text — beautiful, flowing prose calibrated for age ${child.age}. Read it aloud in your head. Does it flow? Does it sing?
3. "illustrationPrompt": A DETAILED visual description for the AI illustrator. CRITICAL: Include the character's COMPLETE physical description (hair color, eye color, skin tone, clothing) in EVERY prompt — the illustrator has no memory between pages. Describe: character appearance + expression + pose + environment + lighting + mood + key objects.
4. "layoutType": One of TITLE_PAGE, FULL_PAGE_ILLUSTRATION, TEXT_LEFT_IMAGE_RIGHT, TEXT_RIGHT_IMAGE_LEFT, TEXT_BELOW_IMAGE

Vary the layouts naturally. Use FULL_PAGE_ILLUSTRATION for dramatic moments. Use text-with-image layouts for narrative progression.

Respond with: { "pages": [...] }`;

    const response = await this.anthropic.messages.create({
      model: this.storyModel,
      max_tokens: 8000,
      temperature: 0.75,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const result = JSON.parse(text);
    const pages: PageContent[] = result.pages;

    // Store pages in database
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

  /**
   * Structural validation: word count and sentence length per age group.
   * Content safety is handled by ContentSafetyService (Gate 2).
   */
  async validateStructure(text: string, age: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const ageGroup = this.getAgeGroup(age);
    const vocab = AGE_VOCABULARY_LIMITS[ageGroup];

    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length > vocab.maxWords) {
      issues.push(`Page exceeds word limit: ${words.length}/${vocab.maxWords}`);
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).filter(w => w.length > 0);
      if (sentenceWords.length > vocab.maxSentenceLength) {
        issues.push(`Sentence too long: "${sentence.trim().substring(0, 50)}..." (${sentenceWords.length}/${vocab.maxSentenceLength} words)`);
      }
    }

    return { valid: issues.length === 0, issues };
  }
}
