/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Function that checks whether Commutativity applies at the top level
 *
 * @param {Formula} t - Target formula
 * @param {Formula} s - Source formula
 * @return {boolean} - Does Commutativity apply at the top level?
 */
const simpleCommutativity: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === s.operator &&
  t.operator.match(/[V&]/) &&
  t.operands[0].isEqual(s.operands[1]) &&
  t.operands[1].isEqual(s.operands[0]);

export const commutativity: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleCommutativity)(
    target.proposition,
    sources[0].proposition
  );
