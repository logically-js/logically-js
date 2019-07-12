/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */
import { Formula } from '../../Formula';
/**
 * Checks for the application of Associativity at the top level.
 *
 * (We call these the target and the source, but because rules of
 * replacement apply in both directions, we could use the same rule
 * to go from the target to the source as we use to go from the source
 * to the target.)
 *
 * p V (q V r) ==> (p V q) V r ==> p V (q V r)
 * (p & q) & r ==> p & (q & r) ==> (p & q) & r
 *
 * @param {Formula} t - Target proposition.
 * @param {Formula} s - Source proposition.
 * @return {boolean} - Can you go from target to source with Associativity?
 */
const simpleAssociativity: SimpleDeductionRuleInterface = (t, s) => {
  const op = t.operator;
  if (!(op.match(/[&V]/) && op === s.operator)) {
    return false;
  }
  // Try associating to one side (p V q) V r
  let operandFormula = t.operands[0];
  if (operandFormula.operator === op) {
    // The inner operator has to match the main operator.
    //
    // Now we simply create a new formula by accessing the operands of the
    // disjunctions, e.g., of `t` and moving the parentheses around
    // and then we pass this to the [[Formula.constructor]].
    // Here we end up with a single formula on the left and a grouping of
    // two formulas joined together on the right side, with the correct
    // operator.
    // Once this new [[Formula]] has been constructed, we can use
    // the [[Formula.isEqual]] method to compare it to `s`.
    // If it is equal, then have shown that you can transform the
    // `target` via the relevant rule, Associativity, into a formula
    // that is equal to the `source`, which shows that going from `source`
    // to `target` or vice versa is a valid move.
    const newFormula = new Formula(
      `(${operandFormula.operands[0].cleansedFormulaString}) ${op} (${operandFormula.operands[1].cleansedFormulaString} ${op} ${t.operands[1].cleansedFormulaString})`
    );
    if (newFormula.isEqual(s)) {
      return true;
    }
  }

  // Try next on the other side.
  // Construct a formula that has two formulas attached on the left
  // side, and then joined with a single formula on the right side by the
  // same operator.
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
  // Both attempts to apply the rule have failed. Unfortunately, we cannot
  // conclude that the move was invalid because we only looked at the
  // top level arguments. But we can conclude that you cannot go from
  // `target` to `source` using `Associativity` at the top level.
  // With this simple level of associativity, we use the higher-order
  // component [[checkRuleRecursively]].
  return false;
};

export const associativity: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleAssociativity)(
    target.proposition,
    sources[0].proposition
  );
