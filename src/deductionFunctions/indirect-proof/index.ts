/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

/**
 * This function identifies a valid application of Indirect Proof.
 * In Indirect Proof, you prove that something is true by demonstrating that
 * *negating* it leads to a contradiction.
 * With indirect proof, a person introduces a new proposition at a given line,
 * and this line is not derived from any other line, it is simply assumed.
 * This is then the Assumption. Then the person will continue to complete the
 * proof. But if they are able to derive a contradition from the assumption,
 * then we can assert the *negation* of the assumption.
 *
 */
export const indirectProof: DeductionRuleInterface = (target, sources) => {
  const [assumption, contradiction] = sources[0].proposition.isNegation(
    target.proposition // The assumption will end up being the
  )                   // negation of the target proposition
    ? [sources[0], sources[1]]
    : [sources[1], sources[0]];
  return (
    target.proposition.isNegation(assumption.proposition) &&
    contradiction.proposition.operator === '&' &&
    contradiction.proposition.operands[0].isNegation(
      contradiction.proposition.operands[1]
    ) // each operand of a contradiction negates the other
  );
};
