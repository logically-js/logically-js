/* eslint-disable no-unused-vars */
import { LineOfProof, Proof } from '../Proof';
import { Formula } from '../Formula';
/* eslint-enable no-unused-vars */
import { CITED_LINES_COUNT, DEDUCTION_RULES } from '../constants';
import * as DF from './deductionFunctions';

/**
 * Takes a line of proof and a proof and determines if the line is a valid move.
 *
 * @param move - The move currently being considered.
 * @param proof - The proof being considered.
 * @return - Is the move valid?
 */
export const evaluateMove = (move: LineOfProof, proof: Proof): boolean =>
  CITED_LINES_COUNT[move.rule] === move.citedLines.length &&
  DEDUCTION_FUNCTIONS[move.rule](
    move,
    move.citedLines.map(line => proof.lines[line - 1])
  );

export interface DeductionRuleInterface {
  (target: LineOfProof, sources?: LineOfProof[]): boolean;
}

interface DeductionRulesDictInterface {
  [deductionRule: string]: DeductionRuleInterface;
}

/**
 * Interface for checking a natural deduction rule of equivalence that has only
 * one source formula and is only checked at the top level/main operator.
 */
export interface SimpleDeductionRuleInterface {
  (target: Formula, source: Formula): boolean;
}

/**
 * Higher-order function that takes a SimpleDeductionRule and converts it to a
 * function that recursively checks whether it applies to a formula
 * and its subformulas.
 *
 * @param rule - Top-level rule-checking function
 * @return - A recursive version of the input
 */
export const checkRuleRecursively = (
  rule: SimpleDeductionRuleInterface
): SimpleDeductionRuleInterface => (...args) => {
  const [target, source] = args;
  if (rule(target, source)) return true;

  // If both formulas start with negation, recurse inwards on both
  if (target.operator === '~' && source.operator === '~') {
    return checkRuleRecursively(rule)(target.operands[0], source.operands[0]);
  }

  // If left operands match, recurse to the rights
  if (
    target.operands[0]?.isEqual(source.operands[0]) &&
    target.operator === source.operator
  ) {
    if (checkRuleRecursively(rule)(target.operands[1], source.operands[1])) {
      return true;
    }
  }

  // If right operands match, recurse to the left
  if (
    target.operands[1]?.isEqual(source.operands[1]) &&
    target.operator === source.operator
  ) {
    if (checkRuleRecursively(rule)(target.operands[0], source.operands[0])) {
      return true;
    }
  }
  return false;
};

// TODO: DEAL WITH ERRORS. VALIDATING ARGUMENTS FOR DEDUCTION RULES

/**
 * Rules of implication are easier to compute because they only apply to the
 * main operator and only go in "one direction."
 *
 * If there isn't an obvious strategy for identifying the application of
 * a rule of replacement, we attempt to apply the rule to the target
 * in all possible ways and see if we can generate the source(s). Essentially,
 * we perform a depth-first-search of the space of possible applications of
 * the rule.
 *
 * First, we try to apply the rule to the main operator, at the top level,
 * to see if we can generate a "match." If that fails, we check whether one
 * of the main operands matches the other. If it does, we recurse on
 * the other operand and try to generate a match.
 *
 * For rules of replacement, we first define a function that checks whether
 * a match can be found by transforming on the main operator. Then we take
 * that function and apply a higher-order-function that performs the DFS
 * with that function/rule recursively on the formula.
 */
export const DEDUCTION_FUNCTIONS = <DeductionRulesDictInterface>{
  [DEDUCTION_RULES.ADDITION]: DF.addition,
  [DEDUCTION_RULES.ASSUMPTION]: () => true,
  [DEDUCTION_RULES.ASSOCIATIVITY]: DF.associativity,
  [DEDUCTION_RULES.COMMUTATIVITY]: DF.commutativity,
  [DEDUCTION_RULES.CONDITIONAL_PROOF]: DF.conditionalProof,
  [DEDUCTION_RULES.CONJUNCTION]: DF.conjunction,
  [DEDUCTION_RULES.CONSTRUCTIVE_DILEMMA]: DF.constructiveDilemma,
  [DEDUCTION_RULES.DEMORGANS]: DF.deMorgans,
  [DEDUCTION_RULES.DISJUNCTIVE_SYLLOGISM]: DF.disjunctiveSyllogism,
  // This assumes a structure like `p & (q | r)` instead of `(q | r) & p`
  // If we wanted to allow the latter, we could define a more permissive
  // version of this that tries to commute the arguments as well
  [DEDUCTION_RULES.DISTRIBUTION]: DF.distribution,
  [DEDUCTION_RULES.DOUBLE_NEGATION]: DF.doubleNegation,
  [DEDUCTION_RULES.EXPORTATION]: DF.exportation,
  [DEDUCTION_RULES.EXISTENTIAL_GENERALIZATION]: DF.existentialGeneralization,
  [DEDUCTION_RULES.HYPOTHETICAL_SYLLOGISM]: DF.hypotheticalSyllogism,
  [DEDUCTION_RULES.INDIRECT_PROOF]: DF.indirectProof,
  [DEDUCTION_RULES.MATERIAL_EQUIVALENCE]: DF.materialEquivalence,
  [DEDUCTION_RULES.MATERIAL_IMPLICATION]: DF.materialImplication,
  [DEDUCTION_RULES.MODUS_PONENS]: DF.modusPonens,
  [DEDUCTION_RULES.MODUS_TOLLENS]: DF.modusTollens,
  [DEDUCTION_RULES.QUANTIFIER_NEGATION]: DF.quantifierNegation,
  [DEDUCTION_RULES.PREMISE]: () => true,
  [DEDUCTION_RULES.SIMPLIFICATION]: DF.simplification,
  [DEDUCTION_RULES.TRANSPOSITION]: DF.transposition,
  [DEDUCTION_RULES.TAUTOLOGY]: DF.tautology,
  [DEDUCTION_RULES.UNIVERSAL_INSTANTION]: DF.universalInstantiation
};
