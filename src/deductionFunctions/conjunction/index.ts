/* eslint-disable-next-line */
import { DeductionRuleInterface } from '../index';

/**
 * `Conjunction` is another rather trivial rule to identify,
 * and it can only apply at the top level.
 * A Formula that is derived via `Conjunction` is a conjunction
 * and each operand has to match one of the cited lines.
 *
 * @note: This is a slightly permissive version of `conjunction`.
 * Classically, we would expect it to accept a proof like:
 * (1) p V r; (2) q; (3) (p V r) & q
 * However, it also accepts the following: (1) p; (2) q; (3) p & p
 * It isn't clear to me whether this behavior is good or bad.
 * On the plus side it gives a straightforward deduction for:
 * (1) q; (2) q & q; (Although this is already covered by `Tautology`.)
 * *Actually*, it would really depend on the number of cited lines.
 * If there is only one cited line, we might opt to allow the following:
 * (1) p PREMISE []
 * (2) p & p CONJUNCTION [1]
 * But the following would be invalid:
 * (1) p PREMISE []
 * (2) q PREMISE []
 * (3) p & p CONJUNCTION [1, 2]
 *
 * In any case, it's probably best to enforce a more strict version of
 * this function. TODO: See above.
 */
export const conjunction: DeductionRuleInterface = (target, sources) =>
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[0].proposition)
  ) &&
  target.proposition.operands.some(operand =>
    operand.isEqual(sources[1].proposition)
  ) &&
  target.proposition.operator === '&';
