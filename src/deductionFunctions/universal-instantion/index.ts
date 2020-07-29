/* eslint-disable no-unused-vars */
import { DeductionRuleInterface } from '../index';
/* eslint-enable no-unused-vars */

export const universalInstantiation: DeductionRuleInterface = (t, s) => {
  // debugger;
  const target = t.proposition;
  const src = s[0].proposition;
  if (!/^A[a-z]/.test(src.operator)) {
    // Not a universal statement.
    return false;
  }
  const quantifierVar = src.operator[1];
  let scope = src.operands[0].cleansedFormulaString;
  const source = target.cleansedFormulaString;
  const quantifierVarIndex = scope.indexOf(quantifierVar);

  if (quantifierVarIndex === -1) {
    return scope === source;
  }

  const boundVar = source[quantifierVarIndex];
  scope = scope.replace(new RegExp(quantifierVar, 'g'), boundVar);
  return scope === source;
};
