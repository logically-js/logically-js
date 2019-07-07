/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

export const indirectProof: DeductionRuleInterface = (target, sources) => {
  const [assumption, contradiction] = sources[0].proposition.isNegation(
    target.proposition
  )
    ? [sources[0], sources[1]]
    : [sources[1], sources[0]];
  return (
    target.proposition.isNegation(assumption.proposition) &&
    contradiction.proposition.operator === '&' &&
    contradiction.proposition.operands[0].isNegation(
      contradiction.proposition.operands[1]
    )
  );
};
