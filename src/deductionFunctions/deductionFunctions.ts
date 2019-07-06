/* eslint-disable */
import {
  checkRuleRecursively,
  flipOperator,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from './index';
/* eslint-enable */
import { DEDUCTION_RULES } from '../constants';

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

export const associativity: DeductionRuleInterface = (target, sources) =>
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

export const commutativity: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleCommutativity)(
    target.proposition,
    sources[0].proposition
  );

export const conditionalProof: DeductionRuleInterface = (target, sources) => {
  const [assumption, goal] =
    sources[0].rule === DEDUCTION_RULES.ASSUMPTION
      ? [sources[0], sources[1]]
      : [sources[1], sources[0]];
  return (
    target.proposition.operator === '->' &&
    target.proposition.operands.some(operand =>
      operand.isEqual(assumption.proposition)
    ) &&
    target.proposition.operands.some(operand =>
      operand.isEqual(goal.proposition)
    )
  );
};

export const conjunction: DeductionRuleInterface = (target, sources) =>
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[0].proposition)
  ) &&
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[1].proposition)
  ) &&
  target.proposition.operator === '&';

const simpleDeMorgans: SimpleDeductionRuleInterface = (t, s) => {
  const [negatedFormula, otherFormula] = t.operator === '~' ? [t, s] : [s, t];
  if (!otherFormula.operator.match(/[&V]/)) {
    // the other formula's operator must be a `&` or a `V`
    return false;
  }
  const innerFormula = negatedFormula.operands[0];
  // Order of arguments must be preserved
  return (
    innerFormula.operator === flipOperator(otherFormula.operator) &&
    innerFormula.operands[0].isNegation(otherFormula.operands[0]) &&
    innerFormula.operands[1].isNegation(otherFormula.operands[1])
  );
};

export const deMorgans: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDeMorgans)(
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

export const doubleNegation: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDoubleNegation)(
    target.proposition,
    sources[0].proposition
  );

export const hypotheticalSyllogism: DeductionRuleInterface = (
  target,
  sources
) =>
  (sources[0].proposition.operands[1].isEqual(
    sources[1].proposition.operands[0]
  ) &&
    target.proposition.operands[0].isEqual(
      sources[0].proposition.operands[0]
    ) &&
    target.proposition.operands[1].isEqual(
      sources[1].proposition.operands[1]
    ) &&
    sources[0].proposition.operator === '->' &&
    sources[1].proposition.operator === '->' &&
    target.proposition.operator === '->') ||
  (sources[1].proposition.operands[1].isEqual(
    sources[0].proposition.operands[0]
  ) &&
    target.proposition.operands[0].isEqual(
      sources[1].proposition.operands[0]
    ) &&
    target.proposition.operands[1].isEqual(
      sources[0].proposition.operands[1]
    ) &&
    sources[1].proposition.operator === '->' &&
    sources[0].proposition.operator === '->' &&
    target.proposition.operator === '->');

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

const simpleMaterialEquivalence: SimpleDeductionRuleInterface = (t, s) => {
  const [longer, shorter] =
    t.cleansedFormulaString.length > s.cleansedFormulaString.length
      ? [t, s]
      : [s, t];
  if (longer.operator === '&') {
    const op0 = longer.operands[0];
    const op1 = longer.operands[1];
    return (
      op0.operator === '->' &&
      op1.operator === '->' &&
      op0.operands[0].isEqual(shorter.operands[0]) &&
      op0.operands[1].isEqual(shorter.operands[1]) &&
      op1.operands[0].isEqual(shorter.operands[1]) &&
      op1.operands[1].isEqual(shorter.operands[0])
    );
  } else if (longer.operator === 'V') {
    const op0 = longer.operands[0];
    const op1 = longer.operands[1];
    return (
      op0.operands[0].isEqual(shorter.operands[0]) &&
      op0.operands[1].isEqual(shorter.operands[1]) &&
      op1.operands[0].isNegation(shorter.operands[0]) &&
      op1.operands[1].isNegation(shorter.operands[1])
    );
  } else {
    return false;
  }
};

export const materialEquivalence: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleMaterialEquivalence)(
    target.proposition,
    sources[0].proposition
  );

export const materialImplication: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleMaterialImplication)(
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

export const tautology: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTautology)(
    target.proposition,
    sources[0].proposition
  );
