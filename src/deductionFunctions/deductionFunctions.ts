/* eslint-disable */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from './index';
/* eslint-enable */

import { Formula } from '../Formula';

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

export const associativityFunction: DeductionRuleInterface = (
  target,
  sources
) =>
  checkRuleRecursively(simpleAssociativity)(
    target.proposition,
    sources[0].proposition
  );

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

export const commutativityFunction: DeductionRuleInterface = (
  target,
  sources
) =>
  checkRuleRecursively(simpleCommutativity)(
    target.proposition,
    sources[0].proposition
  );

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

export const doubleNegationFunction: DeductionRuleInterface = (
  target,
  sources
) =>
  checkRuleRecursively(simpleDoubleNegation)(
    target.proposition,
    sources[0].proposition
  );

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

export const tautologyFunction: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTautology)(
    target.proposition,
    sources[0].proposition
  );
