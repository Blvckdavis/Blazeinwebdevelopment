/**
 * Cultivation-specific types for Overmortal-inspired system
 */

export type CultivationPath = 'Magicka' | 'Corporia' | null;

export interface PathStats {
  qiAbsorptionMult: number;
  physiqueMult: number;
  spiritRootMult: number;
}

export const PATH_CONFIG: Record<string, PathStats> = {
  Magicka: {
    qiAbsorptionMult: 1.5,
    physiqueMult: 0.85, // 15% penalty
    spiritRootMult: 1.0,
  },
  Corporia: {
    qiAbsorptionMult: 0.75, // 25% penalty
    physiqueMult: 1.5,
    spiritRootMult: 1.0,
  },
};

export interface TribulationState {
  completed: boolean;
  attemptCount: number;
  resilientStackCount: number; // 0-3 (max +15%)
  lastAttemptTime: number | null;
}

export interface InternalInjury {
  active: boolean;
  remainingSeconds: number;
  appliedAt: number | null;
}

export interface TribulationBlessing {
  active: boolean;
  remainingSeconds: number;
  statBonus: 1.2; // 20% bonus
}

export const TRIBULATION_CONFIG = {
  BASE_SUCCESS_RATE: 0.5,
  PHYSIQUE_FACTOR: 0.1,
  SPIRIT_ROOT_FACTOR: 0.5,
  INTERNAL_INJURY_DURATION: 60,
  TRIBULATION_BLESSING_DURATION: 300, // 5 minutes
  RESILIENCE_PER_STACK: 0.05,
  MAX_RESILIENCE_STACKS: 3,
  LIGHTNING_FLASH_DURATION: 0.5, // seconds
  EFFECT_TOTAL_DURATION: 3, // seconds
} as const;
