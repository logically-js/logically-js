/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

export const hypotheticalSyllogism: DeductionRuleInterface = (
  target,
  sources
) =>
  (sources[0].proposition.operands[1].isEqual(
    sources[1].proposition.operands[0]
  ) &&
    target.proposition.operands[0].isEqual(
      sources[0].proposition.operands[0]
    ) &&
    target.proposition.operands[1].isEqual(
      sources[1].proposition.operands[1]
    ) &&
    sources[0].proposition.operator === '->' &&
    sources[1].proposition.operator === '->' &&
    target.proposition.operator === '->') ||
  (sources[1].proposition.operands[1].isEqual(
    sources[0].proposition.operands[0]
  ) &&
    target.proposition.operands[0].isEqual(
      sources[1].proposition.operands[0]
    ) &&
    target.proposition.operands[1].isEqual(
      sources[0].proposition.operands[1]
    ) &&
    sources[1].proposition.operator === '->' &&
    sources[0].proposition.operator === '->' &&
    target.proposition.operator === '->');
