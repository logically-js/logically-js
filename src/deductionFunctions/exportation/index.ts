/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * This function checks for the valid application of Exportation at the
 * top level. E.g., (1) (p & q) -> r; (ii) p -> (q -> r); Note that this
 * rule goes in both directions (2) to (1), as it is a Rule of Replacement.
 * In addition, we will adopt a permissive view of Exportation, according to
 * which it does not matter, e.g., whether it is the left operand or the
 * right operand of the conjunction in (1) which is "exported" out to be
 * connected to `r` via a conditional. Thus, we will also accept the following:
 * (1) (p & q) -> r; (ii) q -> (p -> r);
 * In this case, it's the left conjunct that is put in "front of" the right
 * conjunct after Exportation. Although a more strict approach to this rule
 * might require a consistent ordering as to which conjunct gets "exported,"
 * it is easy to show that our more permissive approach is valid:
 *
 * (1) (p & q) -> r  - Premise
 * (ii) (q & p) -> r - Commutativity (i)
 * (iii) q -> (p -> r) - Exportation (ii)
 *
 * Here you can see that you can get from the same starting proposition,
 * and then if you apply Commutativity to change the order around, then you will
 * be able to apply the strict version of Exportation (where the right conjunct)
 * must be the one that associates with the final consequent), and end up in
 * the place that our more "permissive" rule allows. We just needed one extra
 * move to get there, so we think it is reasonable to adopt the permissive rule,
 * at least as a matter of convenience.
 */
const simpleExportation: SimpleDeductionRuleInterface = (t, s) => {
  if (!(t.operator === '->' && s.operator === '->')) {
    return false;
  }
  const [exported, unexported] =
    t.operands[1].operator === '->' ? [t, s] : [s, t];
  if (exported.operands[1].operator !== '->') return false;
  if (unexported.operands[0].operator !== '&') return false;
  return (
    exported.operands[0].isEqual(unexported.operands[0].operands[0]) &&
    exported.operands[1].operands[0].isEqual(
      unexported.operands[0].operands[1]
    ) &&
    exported.operands[1].operands[1].isEqual(unexported.operands[1])
  );
};
/**
 * A rule for checking Exportation recursively.
 */
export const exportation: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleExportation)(
    target.proposition,
    sources[0].proposition
  );
