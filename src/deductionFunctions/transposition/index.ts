/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Transposition involves "flipping the arguments" of a conditional around, as
 * well as "inverting their sign," i.e., negating them. So, to verify
 * this rule at the top level, we just check that both propositions are
 * conditionals,
 */
const simpleTransposition: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === '->' &&
  s.operator === '->' &&
  t.operands[0].isNegation(s.operands[1]) &&
  t.operands[1].isNegation(s.operands[0]);

/**
 * Check for applications of Transposition recursively.
 */
export const transposition: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTransposition)(
    target.proposition,
    sources[0].proposition
  );
