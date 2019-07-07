/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

const simpleMaterialImplication: SimpleDeductionRuleInterface = (t, s) => {
  const [conditional, disjunction] = t.operator === '->' ? [t, s] : [s, t];
  if (!(conditional.operator === '->' && disjunction.operator === 'V')) {
    return false;
  }
  return (
    t.operands[0].isNegation(s.operands[0]) &&
    t.operands[1].isEqual(s.operands[1])
  );
};

export const materialImplication: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleMaterialImplication)(
    target.proposition,
    sources[0].proposition
  );
