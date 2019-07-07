/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

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

export const exportation: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleExportation)(
    target.proposition,
    sources[0].proposition
  );
