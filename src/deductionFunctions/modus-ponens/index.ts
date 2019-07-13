/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

/**
 * Function that checks for the application of Modus Ponens, a Rule of
 * Implication, of the following form:
 * (i) p; (ii) p -> q; (iii) q
 * The rule has two cited lines, so we first identify the shorter vs. longer
 * one, then check whether the antecedent of the longer proposition matches the
 * shorter proposition, and the consequent matches the target proposition.
 */
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
