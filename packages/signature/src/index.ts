/**
 * Shared signature builder for Berghain images
 * Ported from images-generation/images_generation/abbreviations.py
 */

interface ScenarioConfig {
  scenario: number;
  attributes: string[];
  abbreviations: Record<string, string>;
}

// Configuration for each scenario's attribute order and abbreviations
const SCENARIO_CONFIGS: Record<number, ScenarioConfig> = {
  1: {
    scenario: 1,
    attributes: [], // TODO: Fill in scenario 1 attributes from config
    abbreviations: {} // TODO: Fill in scenario 1 abbreviations
  },
  2: {
    scenario: 2, 
    attributes: [], // TODO: Fill in scenario 2 attributes from config
    abbreviations: {} // TODO: Fill in scenario 2 abbreviations
  },
  3: {
    scenario: 3,
    attributes: ['underground_veteran', 'international', 'fashion_forward', 'queer_friendly', 'vinyl_collector', 'german_speaker'],
    abbreviations: {
      'underground_veteran': 'UV',
      'international': 'I', 
      'fashion_forward': 'FF',
      'queer_friendly': 'QF',
      'vinyl_collector': 'VC',
      'german_speaker': 'GS'
    }
  }
};

/**
 * Generate attribute abbreviations (token generation)
 * Ported from make_attribute_tokens in abbreviations.py
 */
function makeAttributeTokens(attrIds: string[]): Record<string, string> {
  const tokens: Record<string, string> = {};
  const used = new Set<string>();

  for (const aid of attrIds) {
    const base = initialToken(aid);
    let token = base;

    if (!used.has(token)) {
      tokens[aid] = token;
      used.add(token);
      continue;
    }

    // Resolve collisions by extending letters from parts
    const parts = aid.split(/[_\-\s]+/).filter(p => p);
    const extended = Array.from(base);
    const idxs = new Array(parts.length).fill(1); // next letter index per part
    const MAX_TRIES = 10;
    let tried = 0;

    while (tried < MAX_TRIES) {
      for (let pi = 0; pi < parts.length; pi++) {
        const part = parts[pi];
        if (idxs[pi] < part.length) {
          extended.push(part[idxs[pi]].toUpperCase());
          idxs[pi]++;
          const candidate = extended.join('');
          if (!used.has(candidate)) {
            token = candidate;
            break;
          }
        }
      }
      if (!used.has(token)) {
        break;
      }
      tried++;
    }

    if (used.has(token)) {
      token = aid.slice(0, 3).toUpperCase();
      let suffix = 1;
      while (used.has(token) && suffix < 100) {
        token = (aid.slice(0, 3) + suffix).toUpperCase();
        suffix++;
      }
    }

    tokens[aid] = token;
    used.add(token);
  }

  return tokens;
}

/**
 * Generate initial token from attribute ID
 * Ported from _initial_token in abbreviations.py
 */
function initialToken(attrId: string): string {
  const parts = attrId.split(/[_\-\s]+/).filter(p => p);
  if (parts.length === 0) {
    return attrId.slice(0, 3).toUpperCase();
  }
  const initials = parts.map(p => p[0]).join('').toUpperCase();
  return initials;
}

/**
 * Encode attribute combination into signature
 * Ported from encode_combo in abbreviations.py
 */
function encodeCombo(bits: number[], tokensOrdered: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < bits.length; i++) {
    const bit = bits[i];
    const tok = tokensOrdered[i];
    parts.push(`${tok}${bit}`);
  }
  return parts.join('_');
}

/**
 * Build signature for a person's attributes in a given scenario
 */
export function buildSignature(scenario: number, attributes: Record<string, boolean>): string {
  const config = SCENARIO_CONFIGS[scenario];
  if (!config) {
    throw new Error(`Unsupported scenario: ${scenario}`);
  }

  // Convert attributes to bits array in the correct order
  const bits: number[] = [];
  for (const attrId of config.attributes) {
    bits.push(attributes[attrId] ? 1 : 0);
  }

  // Get tokens in the same order as attributes
  const tokensOrdered = config.attributes.map(attrId => config.abbreviations[attrId]);

  return encodeCombo(bits, tokensOrdered);
}

/**
 * Extract signature from filename (part after __)
 */
export function extractSignatureFromFilename(filename: string): string | null {
  const match = filename.match(/__([^.]+)\./);
  return match ? match[1] : null;
}

/**
 * Get scenario configuration (for debugging/tooling)
 */
export function getScenarioConfig(scenario: number): ScenarioConfig | null {
  return SCENARIO_CONFIGS[scenario] || null;
}

/**
 * Auto-generate tokens for a scenario (for tooling)
 * This can be used to populate missing scenario configs
 */
export function generateTokensForScenario(attrIds: string[]): Record<string, string> {
  return makeAttributeTokens(attrIds);
}
