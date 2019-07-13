/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

/**
 * Function that checks for the application of Modus Tollens:
 * (i) ~q; (ii) p -> q; (iii) ~p
 * This follows the same logic as [[modusPonens]], except that here we go from
 * the negation of the consequent of a conditional to the negation of the
 * antecedent.
 */
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
