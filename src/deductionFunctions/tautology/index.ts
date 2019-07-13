/* eslint-disable no-unused-vars */
import {
  checkRuleRecursively,
  DeductionRuleInterface,
  SimpleDeductionRuleInterface
} from '../index';
/* eslint-enable no-unused-vars */

/**
 * Tautology is a very trivial rule for the following scenario:
 * (i) p V p; (ii) p;
 * Observe that disjunction does not in general allow one to detach one of the
 * disjuncts and assert it on its own. However, when applying Tautology, if
 * both disjuncts are the *same propositional variable*, then *of course* it's
 * valid to infer that each "one" is true "on its own." `p V p` is a disjunction
 * so, that means that at least one of the disjuncts must be true, which means
 * that *either* p (on the left) must be true, or p (on the right) must be true.
 * Well, in either case, p is definitely true. So this is clearly a valid move.
 */
const simpleTautology: SimpleDeductionRuleInterface = (t, s) => {
  return (
    (s.operator === 'V' &&
      s.operands[0].isEqual(s.operands[1]) &&
      s.operands[0].isEqual(t)) ||
    (t.operator === 'V' &&
      t.operands[0].isEqual(t.operands[1]) &&
      t.operands[0].isEqual(s))
  );
};

/**
 * Function to apply Tautology recursively.
 */
export const tautology: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleTautology)(
    target.proposition,
    sources[0].proposition
  );
