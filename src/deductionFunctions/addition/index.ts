/* eslint-disable-next-list */
import { DeductionRuleInterface } from '../index';

export const addition: DeductionRuleInterface = (target, sources) =>
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[0].proposition)
  ) && target.proposition.operator === 'V';
