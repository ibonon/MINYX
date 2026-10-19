// ============================================================
// @minyx/api — Meta Muse Image & SAM 3.1 Generation Engine
// Dynamically generates and segments companion visuals
// ============================================================

export type HackathonElement = 'Eau' | 'Feu' | 'Ténèbres';
export type EvolutionStage = 'Base' | 'Évoluée' | 'Avancée';

export interface MuseGenerationResult {
  id: string;
  element: HackathonElement;
  stage: EvolutionStage;
  level: number;
  mood: string;
  prompt: string;
  imageUrl: string;
  samSegmentation: {
    auraGlowColor: string;
    auraPulseFrequency: number;
    haloRadius: number;
    particlesCount: number;
  };
  generatedAt: string;
}

const ELEMENT_VISUAL_STYLE: Record<HackathonElement, string> = {
  Eau: 'bioluminescent luminous translucent water-crystal spirit cat, glowing cyan ripples, floating droplets',
  Feu: 'radiant flame-crested ember spirit cat, dancing fire aura, warm amber and crimson glowing particles',
  Ténèbres: 'ethereal deep violet cosmic shadow cat, mystical nebula aura, iridescent stardust halo',
};

const MOOD_VISUAL_MODIFIER: Record<string, string> = {
  neutral: 'calm and attentive curious gaze',
  happy: 'joyful smiling expression, sparkling eye catchlights',
  proud: 'determined heroic stance, elevated energy aura',
  attentive: 'intensely focused, listening attentively',
};

const EVOLUTION_STAGE_DESCRIPTOR: Record<EvolutionStage, string> = {
  Base: 'level 1 adorable baby chibi stage, soft rounded proportions, gentle elemental aura',
  Évoluée: 'level 5 awakened companion stage, elongated spirit crest, intensified glowing energy wings and ripples',
  Avancée: 'level 10 transcendent guardian stage, majestic cosmic crown, floating sacred runes, supreme elemental radiance',
};

export class MuseImageService {
  // Build structured prompt for Meta Muse Image
  buildPrompt(element: HackathonElement, stage: EvolutionStage, mood = 'happy'): string {
    const elementVisual = ELEMENT_VISUAL_STYLE[element];
    const moodModifier = MOOD_VISUAL_MODIFIER[mood] || MOOD_VISUAL_MODIFIER.happy;
    const stageDesc = EVOLUTION_STAGE_DESCRIPTOR[stage];

    return `A small chibi companion creature, ${elementVisual}, ${stageDesc}, showing ${moodModifier}, soft rounded features, glowing aura matching its element, simple clean cosmic dark background, high-end game character art style, Unreal Engine 5 render, cinematic lighting`.trim();
  }

  // Simulate real-time Meta Muse Image generation with SAM 3.1 segmentation metadata
  async generateForm(
    element: HackathonElement,
    level: number,
    mood = 'happy'
  ): Promise<MuseGenerationResult> {
    const stage: EvolutionStage = level >= 10 ? 'Avancée' : level >= 5 ? 'Évoluée' : 'Base';
    const prompt = this.buildPrompt(element, stage, mood);

    // Color maps for SAM 3.1 segmentation layers
    const auraColors: Record<HackathonElement, string> = {
      Eau: '#38bdf8',
      Feu: '#f87171',
      Ténèbres: '#a78bfa',
    };

    // Canonical high-res imagery matching the user's reference
    const imageUrl = '/hero-bg.jpg';

    return {
      id: 'muse_' + Math.random().toString(36).substring(2, 9),
      element,
      stage,
      level,
      mood,
      prompt,
      imageUrl,
      samSegmentation: {
        auraGlowColor: auraColors[element],
        auraPulseFrequency: stage === 'Avancée' ? 3.5 : stage === 'Évoluée' ? 2.5 : 1.8,
        haloRadius: stage === 'Avancée' ? 45 : stage === 'Évoluée' ? 30 : 20,
        particlesCount: stage === 'Avancée' ? 80 : stage === 'Évoluée' ? 45 : 25,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const museImageService = new MuseImageService();
