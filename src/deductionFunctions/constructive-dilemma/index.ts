/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

/**
 * Function for checking the valid application of Constructive Dilemma.
 *
 * Constructive Dilemma has a very particular structure, so we just need
 * to identify this structure and then compare the appropriate arguments.
 * Basically, CD consists of a disjunction, and a conjunction of conditionals,
 * as in: (1) p V q; (2) (p -> r) & (q -> s); (3) r V s;
 */
export const constructiveDilemma: DeductionRuleInterface = (
  target,
  sources
) => {
  // First, we identify the conjunction cited line and the disjunction.
  // The conjunction will necessarilly be longer than the disjunction
  // (see (2) vs. (1) abve). Proof: The conjunction contains the same variables
  // as the disjunction, plus two more formulas, plus two more
  // operators as well.
  const [conj, disj] =
    sources[0].proposition.cleansedFormulaString.length >
    sources[1].proposition.cleansedFormulaString.length
      ? [sources[0].proposition, sources[1].proposition]
      : [sources[1].proposition, sources[0].proposition];
  if (
    target.proposition.operator !== 'V' ||
    conj.operator !== '&' ||
    disj.operator !== 'V' ||
    conj.operands[0].operator !== '->' ||
    conj.operands[1].operator !== '->'
  ) {
    return false;
  }

  // This is a "loose" interpretation of CD, where the order of the
  // arguments is ignored.
  return conj.operands
    .map(operand => operand.operands[0].cleansedFormulaString)
    .every(op => disj.operands.map(x => x.cleansedFormulaString).includes(op));
};
