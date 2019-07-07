/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

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
