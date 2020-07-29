/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Function that checks for the application of Material Equivalence.
 * Material Equivalence has two forms, as you can transform a biconditional
 * into either a conjunction of conditionals, or a disjunction of conjunctions:
 * (i) p <-> q; (ii) (p -> q) & (q -> p)
 * (i) p <-> q; (ii) (p & q) | (~p & ~q)
 * We validate this rule by first identifying the longer vs. shorter input
 * proposition. Then we check whether the longer proposition is a `V` case or a
 * `&` case. Then we check whether the operands have the appropriate relations.
 */
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

/**
 * Function that checks for Material Equivalence recursively.
 */
export const materialEquivalence: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleMaterialEquivalence)(
    target.proposition,
    sources[0].proposition
  );
