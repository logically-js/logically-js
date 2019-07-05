/* eslint-disable-next-line */
import { LineOfProof, Proof } from './Proof';
import { Formula } from './Formula';
import { CITED_LINES_COUNT, DEDUCTION_RULES } from './constants';

// TODO: Put in utils
const flipOperator = (operator: string): string =>
  operator === '&' ? 'V' : operator === 'V' ? '&' : operator;

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

  // If both formulas start with negation, recurse inwards on both
  if (target.operator === '~' && source.operator === '~') {
    return checkRuleRecursively(rule)(target.operands[0], source.operands[0]);
  }

  // If left operands match, recurse to the rights
  if (
    target.operands[0].isEqual(source.operands[0]) &&
    target.operator === source.operator
  ) {
    if (checkRuleRecursively(rule)(target.operands[1], source.operands[1])) {
      return true;
    }
  }

  // If right operands match, recurse to the left
  if (
    target.operands[1].isEqual(source.operands[1]) &&
    target.operator === source.operator
  ) {
    if (checkRuleRecursively(rule)(target.operands[0], source.operands[0])) {
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
const topLevelCommutativity: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === s.operator &&
  t.operator.match(/[V&]/) &&
  t.operands[0].isEqual(s.operands[1]) &&
  t.operands[1].isEqual(s.operands[0]);

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
  let operandFormula = t.operands[0];
  if (operandFormula.operator === op) {
    const newFormula = new Formula(
      `(${operandFormula.operands[0].cleansedFormulaString}) ${op} (${operandFormula.operands[1].cleansedFormulaString} ${op} ${t.operands[1].cleansedFormulaString})`
    );
    if (newFormula.isEqual(s)) {
      return true;
    }
  }

  // Try associating to the other direction
  operandFormula = t.operands[1];
  if (operandFormula.operator === op) {
    const newFormula = new Formula(
      `(${t.operands[0].cleansedFormulaString} ${op} ${operandFormula.operands[0].cleansedFormulaString}) ${op} (${operandFormula.operands[1].cleansedFormulaString})`
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
const topLevelDoubleNegation: SimpleDeductionRuleInterface = (t, s) => {
  // We can identify which argument is the one that had
  // the double negation by its length
  if (t.cleansedFormulaString.length > s.cleansedFormulaString.length) {
    const operandFormula = t.operands[0];
    return (
      t.operator === '~' &&
      operandFormula.operator === '~' &&
      operandFormula.operands[0].isEqual(s)
    );
  } else {
    const operandFormula = s.operands[0];
    return (
      s.operator === '~' &&
      operandFormula.operator === '~' &&
      operandFormula.operands[0].isEqual(t)
    );
  }
};

const topLevelTautology: SimpleDeductionRuleInterface = (t, s) => {
  return (
    (s.operator === 'V' &&
      s.operands[0].isEqual(s.operands[1]) &&
      s.operands[0].isEqual(t)) ||
    (t.operator === 'V' &&
      t.operands[0].isEqual(t.operands[1]) &&
      t.operands[0].isEqual(s))
  );
};

const topLevelDeMorgans: SimpleDeductionRuleInterface = (t, s) => {
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

const topLevelDistribution: SimpleDeductionRuleInterface = (t, s) => {
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

const topLevelTransposition: SimpleDeductionRuleInterface = (t, s) =>
  t.operator === '->' &&
  s.operator === '->' &&
  t.operands[0].isNegation(s.operands[1]) &&
  t.operands[1].isNegation(s.operands[0]);

const topLevelMaterialImplication: SimpleDeductionRuleInterface = (t, s) => {
  const [conditional, disjunction] = t.operator === '->' ? [t, s] : [s, t];
  if (!(conditional.operator === '->' && disjunction.operator === 'V')) {
    return false;
  }
  return (
    t.operands[0].isNegation(s.operands[0]) &&
    t.operands[1].isEqual(s.operands[1])
  );
};

const topLevelExportation: SimpleDeductionRuleInterface = (t, s) => {
  if (
    !(
      t.operator === '->' &&
      s.operator === '->'
    )
  ) {
    return false;
  }
  const [exported, unexported] =
    t.operands[1].operator === '->'
      ? [t, s]
      : [s, t];
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
    target.proposition.operands.some(operand =>
      operand.isEqual(sources[0].proposition)
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
    target.proposition.operands.some(operand =>
      operand.isEqual(sources[0].proposition)
    ) &&
    target.proposition.operands.some(operand =>
      operand.isEqual(sources[1].proposition)
    ) &&
    target.proposition.operator === '&',
  [DEDUCTION_RULES.CONSTRUCTIVE_DILEMMA]: (target, sources) => {
    const [conj, disj] =
      sources[0].proposition.cleansedFormulaString.length >
      sources[1].proposition.cleansedFormulaString.length
        ? [sources[0].proposition, sources[1].proposition]
        : [sources[1].proposition, sources[0].proposition];
    console.log(disj.cleansedFormulaString, conj.cleansedFormulaString);
    if (
      target.proposition.operator !== 'V' ||
      conj.operator !== '&' ||
      disj.operator !== 'V' ||
      conj.operands[0].operator !== '->' ||
      conj.operands[1].operator !== '->'
    ) {
      return false;
    }

    // This is a "loose" interpretation of CD, where the order of the
    // arguments is ignored.
    return conj.operands
      .map(operand => operand.operands[0].cleansedFormulaString)
      .every(op =>
        disj.operands.map(x => x.cleansedFormulaString).includes(op)
      );
  },
  [DEDUCTION_RULES.DEMORGANS]: (target, sources) =>
    checkRuleRecursively(topLevelDeMorgans)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.DISJUNCTIVE_SYLLOGISM]: (target, sources) => {
    const [disj, other] =
      sources[0].proposition.cleansedFormulaString.length >
      sources[1].proposition.cleansedFormulaString.length
        ? [sources[0].proposition, sources[1].proposition]
        : [sources[1].proposition, sources[0].proposition];
    return (
      disj.operator === 'V' &&
      disj.operands.some(operand => operand.isNegation(other)) &&
      disj.operands.some(operand => operand.isEqual(target.proposition))
    );
  },
  // This assumes a structure like `p & (q V r)` instead of `(q V r) & p`
  // If we wanted to allow the latter, we could define a more permissive
  // version of this that tries to commute the arguments as well
  [DEDUCTION_RULES.DISTRIBUTION]: (target, sources) =>
    checkRuleRecursively(topLevelDistribution)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.DOUBLE_NEGATION]: (target, sources) =>
    checkRuleRecursively(topLevelDoubleNegation)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.EXPORTATION]: (target, sources) =>
    checkRuleRecursively(topLevelExportation)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.HYPOTHETICAL_SYLLOGISM]: (target, sources) =>
    (sources[0].proposition.operands[1].isEqual(
      sources[1].proposition.operands[0]
    ) &&
      target.proposition.operands[0].isEqual(
        sources[0].proposition.operands[0]
      ) &&
      target.proposition.operands[1].isEqual(
        sources[1].proposition.operands[1]
      ) &&
      sources[0].proposition.operator === '->' &&
      sources[1].proposition.operator === '->' &&
      target.proposition.operator === '->') ||
    (sources[1].proposition.operands[1].isEqual(
      sources[0].proposition.operands[0]
    ) &&
      target.proposition.operands[0].isEqual(
        sources[1].proposition.operands[0]
      ) &&
      target.proposition.operands[1].isEqual(
        sources[0].proposition.operands[1]
      ) &&
      sources[1].proposition.operator === '->' &&
      sources[0].proposition.operator === '->' &&
      target.proposition.operator === '->'),
  [DEDUCTION_RULES.MATERIAL_IMPLICATION]: (target, sources) =>
    checkRuleRecursively(topLevelMaterialImplication)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.MODUS_PONENS]: (target, sources) => {
    const [longer, shorter] =
      sources[0].proposition.cleansedFormulaString.length >
      sources[1].proposition.cleansedFormulaString.length
        ? [sources[0].proposition, sources[1].proposition]
        : [sources[1].proposition, sources[0].proposition];
    return (
      longer.operator === '->' &&
      longer.operands[0].isEqual(shorter) &&
      longer.operands[1].isEqual(target.proposition)
    );
  },
  [DEDUCTION_RULES.MODUS_TOLLENS]: (target, sources) => {
    const [longer, shorter] =
      sources[0].proposition.cleansedFormulaString.length >
      sources[1].proposition.cleansedFormulaString.length
        ? [sources[0].proposition, sources[1].proposition]
        : [sources[1].proposition, sources[0].proposition];
    return (
      longer.operator === '->' &&
      longer.operands[1].isNegation(shorter) &&
      longer.operands[0].isNegation(target.proposition)
    );
  },
  [DEDUCTION_RULES.PREMISE]: () => true,
  [DEDUCTION_RULES.SIMPLIFICATION]: (target, sources) =>
    sources[0].proposition.operands.some(operand =>
      operand.isEqual(target.proposition)
    ) && sources[0].proposition.operator === '&',
  [DEDUCTION_RULES.TAUTOLOGY]: (target, sources) =>
    checkRuleRecursively(topLevelTautology)(
      target.proposition,
      sources[0].proposition
    ),
  [DEDUCTION_RULES.TRANSPOSITION]: (target, sources) =>
    checkRuleRecursively(topLevelTransposition)(
      target.proposition,
      sources[0].proposition
    )
};
