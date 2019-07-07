/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Function that checks whether Double Negation applies at the top level
 *
 * @param {Formula} t - Target formula
 * @param {Formula} s - Source formula
 * @return {boolean} - Does Double Negation apply at the top level?
 */
const simpleDoubleNegation: SimpleDeductionRuleInterface = (t, s) => {
  // We can identify which argument is the one that had
  // the double negation by its length
  if (t.cleansedFormulaString.length > s.cleansedFormulaString.length) {
    const operandFormula = t.operands[0];
    return (
      t.operator === '~' &&
      operandFormula.operator === '~' &&
      operandFormula.operands[0].isEqual(s)
    );
  } else {
    const operandFormula = s.operands[0];
    return (
      s.operator === '~' &&
      operandFormula.operator === '~' &&
      operandFormula.operands[0].isEqual(t)
    );
  }
};

export const doubleNegation: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDoubleNegation)(
    target.proposition,
    sources[0].proposition
  );
