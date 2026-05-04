import type Decimal from 'break_infinity.js';
import type { TribulationState, InternalInjury, TribulationBlessing } from '@types/cultivation';
import { TRIBULATION_CONFIG } from '@types/cultivation';

export interface TribulationCalculationInput {
  physique: number;
  spiritRoot: number;
  resilienceStackCount: number;
}

export interface TribulationResult {
  success: boolean;
  successRate: number;
  rolledValue: number;
}

/**
 * Calculate tribulation success probability
 * Formula: 50% base + (Physique × 0.1) + (SpiritRoot × 0.5) + (Resilience × 5%)
 */
export function calculateTribulationSuccessRate(
  input: TribulationCalculationInput
): number {
  const {
    physique,
    spiritRoot,
    resilienceStackCount,
  } = input;

  let rate = TRIBULATION_CONFIG.BASE_SUCCESS_RATE;
  rate += physique * TRIBULATION_CONFIG.PHYSIQUE_FACTOR;
  rate += spiritRoot * TRIBULATION_CONFIG.SPIRIT_ROOT_FACTOR;
  rate += resilienceStackCount * TRIBULATION_CONFIG.RESILIENCE_PER_STACK;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, rate));
}

/**
 * Perform tribulation attempt
 */
export function attemptTribulation(
  input: TribulationCalculationInput
): TribulationResult {
  const successRate = calculateTribulationSuccessRate(input);
  const rolledValue = Math.random();
  const success = rolledValue < successRate;

  return {
    success,
    successRate,
    rolledValue,
  };
}

/**
 * Apply success effects
 */
export function applyTribulationSuccess(
  state: TribulationState
): { newState: TribulationState; blessing: TribulationBlessing } {
  const newState: TribulationState = {
    ...state,
    completed: true,
    attemptCount: state.attemptCount + 1,
    resilientStackCount: 0, // Reset on success
    lastAttemptTime: Date.now(),
  };

  const blessing: TribulationBlessing = {
    active: true,
    remainingSeconds: TRIBULATION_CONFIG.TRIBULATION_BLESSING_DURATION,
    statBonus: 1.2,
  };

  return { newState, blessing };
}

/**
 * Apply failure effects
 */
export function applyTribulationFailure(
  state: TribulationState
): { newState: TribulationState; injury: InternalInjury } {
  const newState: TribulationState = {
    ...state,
    attemptCount: state.attemptCount + 1,
    resilientStackCount: Math.min(
      state.resilientStackCount + 1,
      TRIBULATION_CONFIG.MAX_RESILIENCE_STACKS
    ),
    lastAttemptTime: Date.now(),
  };

  const injury: InternalInjury = {
    active: true,
    remainingSeconds: TRIBULATION_CONFIG.INTERNAL_INJURY_DURATION,
    appliedAt: Date.now(),
  };

  return { newState, injury };
}

/**
 * Tick internal injury duration
 */
export function tickInternalInjury(injury: InternalInjury, deltaTime: number): InternalInjury {
  if (!injury.active) return injury;

  const remaining = injury.remainingSeconds - deltaTime;

  return {
    ...injury,
    active: remaining > 0,
    remainingSeconds: Math.max(0, remaining),
  };
}

/**
 * Tick tribulation blessing duration
 */
export function tickTribulationBlessing(
  blessing: TribulationBlessing,
  deltaTime: number
): TribulationBlessing {
  if (!blessing.active) return blessing;

  const remaining = blessing.remainingSeconds - deltaTime;

  return {
    ...blessing,
    active: remaining > 0,
    remainingSeconds: Math.max(0, remaining),
  };
}
