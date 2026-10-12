import type { Rule } from "../types";
import { ariaRules } from "./aria";
import { contrastRules } from "./contrast";
import { documentRules } from "./document";
import { formRules } from "./forms";
import { headingRules } from "./headings";
import { imageRules } from "./images";
import { keyboardRules } from "./keyboard";
import { linkRules } from "./links";
import { mediaRules } from "./media";
import { structureRules } from "./structure";
import { tableRules } from "./tables";

/**
 * Every rule the engine knows about, in report display order.
 *
 * Adding a rule here is all that is required for it to run, appear in the
 * report and count towards the score.
 */
export const RULES: Rule[] = [
  ...documentRules,
  ...imageRules,
  ...formRules,
  ...headingRules,
  ...ariaRules,
  ...keyboardRules,
  ...linkRules,
  ...structureRules,
  ...tableRules,
  ...mediaRules,
  ...contrastRules,
];

export type { Rule, RuleFinding } from "../types";
