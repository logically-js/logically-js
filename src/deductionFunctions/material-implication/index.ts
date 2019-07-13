/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Function for verifying the application of Material Implication, which
 * is a Rule of Equivalence that transforms a conditional into a disjunction,
 * as in: (i) p -> q; (ii) ~p V q. This rule is easily verified by first
 * identifing which input proposition is the conjunction, and which is the
 * disjunction. Then we compare the operands and check that the second operands
 * are equval, and the first operands are negations of each other.
 */
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

/**
 * Function that checks for Material Implication recursively.
 */
export const materialImplication: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleMaterialImplication)(
    target.proposition,
    sources[0].proposition
  );
