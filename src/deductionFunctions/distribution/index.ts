/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */
import { flipOperator } from '../../utils';

import { Formula } from '../../Formula';

const simpleDistribution: SimpleDeductionRuleInterface = (t, s) => {
  const [longer, shorter] =
    s.cleansedFormulaString.length > t.cleansedFormulaString.length
      ? [s, t]
      : [t, s];
  if (
    !(
      shorter.operator.match(/[&V]/) &&
      shorter.operator === flipOperator(shorter.operands[1].operator) &&
      longer.operator === flipOperator(shorter.operator) &&
      longer.operands.every(operand => shorter.operator === operand.operator)
    )
  ) {
    return false;
  }
  const newDisjunct1 = new Formula(
    `(${shorter.operands[0].cleansedFormulaString}) ${shorter.operator} (${shorter.operands[1].operands[0].cleansedFormulaString})`
  );
  const newDisjunct2 = new Formula(
    `(${shorter.operands[0].cleansedFormulaString}) ${shorter.operator} (${shorter.operands[1].operands[1].cleansedFormulaString})`
  );
  return (
    newDisjunct1.isEqual(longer.operands[0]) &&
    newDisjunct2.isEqual(longer.operands[1])
  );
};

export const distribution: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDistribution)(
    target.proposition,
    sources[0].proposition
  );
