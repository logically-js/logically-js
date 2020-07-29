/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */
import { flipOperator } from '../../utils';

/**
 * Function for identifying valid applications of DeMorgan's Rule at the top
 * level. DeMorgan's Rule is a Rule of Equivalence. It is used for transforming
 * a negated conjunction/disjunction into a disjunction/conjunction of
 * negations (and vice versa). E.g.: (1) ~(p & q); (2) ~p | ~q.
 *
 * To identify this rule (at the top level), we observe that
 * one of the arguments must start with a negation, and the other
 * must either be a conjunction or a disjunction. Once we have done this,
 * it is easy to check whether the operands of the conjunction/disjunction are
 * the negations of the operands of the negation's inner formula.
 */
const simpleDeMorgans: SimpleDeductionRuleInterface = (t, s) => {
  const [negatedFormula, otherFormula] = t.operator === '~' ? [t, s] : [s, t];
  if (negatedFormula.operator !== '~' || !otherFormula.operator.match(/[&V]/)) {
    // the other formula's operator must be a `&` or a `|`
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

/**
 * Function for checking whether DeMorgan's Rule applies recursively.
 */
export const deMorgans: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDeMorgans)(
    target.proposition,
    sources[0].proposition
  );
