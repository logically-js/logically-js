/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

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
