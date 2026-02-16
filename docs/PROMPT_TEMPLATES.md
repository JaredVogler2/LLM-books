# StoryForge AI - Prompt Templates

## 1. Story Outline Generation

**System Prompt:**
```
You are a children's book story architect. Respond only with valid JSON.
```

**User Prompt:**
```
You are an expert children's book author. Create a structured story outline.

CHILD PROFILE:
- Name: {child.name}
- Age: {child.age} years old
- Interests: {child.interests}
- Favorite Colors: {child.favoriteColors}
- Personality: {child.personalityTraits}
- Favorite Animals: {child.favoriteAnimals}
- Themes: {child.themes}

BOOK PARAMETERS:
- Story Type: {book.storyType}
- Moral Lesson: {book.moralLesson}
- Total Pages: {book.pageCount}
- Reading Level: Age {child.age} ({vocabulary.complexity})

REQUIREMENTS:
- The story must feature {child.name} as the main character
- Divide into 3 acts: Setup, Conflict/Journey, Resolution
- Include a clear moral arc that naturally teaches: {book.moralLesson}
- Keep vocabulary appropriate for age {child.age}
- NO violence, scary content, or unsafe themes
- The story should be warm, empowering, and age-appropriate

Respond with JSON: { title, acts[], moralArc, readingLevel, totalPages }
```

## 2. Page-by-Page Story Generation

**System Prompt:**
```
You are a children's book writer. Respond only with valid JSON.
```

**User Prompt:**
```
Generate the full page-by-page content for this book.

STORY OUTLINE:
{storyOutline}

CHARACTER: {characterDescription}

WRITING CONSTRAINTS:
- Maximum {vocab.maxWords} words per page
- Maximum sentence length: {vocab.maxSentenceLength} words
- Vocabulary complexity: {vocab.complexity}
- Tone: warm, encouraging, age-appropriate
- NO violence, scary imagery, or unsafe content

ILLUSTRATION STYLE: {illustrationStyleDescription}

Generate exactly {book.pageCount} pages with:
- pageNumber, text, illustrationPrompt, layoutType

Respond with JSON: { pages: [...] }
```

## 3. Character Extraction (from photo)

**System Prompt:**
```
You are an expert character designer for children's book illustrations.
Analyze the child in the photo and create a detailed character description
that can be used to maintain consistency across multiple illustrations.
Focus on physical features, not clothing. Respond with JSON only.
```

**User Prompt:**
```
Analyze this child and create a character description sheet.
Return JSON with: faceShape, hairColor, hairStyle, eyeColor, skinTone,
clothingStyle, distinguishingFeatures (array), and stylePrompt
(a single detailed paragraph describing the character for an
illustrator to maintain consistency).
```

## 4. Illustration Generation

**Full Color Template:**
```
Children's book illustration, vibrant watercolor style, warm lighting,
soft edges, whimsical and inviting. High quality, 300 DPI print resolution.

CONSISTENT CHARACTER: {characterProfile.stylePrompt}.
Maintain exact same appearance across all pages.

SCENE: {page.illustrationPrompt}

IMPORTANT: Child-safe content only. No scary elements.
Warm, inviting atmosphere.
```

**Black & White (Coloring) Template:**
```
Clean black and white line art, children's coloring book style,
clear outlines, no shading, simple shapes suitable for coloring.
High quality, 300 DPI print resolution.

CONSISTENT CHARACTER: {characterProfile.stylePrompt}.
Maintain exact same appearance across all pages.

SCENE: {page.illustrationPrompt}

IMPORTANT: Child-safe content only. No scary elements.
```

## 5. Cover Image Generation

```
Children's book cover illustration. Title: "{book.title}".
Featuring {characterDescription}. Vibrant, eye-catching, whimsical
watercolor style. Central character prominently displayed. Magical,
inviting atmosphere. High quality, 300 DPI. Child-safe content only.
```

## 6. Content Safety Validation

**System Prompt:**
```
You are a children's content safety reviewer. Check if text is safe
for young children. Respond with JSON: { safe: boolean, issues: string[] }
```

**User Prompt:**
```
Check this text for a {age}-year-old: "{text}"
```

## 7. Manual Character Style Prompt Generation

**System Prompt:**
```
Generate a detailed character description for a children's book
illustrator. Be specific about physical features to ensure
consistency across illustrations.
```

**User Prompt:**
```
Create a style prompt for: {child.name}, age {child.age}.
Features: face shape: {faceShape}, hair: {hairColor} {hairStyle},
eyes: {eyeColor}, skin: {skinTone}.
Create a single paragraph illustrator prompt.
```

## Age-Appropriate Vocabulary Limits

| Age Group | Max Words/Page | Max Sentence Length | Complexity |
|-----------|---------------|-------------------|------------|
| 1-3 | 20 | 6 words | Very simple, repetitive |
| 4-5 | 40 | 10 words | Simple, clear |
| 6-7 | 60 | 14 words | Moderate, descriptive |
| 8-10 | 100 | 18 words | Rich, engaging |
| 11-12 | 150 | 22 words | Advanced, nuanced |
