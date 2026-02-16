import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../../common/storage.service';

interface CharacterDescription {
  faceShape: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  clothingStyle: string;
  distinguishingFeatures: string[];
  stylePrompt: string;
}

@Injectable()
export class CharacterEngineService {
  private readonly logger = new Logger(CharacterEngineService.name);
  private readonly openai: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
  }

  async extractCharacterFromImage(
    childProfileId: string,
    imageBuffer: Buffer,
    imageExtension: string,
  ): Promise<string> {
    // Store the reference image
    const storageKey = await this.storage.uploadCharacterReference(
      imageBuffer,
      childProfileId,
      imageExtension,
    );
    const imageUrl = await this.storage.getSignedUrl(storageKey);

    // Use GPT-4 Vision to analyze the child's appearance
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert character designer for children's book illustrations. Analyze the child in the photo and create a detailed character description that can be used to maintain consistency across multiple illustrations. Focus on physical features, not clothing (as clothing will vary by story). Respond with JSON only.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this child and create a character description sheet. Return JSON with: faceShape, hairColor, hairStyle, eyeColor, skinTone, clothingStyle (preferred style, not specific outfit), distinguishingFeatures (array), and stylePrompt (a single detailed paragraph describing the character for an illustrator to maintain consistency).',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const description = JSON.parse(response.choices[0].message.content!) as CharacterDescription;

    // Create or update character profile
    const profile = await this.prisma.characterProfile.create({
      data: {
        childProfileId,
        referenceImageUrl: this.storage.getPublicUrl(storageKey),
        faceShape: description.faceShape,
        hairColor: description.hairColor,
        hairStyle: description.hairStyle,
        eyeColor: description.eyeColor,
        skinTone: description.skinTone,
        clothingStyle: description.clothingStyle,
        distinguishingFeatures: description.distinguishingFeatures,
        stylePrompt: description.stylePrompt,
        seed: Math.floor(Math.random() * 2147483647),
      },
    });

    this.logger.log(`Created character profile ${profile.id} for child ${childProfileId}`);
    return profile.id;
  }

  async createManualProfile(
    childProfileId: string,
    description: Partial<CharacterDescription>,
  ): Promise<string> {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childProfileId },
    });
    if (!child) throw new Error('Child profile not found');

    // Auto-generate style prompt if not provided
    let stylePrompt = description.stylePrompt;
    if (!stylePrompt) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a detailed character description for a children\'s book illustrator. Be specific about physical features to ensure consistency across illustrations.',
          },
          {
            role: 'user',
            content: `Create a style prompt for: ${child.name}, age ${child.age}. Features: face shape: ${description.faceShape || 'round'}, hair: ${description.hairColor || 'brown'} ${description.hairStyle || 'short'}, eyes: ${description.eyeColor || 'brown'}, skin: ${description.skinTone || 'medium'}. Create a single paragraph illustrator prompt.`,
          },
        ],
        max_tokens: 300,
      });
      stylePrompt = response.choices[0].message.content!;
    }

    const profile = await this.prisma.characterProfile.create({
      data: {
        childProfileId,
        faceShape: description.faceShape || null,
        hairColor: description.hairColor || null,
        hairStyle: description.hairStyle || null,
        eyeColor: description.eyeColor || null,
        skinTone: description.skinTone || null,
        clothingStyle: description.clothingStyle || null,
        distinguishingFeatures: description.distinguishingFeatures || [],
        stylePrompt,
        seed: Math.floor(Math.random() * 2147483647),
      },
    });

    this.logger.log(`Created manual character profile ${profile.id}`);
    return profile.id;
  }
}
