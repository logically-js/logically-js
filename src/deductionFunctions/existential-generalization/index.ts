/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

import { Formula } from '../../Formula';

const simpleExistentialGeneralization: SimpleDeductionRuleInterface = (
  t,
  s
) => {
  if (!/^[E][a-z]/.test(t.operator)) {
    return false;
  }
  const quantifierVar = t.operator[1];
  let scope = t.operands[0].cleansedFormulaString;
  const source = s.cleansedFormulaString;
  const quantifierVarIndex = scope.indexOf(quantifierVar);
  const vars = Formula.getAtomicVariables(source);
  if (vars.includes(quantifierVar)) {
    return false;
  }

  if (quantifierVarIndex === -1) {
    return scope === source;
  }
  const boundVar = source[quantifierVarIndex];
  scope = scope.replace(new RegExp(quantifierVar, 'g'), boundVar);
  return scope === source;
};

/**
 * Checks for applications of Existential Generalization recursively.
 */
export const existentialGeneralization: DeductionRuleInterface = (
  target,
  sources
) =>
  checkRuleRecursively(simpleExistentialGeneralization)(
    target.proposition,
    sources[0].proposition
  );
