/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */
import { someAndOther } from '../../utils';

/**
 * Checks for the valid application of `Disjunctive Syllogism`.
 *
 * E.g.: (1) p V q; (2) ~p; (3) q;
 *
 * We first identify which of the cited lines is the disjunction by checking
 * which one is longer, since the disjunction must be longer than the
 * negation. (Proof: The disjuntion contains the same main argument as the
 * negation, minus the `~` symbol, plus `V` and another formula.)
 * Once we have done this, we simply identify whether one of operands
 * of the disjunction is the negation of the other cited line, and the
 * other operand is equal to the `target` proposition.
 */
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
    someAndOther(
      disj.operands[0],
      disj.operands[1],
      el => el.isNegation(other),
      el => el.isEqual(target.proposition)
    )
  );
};
