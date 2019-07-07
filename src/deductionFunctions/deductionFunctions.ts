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

import { addition } from './addition';
export { addition };
import { associativity } from './associativity';
export { associativity };
import { commutativity } from './commutativity';
export { commutativity };
import { conditionalProof } from './conditional-proof';
export { conditionalProof };
import { conjunction } from './conjunction';
export { conjunction };
import { constructiveDilemma } from './constructive-dilemma';
export { constructiveDilemma };
import { deMorgansRule } from './de-morgans';
export { deMorgansRule };

const simpleDistribution: SimpleDeductionRuleInterface = (t, s) => {
  const [longer, shorter] =
    s.cleansedFormulaString.length > t.cleansedFormulaString.length
      ? [s, t]
      : [t, s];
  if (
    !(
      shorter.operator.match(/[&V]/) &&
      shorter.operator === flipOperator(shorter.operands[1].operator) &&
      longer.operator === flipOperator(shorter.operator) &&
      longer.operands.every(operand => shorter.operator === operand.operator)
    )
  ) {
    return false;
  }
  const newDisjunct1 = new Formula(
    `(${shorter.operands[0].cleansedFormulaString}) ${shorter.operator} (${shorter.operands[1].operands[0].cleansedFormulaString})`
  );
  const newDisjunct2 = new Formula(
    `(${shorter.operands[0].cleansedFormulaString}) ${shorter.operator} (${shorter.operands[1].operands[1].cleansedFormulaString})`
  );
  return (
    newDisjunct1.isEqual(longer.operands[0]) &&
    newDisjunct2.isEqual(longer.operands[1])
  );
};

export const distribution: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDistribution)(
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

export const disjunctiveSyllogism: DeductionRuleInterface = (
  target,
  sources
) => {
  const [disj, other] =
    sources[0].proposition.cleansedFormulaString.length >
    sources[1].proposition.cleansedFormulaString.length
      ? [sources[0].proposition, sources[1].proposition]
      : [sources[1].proposition, sources[0].proposition];
  return (
    disj.operator === 'V' &&
    disj.operands.some(operand => operand.isNegation(other)) &&
    disj.operands.some(operand => operand.isEqual(target.proposition))
  );
};

const simpleExportation: SimpleDeductionRuleInterface = (t, s) => {
  if (!(t.operator === '->' && s.operator === '->')) {
    return false;
  }
  const [exported, unexported] =
    t.operands[1].operator === '->' ? [t, s] : [s, t];
  if (exported.operands[1].operator !== '->') return false;
  if (unexported.operands[0].operator !== '&') return false;
  return (
    exported.operands[0].isEqual(unexported.operands[0].operands[0]) &&
    exported.operands[1].operands[0].isEqual(
      unexported.operands[0].operands[1]
    ) &&
    exported.operands[1].operands[1].isEqual(unexported.operands[1])
  );
};

export const exportation: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleExportation)(
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

export const indirectProof: DeductionRuleInterface = (target, sources) => {
  const [assumption, contradiction] = sources[0].proposition.isNegation(
    target.proposition
  )
    ? [sources[0], sources[1]]
    : [sources[1], sources[0]];
  return (
    target.proposition.isNegation(assumption.proposition) &&
    contradiction.proposition.operator === '&' &&
    contradiction.proposition.operands[0].isNegation(
      contradiction.proposition.operands[1]
    )
  );
};

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

export const modusPonens: DeductionRuleInterface = (target, sources) => {
  const [longer, shorter] =
    sources[0].proposition.cleansedFormulaString.length >
    sources[1].proposition.cleansedFormulaString.length
      ? [sources[0].proposition, sources[1].proposition]
      : [sources[1].proposition, sources[0].proposition];
  return (
    longer.operator === '->' &&
    longer.operands[0].isEqual(shorter) &&
    longer.operands[1].isEqual(target.proposition)
  );
};

export const modusTollens: DeductionRuleInterface = (target, sources) => {
  const [longer, shorter] =
    sources[0].proposition.cleansedFormulaString.length >
    sources[1].proposition.cleansedFormulaString.length
      ? [sources[0].proposition, sources[1].proposition]
      : [sources[1].proposition, sources[0].proposition];
  return (
    longer.operator === '->' &&
    longer.operands[1].isNegation(shorter) &&
    longer.operands[0].isNegation(target.proposition)
  );
};

export const simplification: DeductionRuleInterface = (target, sources) =>
  sources[0].proposition.operands.some(operand =>
    operand.isEqual(target.proposition)
  ) && sources[0].proposition.operator === '&';

const simpleTransposition: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === '->' &&
  s.operator === '->' &&
  t.operands[0].isNegation(s.operands[1]) &&
  t.operands[1].isNegation(s.operands[0]);

export const transposition: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTransposition)(
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
