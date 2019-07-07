import { checkRuleRecursively, flipOperator, DeductionRuleInterface, SimpleDeductionRuleInterface } from '../index';


const simpleDeMorgansRule: SimpleDeductionRuleInterface = (t, s) => {
  const [negatedFormula, otherFormula] = t.operator === '~' ? [t, s] : [s, t];
  if (!otherFormula.operator.match(/[&V]/)) {
    // the other formula's operator must be a `&` or a `V`
    return false;
  }
  const innerFormula = negatedFormula.operands[0];
  // Order of arguments must be preserved
  return (
    innerFormula.operator === flipOperator(otherFormula.operator) &&
    innerFormula.operands[0].isNegation(otherFormula.operands[0]) &&
    innerFormula.operands[1].isNegation(otherFormula.operands[1])
  );
};

export const deMorgansRule: DeductionRuleInterface = (target, sources) =>
  checkRuleRecursively(simpleDeMorgansRule)(
    target.proposition,
    sources[0].proposition
  );
