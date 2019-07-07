/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';
import { DEDUCTION_RULES } from '../../constants';

export const conditionalProof: DeductionRuleInterface = (target, sources) => {
  const [assumption, goal] =
    sources[0].rule === DEDUCTION_RULES.ASSUMPTION
      ? [sources[0], sources[1]]
      : [sources[1], sources[0]];
  return (
    target.proposition.operator === '->' &&
    target.proposition.operands.some(operand =>
      operand.isEqual(assumption.proposition)
    ) &&
    target.proposition.operands.some(operand =>
      operand.isEqual(goal.proposition)
    )
  );
};
