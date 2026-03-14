/**
 * Story Type Prompt Templates
 *
 * These define HOW a story is told (narrative style), separate from
 * the occasion (WHY the book is being made).
 *
 * A birthday book can be told as a rhyming story, a bedtime tale,
 * or an adventure — these are orthogonal axes.
 */

export interface StoryTypeTemplate {
  storyType: string;
  label: string;
  structuralGuidance: string;
  narrativeStyle: string;
  pageCompositionNotes: string;
}

const BEDTIME: StoryTypeTemplate = {
  storyType: 'BEDTIME',
  label: 'Bedtime Story',
  structuralGuidance: `STORY STYLE: BEDTIME
- The narrative arc should gently wind DOWN in energy — start warm, build softly, then ease into calm
- The pacing slows as the story progresses — shorter sentences, quieter imagery near the end
- Final 2-3 pages should be deeply soothing — starlight, soft blankets, warm embraces, sleepy eyes
- Repetitive, rhythmic phrases work beautifully ("and the stars whispered goodnight...")
- The world becomes cozier and quieter page by page
- End with the child feeling safe, warm, and ready to sleep`,
  narrativeStyle: 'Soft, soothing, gently rhythmic — like a warm blanket made of words',
  pageCompositionNotes: 'Illustrations should progress from bright/warm to moonlit/soft. Final pages: warm indoor lighting, soft blues and purples, cozy textures.',
};

const RHYMING: StoryTypeTemplate = {
  storyType: 'RHYMING',
  label: 'Rhyming Book',
  structuralGuidance: `STORY STYLE: RHYMING
- EVERY page must follow a consistent rhyme scheme (AABB or ABAB)
- Maintain natural meter — the rhythm should be SINGABLE, not forced
- CRITICAL: Never sacrifice story clarity for the sake of a rhyme
- Read every couplet aloud mentally — if it doesn't flow naturally, rewrite it
- Use internal rhyme and alliteration for extra musicality
- Varied sentence length within the rhyme scheme keeps it from feeling monotonous
- Think Dr. Seuss: playful, bouncy, surprising rhymes that delight
- The rhyming should feel EFFORTLESS to the reader, as if the words naturally fell into place`,
  narrativeStyle: 'Playful, musical, bouncy — every page should make parents and children smile while reading aloud',
  pageCompositionNotes: 'Illustrations should be dynamic and expressive to match the energy of the rhymes. Bold colors, exaggerated expressions, whimsical environments.',
};

const ADVENTURE: StoryTypeTemplate = {
  storyType: 'ADVENTURE',
  label: 'Adventure',
  structuralGuidance: `STORY STYLE: ADVENTURE
- Strong three-act structure: discovery/call to adventure → journey with escalating wonder → triumphant resolution
- Each page should end with a mini-cliffhanger or moment of wonder that pulls readers to the next page
- Include at least one "gasp moment" — a page turn that reveals something amazing
- The child protagonist makes CHOICES that drive the story forward — they are not passive
- Include a challenge that requires the child's unique strengths (based on their personality traits)
- The world-building should be vivid and immersive — the reader should WANT to live there
- End with the child returning home changed — carrying a lesson, a treasure, or a new perspective`,
  narrativeStyle: 'Exciting, vivid, page-turning — each spread should make the child say "read the next page!"',
  pageCompositionNotes: 'Illustrations should be vivid and immersive. Use dramatic compositions: wide establishing shots for new locations, close-ups for emotional moments. Dynamic poses, rich environments.',
};

const CHOOSE_YOUR_OWN: StoryTypeTemplate = {
  storyType: 'CHOOSE_YOUR_OWN',
  label: 'Choose Your Own',
  structuralGuidance: `STORY STYLE: CHOOSE YOUR OWN ADVENTURE
- Present 2 simple choices at key decision points (approximately every 4-6 pages)
- Each choice should lead to different but equally positive outcomes
- IMPORTANT: Both paths must be equally appealing — no "right" or "wrong" choice
- Keep choices age-appropriate and binary: "Do you go through the blue door or the red door?"
- All paths must converge to a positive ending — no dead ends or bad outcomes
- The choices should reflect the child's personality and interests
- Format choices clearly: "If you want to [A], turn to page X. If you want to [B], turn to page Y."
- For a 24-page book: 2-3 choice points, 3-4 possible endings, all positive`,
  narrativeStyle: 'Interactive, engaging, empowering — the child controls the story',
  pageCompositionNotes: 'Choice pages should have split-layout illustrations showing both options. Path illustrations should feel distinct but equally inviting.',
};

const EDUCATIONAL_STEM: StoryTypeTemplate = {
  storyType: 'EDUCATIONAL_STEM',
  label: 'Educational / STEM',
  structuralGuidance: `STORY STYLE: EDUCATIONAL / STEM
- Embed real learning within an engaging narrative — NEVER lecture
- The adventure naturally encounters STEM concepts that the child helps solve
- Include 3-5 age-appropriate facts or concepts woven into the story
- Learning moments should feel like DISCOVERIES the child makes, not lessons taught
- Use the "wonder → question → explore → discover" cycle
- Include simple, accurate science/math/engineering concepts appropriate to the child's age
- The child's curiosity is their superpower — asking "why?" and "how?" drives the plot
- End with the child excited to learn more — curiosity is celebrated`,
  narrativeStyle: 'Curious, wonder-filled, discovery-driven — learning feels like an adventure',
  pageCompositionNotes: 'Include visual learning elements: labeled diagrams woven into illustrations, visual comparisons, before/after scenes. Keep it playful, not textbook-like.',
};

export const STORY_TYPE_TEMPLATES: Record<string, StoryTypeTemplate> = {
  BEDTIME,
  RHYMING,
  ADVENTURE,
  CHOOSE_YOUR_OWN,
  EDUCATIONAL_STEM,
};

/**
 * Get the story style guidance for a specific story type.
 */
export function composeStoryTypePrompt(storyType: string): string {
  const template = STORY_TYPE_TEMPLATES[storyType] || STORY_TYPE_TEMPLATES.BEDTIME;
  return `${template.structuralGuidance}

ILLUSTRATION NOTES: ${template.pageCompositionNotes}`;
}
