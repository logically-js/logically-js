/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

export const conjunction: DeductionRuleInterface = (target, sources) =>
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[0].proposition)
  ) &&
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[1].proposition)
  ) &&
  target.proposition.operator === '&';
