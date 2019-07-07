/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

const simpleTautology: SimpleDeductionRuleInterface = (t, s) => {
  return (
    (s.operator === 'V' &&
      s.operands[0].isEqual(s.operands[1]) &&
      s.operands[0].isEqual(t)) ||
    (t.operator === 'V' &&
      t.operands[0].isEqual(t.operands[1]) &&
      t.operands[0].isEqual(s))
  );
};

export const tautology: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTautology)(
    target.proposition,
    sources[0].proposition
  );
