/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

/**
 * (i) p -> q; (ii) q -> r; (iii) p -> r;
 *
 * With Hypothetical Syllogism, we have two cited lines, each of which is
 * supposed to be a conditional. Let's call them A and B. There are two cases:
 * Either the second operand of A matches the first operand of B, and the second
 * operand of B matches the second operand of the target, and the first operand
 * of A matches the first operand of the target. Or: The same with A and B
 * reversed.
 *
 * Here, we simply enumerate through these cases.
 */
export const hypotheticalSyllogism: DeductionRuleInterface = (
  target,
  sources
) =>
  (sources[0].proposition.operands[1].isEqual(
    // the second operand of A matches the first operand of B
    sources[1].proposition.operands[0]
  ) && // and the first operand of A matches the first operand of the target
  target.proposition.operands[0].isEqual(sources[0].proposition.operands[0]) &&
  target.proposition.operands[1].isEqual(
    // and the second operand of B matches the second operand of the target
    sources[1].proposition.operands[1]
  ) &&
  sources[0].proposition.operator === '->' && // make sure operators are `->`
    sources[1].proposition.operator === '->' &&
    target.proposition.operator === '->') || // OR: Do the same thing again
  (sources[1].proposition.operands[1].isEqual(
    // switching around sources[0]
    sources[0].proposition.operands[0] // and sources[1]
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
