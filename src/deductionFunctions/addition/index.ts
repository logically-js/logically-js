/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

/**
 * Function to identify an application of the rule of `Addition`.
 * Consider a basic case - source: p; target: p | q;
 * We can verify that this is a valid application of `Addition` simply
 * by checking whether any of the 0-2 `target.proposition.operands` is
 * equal to the `source.proposition`, and that the [[Operator]] for the
 * `target` is `V`.
 */
export const addition: DeductionRuleInterface = (target, sources) =>
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[0].proposition)
  ) && target.proposition.operator === 'V';
