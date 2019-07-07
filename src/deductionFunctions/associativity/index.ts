/* eslint-disable-next-list */
import { checkRuleRecursively, DeductionRuleInterface, SimpleDeductionRuleInterface } from '../index';
import { Formula } from '../../Formula';
/**
 * Checks for the application of Associativity at the top level.
 *
 * @param {Formula} t - target proposition
 * @param {Formula} s - source proposition
 * @return {boolean} - Can you go from target to source with Associativity?
 */
const simpleAssociativity: SimpleDeductionRuleInterface = (t, s) => {
  const op = t.operator;
  if (!(op.match(/[&V]/) && op === s.operator)) {
    return false;
  }
  // Try associating to one side
  let operandFormula = t.operands[0];
  if (operandFormula.operator === op) {
    const newFormula = new Formula(
      `(${operandFormula.operands[0].cleansedFormulaString}) ${op} (${operandFormula.operands[1].cleansedFormulaString} ${op} ${t.operands[1].cleansedFormulaString})`
    );
    if (newFormula.isEqual(s)) {
      return true;
    }
  }

  // Try associating to the other direction
  operandFormula = t.operands[1];
  if (operandFormula.operator === op) {
    const newFormula = new Formula(
      `(${t.operands[0].cleansedFormulaString} ${op} ${operandFormula.operands[0].cleansedFormulaString}) ${op} (${operandFormula.operands[1].cleansedFormulaString})`
    );
    if (newFormula.isEqual(s)) {
      return true;
    }
    return false;
  }
};

export const associativity: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleAssociativity)(
    target.proposition,
    sources[0].proposition
  );
