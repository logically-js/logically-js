/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

export const simplification: DeductionRuleInterface = (target, sources) =>
  sources[0].proposition.operands.some(operand =>
    operand.isEqual(target.proposition)
  ) && sources[0].proposition.operator === '&';
