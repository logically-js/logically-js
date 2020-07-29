/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';

import { Formula } from '../../Formula';
/* eslint-enable no-unused-vars */

const prefix = /^(?:~\()?(E[u-z]\(|A[u-z]\()+/;

const simpleQuantifierNegation: SimpleDeductionRuleInterface = (t, s) => {
  // debugger;
  const target = t.cleansedFormulaString;
  const source = s.cleansedFormulaString;
  const negated = /^~\([EA]/.test(target) ? target : source;
  const other = negated === target ? source : target;

  let prefix1 = prefix.exec(negated.slice(2))[0];
  const prefix2 = prefix.exec(other)[0];
  prefix1 = prefix1.replace(/E/g, '$');
  prefix1 = prefix1.replace(/A/g, 'E');
  prefix1 = prefix1.replace(/\$/g, 'A');

  const suffix1 = negated.replace(prefix, '').slice(0, -2);
  const suffix2 = other.replace(prefix, '').slice(0, -1);

  return prefix1 === prefix2 && Formula.isNegation(suffix1, suffix2);
};

/**
 * Checks for applications of Existential Generalization recursively.
 */
export const quantifierNegation: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleQuantifierNegation)(
    target.proposition,
    sources[0].proposition
  );
