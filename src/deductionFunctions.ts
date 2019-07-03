/* eslint-disable-next-line */
import { LineOfProof, Proof } from './Proof';
import { Formula } from './Formula';
import { CITED_LINES_COUNT, DEDUCTION_RULES } from './constants';

/**
 * Takes a line of proof and a proof and determines if the line is a valid move.
 *
 * @param {LineOfProof} move - The move currently being considered.
 * @param {Proof} proof - The proof being considered.
 * @return {boolean} - Is the move valid?
 */
export const evaluateMove = (move: LineOfProof, proof: Proof): boolean =>
  CITED_LINES_COUNT[move.rule] === move.citedLines.length &&
  DEDUCTION_FUNCTIONS[move.rule](
    move,
    move.citedLines.map(line => proof.lines[line - 1])
  );

interface DeductionRulesDictInterface {
  [deductionRule: string]: (
    target?: LineOfProof,
    sources?: LineOfProof[]
  ) => boolean;
}

/**
 * Interface for checking a natural deduction rule that has only
 * one source formula and is only checked at the top level/main operator.
 */
interface SimpleDeductionRuleInterface {
  (target: Formula, source: Formula): boolean;
}

/**
 * Higher-order function that takes a SimpleDeductionRule and converts it to a
 * function that recursively checks whether it applies to a formula
 * and its subformulas.
 *
 * @param {SimpleDeductionRuleInterface} rule - Top-level rule-checking function
 * @return {SimpleDeductionRuleInterface} A recursive version of the input
 */
const checkRuleRecursively = (
  rule: SimpleDeductionRuleInterface
): SimpleDeductionRuleInterface => (...args) => {
  const [target, source] = args;
  if (rule(target, source)) return true;
  // If left operands match, recurse to the right
  if (target.operands[0] === source.operands[0]) {
    if (
      checkRuleRecursively(rule)(
        new Formula(target.operands[1]),
        new Formula(source.operands[1])
      )
    ) {
      return true;
    }
  }
  // If right operands match, recurse to the left
  if (target.operands[1] === source.operands[1]) {
    if (
      checkRuleRecursively(rule)(
        new Formula(target.operands[0]),
        new Formula(source.operands[0])
      )
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Function that checks whether Commutativity applies at the top level
 *
 * @param {Formula} t - Target formula
 * @param {Formula} s - Source formula
 * @return {boolean} - Does Commutativity apply at the top level?
 */
const topLevelCommutativity = (t: Formula, s: Formula): boolean =>
  t.operator === s.operator &&
  t.operator.match(/[V&]/) &&
  t.operands[0] === s.operands[1] &&
  t.operands[1] === s.operands[0];

/**
 * Checks for the application of Associativity at the top level.
 *
 * @param {Formula} t - target proposition
 * @param {Formula} s - source proposition
 * @return {boolean} - Can you go from target to source with Associativity?
 */
const topLevelAssociativity: SimpleDeductionRuleInterface = (t, s) => {
  const op = t.operator;
  if (!(op.match(/[&V]/) && op === s.operator)) {
    return false;
  }
  // Try associating to one side
  console.log('LEFT');
  let operandFormula = new Formula(t.operands[0]);
  if (operandFormula.operator === op) {
    const newFormula = new Formula(
      `(${operandFormula.operands[0]}) ${op} (${operandFormula.operands[1]} ${op} ${t.operands[1]})`
    );
    if (
      // TODO: Should utilize the `isEqual` method
      newFormula.isEqual(s)
    ) {
      return true;
    }
  }

  // Try associating to the other direction
  console.log('RIGHT');
  operandFormula = new Formula(t.operands[1]);
  if (operandFormula.operator === op) {
    const newFormula = new Formula(
      `(${t.operands[0]} ${op} ${operandFormula.operands[0]}) ${op} (${operandFormula.operands[1]})`
    );
    if (newFormula.isEqual(s)) {
      return true;
    }
    return false;
  }
};

/**
 * Function that checks whether Double Negation applies at the top level
 *
 * @param {Formula} t - Target formula
 * @param {Formula} s - Source formula
 * @return {boolean} - Does Double Negation apply at the top level?
 */
const topLevelDoubleNegation = (t: Formula, s: Formula): boolean => {
  // We can identify which argument is the one that had
  // the double negation by its length
  if (t.cleansedFormulaString.length > s.cleansedFormulaString.length) {
    const operandFormula = new Formula(t.operands[0]);
    return (
      t.operator === '~' &&
      operandFormula.operator === '~' &&
      operandFormula.isEqual(operandFormula.operands[0], s)
    );
  } else {
    const operandFormula = new Formula(s.operands[0]);
    return (
      s.operator === '~' &&
      operandFormula.operator === '~' &&
      operandFormula.isEqual(operandFormula.operands[0], t)
    );
  }
};

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
  [DEDUCTION_RULES.ADDITION]: (target, sources) =>
    target.proposition.operands.includes(
      sources[0].proposition.cleansedFormulaString
    ) && target.proposition.operator === 'V',
  [DEDUCTION_RULES.ASSOCIATIVITY]: (target, sources) =>
    checkRuleRecursively(topLevelAssociativity)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.COMMUTATIVITY]: (target, sources) =>
    checkRuleRecursively(topLevelCommutativity)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.CONJUNCTION]: (target, sources) =>
    target.proposition.operands.includes(
      sources[0].proposition.cleansedFormulaString
    ) &&
    target.proposition.operands.includes(
      sources[1].proposition.cleansedFormulaString
    ) &&
    target.proposition.operator === '&',
  [DEDUCTION_RULES.DOUBLE_NEGATION]: (target, sources) =>
    checkRuleRecursively(topLevelDoubleNegation)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.HYPOTHETICAL_SYLLOGISM]: (target, sources) =>
    (sources[0].proposition.operands[1] ===
      sources[1].proposition.operands[0] &&
      target.proposition.operands[0] === sources[0].proposition.operands[0] &&
      target.proposition.operands[1] === sources[1].proposition.operands[1] &&
      sources[0].proposition.operator === '->' &&
      sources[1].proposition.operator === '->' &&
      target.proposition.operator === '->') ||
    (sources[1].proposition.operands[1] ===
      sources[0].proposition.operands[0] &&
      target.proposition.operands[0] === sources[1].proposition.operands[0] &&
      target.proposition.operands[1] === sources[0].proposition.operands[1] &&
      sources[1].proposition.operator === '->' &&
      sources[0].proposition.operator === '->' &&
      target.proposition.operator === '->'),
  [DEDUCTION_RULES.MODUS_PONENS]: (target, sources) =>
    (target.proposition.cleansedFormulaString ===
      sources[1].proposition.operands[1] &&
      sources[0].proposition.cleansedFormulaString ===
        sources[1].proposition.operands[0] &&
      sources[1].proposition.operator === '->') ||
    (target.proposition.cleansedFormulaString ===
      sources[0].proposition.operands[1] &&
      sources[1].proposition.cleansedFormulaString ===
        sources[0].proposition.operands[0] &&
      sources[0].proposition.operator === '->'),
  [DEDUCTION_RULES.PREMISE]: () => true,
  [DEDUCTION_RULES.SIMPLIFICATION]: (target, sources) =>
    sources[0].proposition.operands.includes(
      target.proposition.cleansedFormulaString
    ) && sources[0].proposition.operator === '&',
  [DEDUCTION_RULES.TAUTOLOGY]: (target, sources) =>
    sources[0].proposition.operator === '&' &&
    sources[0].proposition.operands[0] === sources[0].proposition.operands[1] &&
    sources[0].proposition.operands[0] ===
      target.proposition.cleansedFormulaString
};
