/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

/**
 * Function that checks for the application of Simplification, which takes
 * a conjunction and reduces it to one of its conjuncts.
 */
export const simplification: DeductionRuleInterface = (target, sources) =>
  sources[0].proposition.operands.some(operand =>
    operand.isEqual(target.proposition)
  ) && sources[0].proposition.operator === '&';
