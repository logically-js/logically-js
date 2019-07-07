import { DeductionRuleInterface } from '../index';

export const constructiveDilemma: DeductionRuleInterface = (
  target,
  sources
) => {
  const [conj, disj] =
    sources[0].proposition.cleansedFormulaString.length >
    sources[1].proposition.cleansedFormulaString.length
      ? [sources[0].proposition, sources[1].proposition]
      : [sources[1].proposition, sources[0].proposition];
  console.log(disj.cleansedFormulaString, conj.cleansedFormulaString);
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
