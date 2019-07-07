/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

const simpleTransposition: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === '->' &&
  s.operator === '->' &&
  t.operands[0].isNegation(s.operands[1]) &&
  t.operands[1].isNegation(s.operands[0]);

export const transposition: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTransposition)(
    target.proposition,
    sources[0].proposition
  );
