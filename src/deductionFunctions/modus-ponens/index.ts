/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

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
