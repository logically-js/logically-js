/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';
import { DEDUCTION_RULES } from '../../constants';

/**
 * Checks for a valid application of Conditional Proof.
 */
export const conditionalProof: DeductionRuleInterface = (target, sources) => {
  /**
   * A proposition citing `Conditional Proof` must be a conditional.
   * It cites two lines - one is an `Assumption`, and the other is some
   * line that was derived from the assumption ("goal").
   * At any point after making an assumption, that assumption
   * can be discharged by forming a conditional with the assumption
   * as the antecedent and the goal as the consequent.
   */

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
