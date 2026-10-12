import type { WcagCriterion, WcagLevel, WcagPrinciple } from "@/types/analysis";

/**
 * A curated subset of WCAG 2.2 success criteria that the rule engine can map
 * findings onto. Keeping this in one place means the UI, the API and the
 * exported report all describe issues with the same vocabulary.
 */

const UNDERSTANDING = "https://www.w3.org/WAI/WCAG22/Understanding";

interface CriterionSeed {
  title: string;
  level: WcagLevel;
  principle: WcagPrinciple;
  slug: string;
}

const SEED: Record<string, CriterionSeed> = {
  "1.1.1": {
    title: "Non-text Content",
    level: "A",
    principle: "Perceivable",
    slug: "non-text-content",
  },
  "1.2.1": {
    title: "Audio-only and Video-only (Prerecorded)",
    level: "A",
    principle: "Perceivable",
    slug: "audio-only-and-video-only-prerecorded",
  },
  "1.2.2": {
    title: "Captions (Prerecorded)",
    level: "A",
    principle: "Perceivable",
    slug: "captions-prerecorded",
  },
  "1.3.1": {
    title: "Info and Relationships",
    level: "A",
    principle: "Perceivable",
    slug: "info-and-relationships",
  },
  "1.3.5": {
    title: "Identify Input Purpose",
    level: "AA",
    principle: "Understandable",
    slug: "identify-input-purpose",
  },
  "1.4.2": {
    title: "Audio Control",
    level: "A",
    principle: "Perceivable",
    slug: "audio-control",
  },
  "1.4.3": {
    title: "Contrast (Minimum)",
    level: "AA",
    principle: "Perceivable",
    slug: "contrast-minimum",
  },
  "1.4.4": {
    title: "Resize Text",
    level: "AA",
    principle: "Perceivable",
    slug: "resize-text",
  },
  "2.1.1": {
    title: "Keyboard",
    level: "A",
    principle: "Operable",
    slug: "keyboard",
  },
  "2.1.2": {
    title: "No Keyboard Trap",
    level: "A",
    principle: "Operable",
    slug: "no-keyboard-trap",
  },
  "2.4.1": {
    title: "Bypass Blocks",
    level: "A",
    principle: "Operable",
    slug: "bypass-blocks",
  },
  "2.4.2": {
    title: "Page Titled",
    level: "A",
    principle: "Operable",
    slug: "page-titled",
  },
  "2.4.3": {
    title: "Focus Order",
    level: "A",
    principle: "Operable",
    slug: "focus-order",
  },
  "2.4.4": {
    title: "Link Purpose (In Context)",
    level: "A",
    principle: "Operable",
    slug: "link-purpose-in-context",
  },
  "2.4.6": {
    title: "Headings and Labels",
    level: "AA",
    principle: "Operable",
    slug: "headings-and-labels",
  },
  "3.1.1": {
    title: "Language of Page",
    level: "A",
    principle: "Understandable",
    slug: "language-of-page",
  },
  "3.2.5": {
    title: "Change on Request",
    level: "AAA",
    principle: "Understandable",
    slug: "change-on-request",
  },
  "3.3.2": {
    title: "Labels or Instructions",
    level: "A",
    principle: "Understandable",
    slug: "labels-or-instructions",
  },
  "4.1.2": {
    title: "Name, Role, Value",
    level: "A",
    principle: "Robust",
    slug: "name-role-value",
  },
};

/** Resolve one or more criterion ids into full criterion objects. */
export function wcag(...ids: string[]): WcagCriterion[] {
  return ids
    .map((id) => SEED[id] && toCriterion(id, SEED[id]))
    .filter((criterion): criterion is WcagCriterion => Boolean(criterion));
}

function toCriterion(id: string, seed: CriterionSeed): WcagCriterion {
  return {
    id,
    title: seed.title,
    level: seed.level,
    principle: seed.principle,
    url: `${UNDERSTANDING}/${seed.slug}`,
  };
}

/** Every known criterion, sorted by id. Used by the reference panel. */
export const ALL_WCAG: WcagCriterion[] = Object.keys(SEED)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((id) => toCriterion(id, SEED[id]));

const LEVEL_WEIGHT: Record<WcagLevel, number> = { A: 3, AA: 2, AAA: 1 };

/** Highest impact level among a set of criteria (A beats AA beats AAA). */
export function strongestLevel(criteria: WcagCriterion[]): WcagLevel | null {
  let best: WcagLevel | null = null;
  for (const criterion of criteria) {
    if (!best || LEVEL_WEIGHT[criterion.level] > LEVEL_WEIGHT[best]) {
      best = criterion.level;
    }
  }
  return best;
}
