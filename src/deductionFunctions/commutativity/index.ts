/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Function that checks whether Commutativity applies at the top level.
 * Commutativity is fairly easy to identify at this level -
 * the two formulas have the same operators, and the same operands,
 * but in different order.
 *
 * @param t - Target formula
 * @param s - Source formula
 * @return - Does Commutativity apply at the top level?
 */
const simpleCommutativity: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === s.operator &&
  t.operator.match(/[V&]/) &&
  t.operands[0].isEqual(s.operands[1]) &&
  t.operands[1].isEqual(s.operands[0]);

/**
 * We then apply the `checkRuleRecursively` HOF to [[simpleCommutativity]]
 * to check commutativity recursively.
 *
 * @return - Can we reach the `target` from the `source`
 * via `Commutativitiy`?
 */
export const commutativity: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleCommutativity)(
    target.proposition,
    sources[0].proposition
  );
