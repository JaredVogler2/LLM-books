/**
 * Occasion Prompt Template Registry
 *
 * Each occasion defines:
 *   - wizardFields: Extra fields the frontend should collect for this occasion
 *   - narrativeGuidance: Occasion-specific story structure and tone instructions
 *   - suggestedMoralLessons: Filtered/recommended moral lessons for this occasion
 *   - safetyNotes: Extra safety considerations for the content safety pipeline
 *   - storyTypeCompatibility: Which story styles work best with this occasion
 *
 * The prompt composer in StoryEngineService uses these templates to build
 * occasion-aware prompts dynamically — no markdown files, no external templates.
 * Everything is type-safe, testable, and version-controlled.
 */

export interface OccasionWizardField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface OccasionPromptTemplate {
  occasionType: string;
  label: string;
  description: string;
  emoji: string;
  wizardFields: OccasionWizardField[];
  narrativeGuidance: (ctx: Record<string, any>) => string;
  toneGuidance: string;
  safetyNotes: string;
  suggestedMoralLessons: string[];
  storyTypeCompatibility: string[];
}

// ─── BIRTHDAY ────────────────────────────────────────────────────────────────

const BIRTHDAY: OccasionPromptTemplate = {
  occasionType: 'BIRTHDAY',
  label: 'Birthday',
  description: 'A celebration of your child turning a new age',
  emoji: '🎂',
  wizardFields: [
    {
      key: 'turningAge',
      label: 'What age are they turning?',
      type: 'number',
      placeholder: '5',
      required: true,
    },
    {
      key: 'birthdayWish',
      label: "What's their birthday wish? (optional)",
      type: 'text',
      placeholder: 'e.g., A puppy, to fly, to visit the moon',
      required: false,
    },
    {
      key: 'partyTheme',
      label: 'Party theme (optional)',
      type: 'text',
      placeholder: 'e.g., Dinosaurs, Under the Sea, Superheroes',
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => `OCCASION: BIRTHDAY — ${ctx.childName} is turning ${ctx.turningAge}!

NARRATIVE REQUIREMENTS FOR BIRTHDAY BOOKS:
- The story should BUILD toward a birthday celebration — it is the emotional climax
- The journey/adventure leads to a moment of celebration and recognition
- ${ctx.childName} should feel celebrated, special, and loved throughout
- Weave in the excitement of growing up and what being ${ctx.turningAge} means
- ${ctx.turningAge === 1 ? 'For a 1st birthday: Focus on wonder, love, and "look how far you\'ve come." Keep it about the parents\' love for the child.' : ''}
- ${ctx.birthdayWish ? `Incorporate their birthday wish of "${ctx.birthdayWish}" as a story element — perhaps the adventure IS about pursuing that wish` : 'The story itself is the gift — make it feel like an adventure created just for them'}
- ${ctx.partyTheme ? `Use "${ctx.partyTheme}" as visual/thematic inspiration for the world and settings` : ''}
- The ending should feel like a warm embrace — ${ctx.childName} is loved, celebrated, and ready for the year ahead
- Include moments where characters acknowledge ${ctx.childName}'s growth (what they've learned, how they've grown)

TONE: Joyful, celebratory, warm. This is a GIFT — it should feel like one.`,
  toneGuidance: 'Joyful, celebratory, warm — this book is a gift that celebrates the child',
  safetyNotes: 'No themes of aging anxiety or fear of growing up. Birthday should be purely positive.',
  suggestedMoralLessons: [
    'Self-confidence',
    'Gratitude',
    'Friendship and teamwork',
    'Bravery and courage',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE', 'CHOOSE_YOUR_OWN'],
};

// ─── NEW SIBLING ─────────────────────────────────────────────────────────────

const NEW_SIBLING: OccasionPromptTemplate = {
  occasionType: 'NEW_SIBLING',
  label: 'New Sibling',
  description: "Welcoming a new baby brother or sister",
  emoji: '👶',
  wizardFields: [
    {
      key: 'siblingName',
      label: "Baby's name (or 'the baby' if not yet decided)",
      type: 'text',
      placeholder: 'e.g., Baby Lily, the baby',
      required: true,
    },
    {
      key: 'siblingRelation',
      label: 'Becoming a...',
      type: 'select',
      required: true,
      options: [
        { value: 'big_brother', label: 'Big Brother' },
        { value: 'big_sister', label: 'Big Sister' },
        { value: 'big_sibling', label: 'Big Sibling' },
      ],
    },
  ],
  narrativeGuidance: (ctx) => {
    const roleLabel = ctx.siblingRelation === 'big_brother' ? 'big brother'
      : ctx.siblingRelation === 'big_sister' ? 'big sister' : 'big sibling';
    return `OCCASION: NEW SIBLING — ${ctx.childName} is becoming a ${roleLabel}!

NARRATIVE REQUIREMENTS FOR NEW SIBLING BOOKS:
- ${ctx.childName} is the HERO — this story is about THEIR journey to becoming a ${roleLabel}
- Acknowledge the complex emotions honestly: excitement AND nervousness are both OK
- ${ctx.childName} discovers that being a ${roleLabel} is a special superpower
- Show ${ctx.childName} finding their unique role — what only THEY can teach ${ctx.siblingName || 'the baby'}
- Include a tender moment where ${ctx.childName} first connects with ${ctx.siblingName || 'the baby'}
- Reassure that love is not divided — it MULTIPLIES. Parents' love for ${ctx.childName} doesn't shrink
- End with ${ctx.childName} feeling proud, important, and excited about their new role
- AVOID: jealousy as a dominant theme, feeling replaced, parental neglect even temporarily

TONE: Warm, reassuring, empowering. ${ctx.childName} should feel MORE special, not less.`;
  },
  toneGuidance: 'Warm, reassuring, empowering — the older child should feel more special, not less',
  safetyNotes: 'Extra sensitivity required. Never depict the older child feeling replaced, neglected, or unloved. Jealousy can be briefly acknowledged but must be resolved quickly and positively. No themes of parental favoritism.',
  suggestedMoralLessons: [
    'Kindness and empathy',
    'Sharing and generosity',
    'Self-confidence',
    'Friendship and teamwork',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE'],
};

// ─── FIRST DAY OF SCHOOL ────────────────────────────────────────────────────

const FIRST_DAY_OF_SCHOOL: OccasionPromptTemplate = {
  occasionType: 'FIRST_DAY_OF_SCHOOL',
  label: 'First Day of School',
  description: 'Starting school or a new grade',
  emoji: '🎒',
  wizardFields: [
    {
      key: 'schoolMilestone',
      label: 'What kind of school milestone?',
      type: 'select',
      required: true,
      options: [
        { value: 'first_preschool', label: 'First day of preschool' },
        { value: 'first_kindergarten', label: 'First day of kindergarten' },
        { value: 'new_grade', label: 'Starting a new grade' },
        { value: 'new_school', label: 'Starting at a new school' },
      ],
    },
    {
      key: 'teacherName',
      label: "Teacher's name (optional)",
      type: 'text',
      placeholder: 'e.g., Mrs. Johnson',
      required: false,
    },
    {
      key: 'bestFriendName',
      label: "Best friend's name (optional)",
      type: 'text',
      placeholder: "e.g., Max",
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => `OCCASION: FIRST DAY OF SCHOOL — ${ctx.childName} is starting ${ctx.schoolMilestone === 'first_preschool' ? 'preschool' : ctx.schoolMilestone === 'first_kindergarten' ? 'kindergarten' : ctx.schoolMilestone === 'new_school' ? 'at a new school' : 'a new grade'}!

NARRATIVE REQUIREMENTS FOR FIRST DAY OF SCHOOL BOOKS:
- Open with the morning of the big day — excitement mixed with butterflies
- ${ctx.childName} prepares for school (packing backpack, picking out clothes — relatable details)
- The journey TO school is part of the adventure
- Show ${ctx.childName} discovering that school is full of wonderful surprises
- ${ctx.teacherName ? `Include ${ctx.teacherName} as a warm, welcoming character` : 'Include a kind, welcoming teacher figure'}
- ${ctx.bestFriendName ? `${ctx.bestFriendName} can be a friend ${ctx.childName} connects with` : 'Show the natural process of making a new friend'}
- Address nervousness authentically but resolve it through positive experiences
- End with ${ctx.childName} coming home excited to go back tomorrow
- AVOID: bullying, being lost, harsh teachers, failure, or any negative school experiences

TONE: Brave, exciting, warm. School is an adventure waiting to be discovered.`,
  toneGuidance: 'Brave, exciting, warm — school is an adventure, nervousness is normal and overcome',
  safetyNotes: 'No depiction of bullying, harsh teachers, being lost at school, or any negative school experiences. Separation anxiety for ages 1-5 must be handled very gently — parent always returns.',
  suggestedMoralLessons: [
    'Bravery and courage',
    'Friendship and teamwork',
    'Self-confidence',
    'Respecting differences',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE', 'EDUCATIONAL_STEM'],
};

// ─── HOLIDAY ─────────────────────────────────────────────────────────────────

const HOLIDAY: OccasionPromptTemplate = {
  occasionType: 'HOLIDAY',
  label: 'Holiday',
  description: 'A seasonal celebration or holiday story',
  emoji: '🎄',
  wizardFields: [
    {
      key: 'holidayName',
      label: 'Which holiday?',
      type: 'select',
      required: true,
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
    {
      key: 'holidayCustom',
      label: 'If "Other", which holiday?',
      type: 'text',
      placeholder: 'e.g., Nowruz, Vesak',
      required: false,
    },
    {
      key: 'familyTradition',
      label: 'A family tradition to include (optional)',
      type: 'text',
      placeholder: 'e.g., We bake cookies together, We light candles',
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => {
    const holiday = ctx.holidayName === 'other' ? (ctx.holidayCustom || 'the holiday') : ctx.holidayName;
    return `OCCASION: HOLIDAY — ${ctx.childName}'s ${holiday} story!

NARRATIVE REQUIREMENTS FOR HOLIDAY BOOKS:
- Center the story on the FEELING of ${holiday} — warmth, family, togetherness, magic
- ${ctx.childName} experiences the magic of ${holiday} through an adventure or discovery
- Include sensory details appropriate to the holiday (sights, sounds, smells, tastes)
- ${ctx.familyTradition ? `Weave in the family tradition: "${ctx.familyTradition}" — this makes the book deeply personal` : 'Include general holiday traditions appropriate to the celebration'}
- Focus on universal holiday values: generosity, gratitude, family, love
- Be CULTURALLY RESPECTFUL — represent the holiday traditions authentically
- The story can include magical/fantastical elements appropriate to the holiday's traditions
- End with a warm family moment that captures the spirit of ${holiday}
- ${holiday === 'halloween' ? 'IMPORTANT: Keep Halloween fun and silly, not scary. Costumes, candy, pumpkins — zero frightening content.' : ''}
- AVOID: commercialism as the focus, receiving gifts as the moral, any disrespect to religious/cultural traditions

TONE: Magical, warm, festive. The holiday spirit should radiate from every page.`;
  },
  toneGuidance: 'Magical, warm, festive — the holiday spirit radiates from every page',
  safetyNotes: 'Cultural and religious sensitivity is critical. Represent holiday traditions authentically without stereotyping. Halloween content must be fun/silly, never scary. No commercialism or "getting gifts" as the focus.',
  suggestedMoralLessons: [
    'Kindness and empathy',
    'Sharing and generosity',
    'Gratitude',
    'Friendship and teamwork',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE'],
};

// ─── GRADUATION ──────────────────────────────────────────────────────────────

const GRADUATION: OccasionPromptTemplate = {
  occasionType: 'GRADUATION',
  label: 'Graduation',
  description: 'Celebrating a school milestone',
  emoji: '🎓',
  wizardFields: [
    {
      key: 'graduatingFrom',
      label: 'Graduating from...',
      type: 'select',
      required: true,
      options: [
        { value: 'preschool', label: 'Preschool' },
        { value: 'kindergarten', label: 'Kindergarten' },
        { value: 'elementary', label: 'Elementary School' },
        { value: 'middle_school', label: 'Middle School' },
      ],
    },
    {
      key: 'favoriteMemory',
      label: 'A favorite school memory to include (optional)',
      type: 'text',
      placeholder: 'e.g., the class hamster, the big science fair',
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => `OCCASION: GRADUATION — ${ctx.childName} is graduating from ${ctx.graduatingFrom}!

NARRATIVE REQUIREMENTS FOR GRADUATION BOOKS:
- Frame the story as a journey of growth — look how far ${ctx.childName} has come!
- Include a "looking back" element — memories and milestones from the school year/years
- ${ctx.favoriteMemory ? `Incorporate their favorite memory: "${ctx.favoriteMemory}"` : ''}
- Celebrate specific things ${ctx.childName} has learned and how they've grown
- The climax is the graduation moment — cap, gown, pride, applause
- Include friends, teachers, and family celebrating ${ctx.childName}'s achievement
- End with excitement about what comes NEXT — the future is bright
- This is a keepsake — it should feel timeless and re-readable years later

TONE: Proud, nostalgic, hopeful. A love letter to growth.`,
  toneGuidance: 'Proud, nostalgic, hopeful — a love letter to growth and achievement',
  safetyNotes: 'No anxiety about leaving friends behind or fear of the unknown. Change should be framed as exciting, not scary.',
  suggestedMoralLessons: [
    'Perseverance and hard work',
    'Self-confidence',
    'Gratitude',
    'Friendship and teamwork',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE'],
};

// ─── MOVING ──────────────────────────────────────────────────────────────────

const MOVING: OccasionPromptTemplate = {
  occasionType: 'MOVING',
  label: 'Moving to a New Home',
  description: 'A story about the adventure of moving',
  emoji: '🏠',
  wizardFields: [
    {
      key: 'newPlace',
      label: 'Where are you moving to? (optional)',
      type: 'text',
      placeholder: 'e.g., a new city, a house with a big yard, across the country',
      required: false,
    },
    {
      key: 'favoriteThing',
      label: "Child's favorite thing about the old home (optional)",
      type: 'text',
      placeholder: 'e.g., the backyard tree, their neighbor friend',
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => `OCCASION: MOVING — ${ctx.childName} is moving to a new home!

NARRATIVE REQUIREMENTS FOR MOVING BOOKS:
- Acknowledge that leaving is hard — ${ctx.childName}'s feelings are valid
- ${ctx.favoriteThing ? `Honor what they'll miss: "${ctx.favoriteThing}" — show that memories travel with us` : ''}
- Transform the move into an ADVENTURE — what exciting things await?
- ${ctx.newPlace ? `Build excitement about ${ctx.newPlace} — imagine the possibilities` : 'Build excitement about the unknown — a new room to decorate, new places to explore'}
- Show ${ctx.childName} discovering wonderful things about the new home
- Include a moment of packing where ${ctx.childName} brings something meaningful
- The core message: HOME is where your family and love are, not just a building
- End with ${ctx.childName} beginning to love the new place while keeping old memories safe

TONE: Bittersweet at first, then adventurous and hopeful. Change leads to growth.`,
  toneGuidance: 'Bittersweet at first, then adventurous and hopeful — change leads to wonderful new things',
  safetyNotes: 'Acknowledge sadness about leaving but resolve it positively. Never depict the child as abandoned or lost. The family unit stays together and strong throughout.',
  suggestedMoralLessons: [
    'Bravery and courage',
    'Self-confidence',
    'Friendship and teamwork',
    'Gratitude',
  ],
  storyTypeCompatibility: ['BEDTIME', 'ADVENTURE'],
};

// ─── OVERCOMING FEARS ────────────────────────────────────────────────────────

const OVERCOMING_FEARS: OccasionPromptTemplate = {
  occasionType: 'OVERCOMING_FEARS',
  label: 'Overcoming Fears',
  description: 'Helping your child conquer a specific fear',
  emoji: '💪',
  wizardFields: [
    {
      key: 'fearType',
      label: 'What fear?',
      type: 'select',
      required: true,
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
    {
      key: 'fearCustom',
      label: 'If "Other", what fear?',
      type: 'text',
      placeholder: 'e.g., elevators, haircuts',
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => {
    const fear = ctx.fearType === 'other' ? (ctx.fearCustom || 'their fear') : ctx.fearType.replace(/_/g, ' ');
    return `OCCASION: OVERCOMING FEARS — Helping ${ctx.childName} conquer their fear of ${fear}!

NARRATIVE REQUIREMENTS FOR OVERCOMING FEARS BOOKS:
- Start with ${ctx.childName} encountering ${fear} — show their feelings are VALID and NORMAL
- The journey is about UNDERSTANDING the fear, not pretending it doesn't exist
- ${ctx.childName} discovers a way to face ${fear} through gradual, gentle steps
- Include a mentor/guide character (animal friend, magical helper) who has also been scared before
- The "monster" or fear object is gradually revealed to be misunderstood or manageable
- ${ctx.childName} develops their own coping strategy — THEY are the hero, not rescued by adults
- The climax: ${ctx.childName} faces ${fear} and discovers their own bravery
- End with ${ctx.childName} feeling EMPOWERED — they didn't eliminate the fear, they learned to be brave WITH it
- CRITICAL: Never mock the fear or imply the child is wrong for being scared
- ${fear === 'monsters' ? 'The monsters should turn out to be friendly, silly, or imagined — NEVER actually scary' : ''}
- ${fear === 'dark' ? 'Show the dark as a place of wonder (stars, fireflies, moonlight) — reframe it as magical' : ''}

TONE: Gentle, brave, empowering. The child's feelings are valid. Bravery isn't fearlessness — it's acting despite fear.`;
  },
  toneGuidance: 'Gentle, brave, empowering — bravery means acting despite fear, not being fearless',
  safetyNotes: 'CRITICAL: The fear must never be depicted in a way that makes it WORSE. Monsters must be friendly/silly. The dark must become magical. The feared thing must become manageable. Never mock or minimize the child\'s fear.',
  suggestedMoralLessons: [
    'Bravery and courage',
    'Self-confidence',
    'Perseverance and hard work',
  ],
  storyTypeCompatibility: ['BEDTIME', 'ADVENTURE'],
};

// ─── GET WELL SOON ───────────────────────────────────────────────────────────

const GET_WELL_SOON: OccasionPromptTemplate = {
  occasionType: 'GET_WELL_SOON',
  label: 'Get Well Soon',
  description: 'A comforting story for a child who is unwell',
  emoji: '🌈',
  wizardFields: [],
  narrativeGuidance: (ctx) => `OCCASION: GET WELL SOON — A healing story for ${ctx.childName}!

NARRATIVE REQUIREMENTS FOR GET WELL SOON BOOKS:
- This book is medicine for the spirit — make ${ctx.childName} feel LOVED and thought of
- The story should be an ESCAPE — a magical adventure that takes ${ctx.childName}'s mind off feeling unwell
- ${ctx.childName} goes on an imaginative journey (dream adventure, magical world, etc.)
- Include cozy, comforting imagery: warm blankets, soup, sunshine, gentle rain, favorite things
- Friends and family characters check in and bring kindness
- Show ${ctx.childName} as STRONG — their body is working hard and winning
- The adventure ends with ${ctx.childName} waking up feeling a little better, surrounded by love
- AVOID: Graphic depictions of illness, hospitals (unless context demands it), medical procedures, or anything that could increase anxiety about being sick

TONE: Warm, comforting, hopeful. A hug in book form.`,
  toneGuidance: 'Warm, comforting, hopeful — a hug in book form',
  safetyNotes: 'No graphic illness depictions, no hospital anxiety triggers, no medical procedures. Keep illness vague and focus on comfort, healing, and magical escape.',
  suggestedMoralLessons: [
    'Kindness and empathy',
    'Bravery and courage',
    'Friendship and teamwork',
    'Gratitude',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE'],
};

// ─── TOOTH FAIRY ─────────────────────────────────────────────────────────────

const TOOTH_FAIRY: OccasionPromptTemplate = {
  occasionType: 'TOOTH_FAIRY',
  label: 'Tooth Fairy',
  description: 'A magical tooth fairy adventure',
  emoji: '🧚',
  wizardFields: [
    {
      key: 'whichTooth',
      label: 'Which tooth milestone?',
      type: 'select',
      required: true,
      options: [
        { value: 'first_tooth', label: 'First tooth lost!' },
        { value: 'another_tooth', label: 'Another tooth lost' },
        { value: 'wiggly_tooth', label: 'Has a wiggly tooth right now' },
      ],
    },
  ],
  narrativeGuidance: (ctx) => `OCCASION: TOOTH FAIRY — ${ctx.childName} ${ctx.whichTooth === 'wiggly_tooth' ? 'has a wiggly tooth' : 'lost a tooth'}!

NARRATIVE REQUIREMENTS FOR TOOTH FAIRY BOOKS:
- ${ctx.whichTooth === 'first_tooth' ? `This is a BIG milestone! ${ctx.childName}'s FIRST lost tooth — make it feel monumental and exciting` : ''}
- Take ${ctx.childName} on a magical journey to discover where teeth go and what the Tooth Fairy does with them
- Build a whimsical Tooth Fairy world — castles made of teeth, moonbeam highways, fairy workshops
- ${ctx.childName} gets a special behind-the-scenes tour of the Tooth Fairy's magical operation
- Include fun, age-appropriate "science" about why baby teeth fall out (growing up!)
- The Tooth Fairy recognizes ${ctx.childName} specifically — they've been watching and are proud
- End with the magic of finding something special under the pillow
- AVOID: Pain, blood, dental anxiety, pulling teeth, scary dentist imagery

TONE: Magical, whimsical, exciting. Losing a tooth is a rite of passage to celebrate.`,
  toneGuidance: 'Magical, whimsical, exciting — losing a tooth is a celebration of growing up',
  safetyNotes: 'No depiction of pain, blood, dental procedures, or tooth-pulling. The tooth has already fallen out or is about to fall out naturally. No dental anxiety triggers.',
  suggestedMoralLessons: [
    'Bravery and courage',
    'Self-confidence',
    'Gratitude',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE'],
};

// ─── POTTY TRAINING ──────────────────────────────────────────────────────────

const POTTY_TRAINING: OccasionPromptTemplate = {
  occasionType: 'POTTY_TRAINING',
  label: 'Potty Training',
  description: 'Celebrating the potty training milestone',
  emoji: '⭐',
  wizardFields: [],
  narrativeGuidance: (ctx) => `OCCASION: POTTY TRAINING — ${ctx.childName} is learning to use the potty!

NARRATIVE REQUIREMENTS FOR POTTY TRAINING BOOKS:
- Frame potty training as a GROWING UP milestone — ${ctx.childName} is becoming a big kid!
- Include a relatable character (animal friend, stuffed animal) who is also learning
- Show the process matter-of-factly: recognizing the feeling, going to the potty, washing hands
- Celebrate SUCCESS — every successful trip is a victory
- Normalize accidents — they happen, it's OK, we try again
- Include a "bye-bye diapers" moment that feels triumphant, not shameful
- Parents/caregivers are supportive and patient throughout
- End with ${ctx.childName} feeling proud of their achievement — big kid underwear!
- AVOID: Shame, embarrassment, punishment for accidents, graphic bathroom humor

TONE: Encouraging, matter-of-fact, celebratory. This is a natural milestone, not a source of pressure.`,
  toneGuidance: 'Encouraging, matter-of-fact, celebratory — a natural milestone, not pressure',
  safetyNotes: 'Absolutely no shaming, embarrassment, or punishment for accidents. Keep bathroom content age-appropriate and matter-of-fact. No graphic humor.',
  suggestedMoralLessons: [
    'Perseverance and hard work',
    'Self-confidence',
    'Bravery and courage',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING'],
};

// ─── WELCOME / ADOPTION ─────────────────────────────────────────────────────

const WELCOME_ADOPTION: OccasionPromptTemplate = {
  occasionType: 'WELCOME_ADOPTION',
  label: 'Welcome Home',
  description: 'Welcoming a child to their forever family',
  emoji: '💜',
  wizardFields: [
    {
      key: 'familyMessage',
      label: 'A message from the family (optional)',
      type: 'text',
      placeholder: 'e.g., We waited so long for you, You complete our family',
      required: false,
    },
  ],
  narrativeGuidance: (ctx) => `OCCASION: WELCOME HOME — ${ctx.childName} finds their forever family!

NARRATIVE REQUIREMENTS FOR WELCOME/ADOPTION BOOKS:
- This is one of the most sensitive occasions — handle with extraordinary care and love
- The story is about BELONGING — ${ctx.childName} discovers they were always meant to be here
- Use metaphors: a puzzle piece finding its place, a star finding its constellation, a seed finding its garden
- Show the family actively CHOOSING and WANTING ${ctx.childName} — this isn't passive
- ${ctx.familyMessage ? `Weave in the family's message: "${ctx.familyMessage}"` : 'The core message: you are wanted, you are loved, you are HOME'}
- Include a moment of arrival — crossing a threshold, opening a door — that feels magical
- End with the warmth of family togetherness — ${ctx.childName} is exactly where they belong
- NEVER use language implying the child was "given up" or "unwanted" — they were FOUND and CHOSEN
- AVOID: Any exploration of why the child was adopted, trauma, sadness about previous situations, or questions about biological parents

TONE: Deeply loving, affirming, warm. Every sentence should feel like a warm embrace.`,
  toneGuidance: 'Deeply loving, affirming, warm — every sentence should feel like a warm embrace',
  safetyNotes: 'HIGHEST SENSITIVITY. Never reference being "given up," biological parents, trauma, or abandonment. The child was CHOSEN and WANTED. Use positive adoption language only. No exploration of "why." Focus entirely on love, belonging, and family.',
  suggestedMoralLessons: [
    'Kindness and empathy',
    'Self-confidence',
    'Gratitude',
    'Respecting differences',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING'],
};

// ─── JUST BECAUSE ────────────────────────────────────────────────────────────

const JUST_BECAUSE: OccasionPromptTemplate = {
  occasionType: 'JUST_BECAUSE',
  label: 'Just Because',
  description: "No special occasion — a personalized adventure just for them",
  emoji: '✨',
  wizardFields: [],
  narrativeGuidance: (ctx) => `OCCASION: JUST BECAUSE — A personalized adventure created just for ${ctx.childName}!

NARRATIVE REQUIREMENTS FOR "JUST BECAUSE" BOOKS:
- This book exists to make ${ctx.childName} feel SEEN, CELEBRATED, and SPECIAL
- Build the adventure entirely around ${ctx.childName}'s specific interests and personality
- The story should feel like it could not possibly be about any other child — deep personalization
- Weave in their interests, favorite animals, personality traits, and themes naturally
- Create a world that reflects what ${ctx.childName} loves — if they love space, the adventure is in space; if they love animals, it's in a magical forest
- ${ctx.childName}'s personality traits become their SUPERPOWERS in the story
- End with ${ctx.childName} realizing how special and unique they are

TONE: Joyful, adventurous, personal. This book is a love letter to the child.`,
  toneGuidance: 'Joyful, adventurous, personal — a love letter to the child',
  safetyNotes: 'Standard safety guidelines apply. No additional occasion-specific concerns.',
  suggestedMoralLessons: [
    'Kindness and empathy',
    'Bravery and courage',
    'Self-confidence',
    'Friendship and teamwork',
    'Perseverance and hard work',
  ],
  storyTypeCompatibility: ['BEDTIME', 'RHYMING', 'ADVENTURE', 'CHOOSE_YOUR_OWN', 'EDUCATIONAL_STEM'],
};

// ─── REGISTRY ────────────────────────────────────────────────────────────────

export const OCCASION_TEMPLATES: Record<string, OccasionPromptTemplate> = {
  BIRTHDAY,
  NEW_SIBLING,
  FIRST_DAY_OF_SCHOOL,
  HOLIDAY,
  GRADUATION,
  MOVING,
  OVERCOMING_FEARS,
  GET_WELL_SOON,
  TOOTH_FAIRY,
  POTTY_TRAINING,
  WELCOME_ADOPTION,
  JUST_BECAUSE,
};

/**
 * Compose the occasion-specific narrative guidance for the story engine.
 *
 * Takes the occasion type, the child's name, and any occasion-specific context
 * collected from the wizard, then returns the composed prompt section.
 */
export function composeOccasionPrompt(
  occasionType: string,
  childName: string,
  occasionContext: Record<string, any> = {},
): string {
  const template = OCCASION_TEMPLATES[occasionType] || OCCASION_TEMPLATES.JUST_BECAUSE;
  return template.narrativeGuidance({ childName, ...occasionContext });
}

/**
 * Get the safety notes for a specific occasion.
 * These are passed to the ContentSafetyService for occasion-aware validation.
 */
export function getOccasionSafetyNotes(occasionType: string): string {
  const template = OCCASION_TEMPLATES[occasionType] || OCCASION_TEMPLATES.JUST_BECAUSE;
  return template.safetyNotes;
}
