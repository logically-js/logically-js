/* eslint-disable-next-line */
import { LineOfProof, Proof } from './Proof';
import { Formula } from './Formula';
import { CITED_LINES_COUNT, DEDUCTION_RULES } from './constants';

export const evaluateMove = (move: LineOfProof, proof: Proof): boolean =>
  CITED_LINES_COUNT[move.rule] === move.citedLines.length &&
  DEDUCTION_FUNCTIONS[move.rule](
    move,
    move.citedLines.map(line => proof.lines[line - 1])
  );

interface DeductionFunctionsInterface {
  [deductionRule: string]: (
    target?: LineOfProof,
    sources?: LineOfProof[]
  ) => boolean;
}

interface SimpleDeductionFunctionInterface {
  (target: Formula, sources: Formula): boolean;
}

const checkRuleRecursively = (rule: SimpleDeductionFunctionInterface) => (
  ...args: Formula[]
): boolean => {
  const [formula1, formula2] = args;
  if (rule(formula1, formula2)) return true;
  // If left operands match, recurse to the right
  if (formula1.operands[0] === formula2.operands[0]) {
    if (
      checkRuleRecursively(rule)(
        new Formula(formula1.operands[1]),
        new Formula(formula2.operands[1])
      )
    ) {
      return true;
    }
  }
  // If right operands match, recurse to the left
  if (formula1.operands[1] === formula2.operands[1]) {
    if (
      checkRuleRecursively(rule)(
        new Formula(formula1.operands[0]),
        new Formula(formula2.operands[0])
      )
    ) {
      return true;
    }
  }
  return false;
};

/** **************** COMMUTATIVITY ******************* */

const topLevelCommutativity = (t: Formula, s: Formula): boolean =>
  t.operator === s.operator &&
  t.operator.match(/[V&]/) &&
  t.operands[0] === s.operands[1] &&
  t.operands[1] === s.operands[0];

const commutativity = (target: Formula, source: Formula) => {
  if (topLevelCommutativity(target, source)) return true;
  if (target.operands[0] === source.operands[0]) {
    if (
      commutativity(
        new Formula(target.operands[1]),
        new Formula(source.operands[1])
      )
    ) {
      return true;
    }
  }
  if (target.operands[1] === source.operands[1]) {
    if (
      commutativity(
        new Formula(target.operands[0]),
        new Formula(source.operands[0])
      )
    ) {
      return true;
    }
  }
  return false;
};

const commutativityHelper = (
  target: LineOfProof,
  sources: LineOfProof[]
): boolean =>
  checkRuleRecursively(commutativity)(
    target.proposition,
    sources[0].proposition
  );

// TODO: Some of these rules have to work for subformulas
export const DEDUCTION_FUNCTIONS = <DeductionFunctionsInterface>{
  [DEDUCTION_RULES.ADDITION]: (target, sources) =>
    target.proposition.operands.includes(
      sources[0].proposition.cleansedFormula
    ) && target.proposition.operator === 'V',
  [DEDUCTION_RULES.ASSOCIATIVITY]: (target, sources) => {
    const op = target.proposition.operator;
    if (!op.match(/[&V]/) && op === sources[0].proposition.operator) {
      return false;
    }
    // Try associating to the left
    console.log('LEFT');
    let operandFormula = new Formula(target.proposition.operands[0]);
    if (operandFormula.operator === op) {
      const newFormula = new Formula(
        `(${operandFormula.operands[0]}) ${op} (${operandFormula.operands[1]} ${op} ${target.proposition.operands[1]})`
      );
      if (
        // TODO: Should utilize the `isEqual` method
        newFormula.cleansedFormula === sources[0].proposition.cleansedFormula
      ) {
        return true;
      }
    }
    // Try associating to the right
    console.log('RIGHT');
    operandFormula = new Formula(target.proposition.operands[1]);
    if (operandFormula.operator === op) {
      const newFormula = new Formula(
        `(${target.proposition.operands[0]} ${op} ${operandFormula.operands[0]}) ${op} (${operandFormula.operands[1]})`
      );
      if (
        newFormula.cleansedFormula === sources[0].proposition.cleansedFormula
      ) {
        return true;
      }
    }
    return false;
  }, // p & (q & r)   (q & r) & p
  [DEDUCTION_RULES.COMMUTATIVITY]: commutativityHelper,
  [DEDUCTION_RULES.CONJUNCTION]: (target, sources) =>
    target.proposition.operands.includes(
      sources[0].proposition.cleansedFormula
    ) &&
    target.proposition.operands.includes(
      sources[1].proposition.cleansedFormula
    ) &&
    target.proposition.operator === '&',
  [DEDUCTION_RULES.DOUBLE_NEGATION]: (target, sources) => {
    if (
      target.proposition.cleansedFormula.length >
      sources[0].proposition.cleansedFormula.length
    ) {
      const operandFormula = new Formula(target.proposition.operands[0]);
      return (
        target.proposition.operator === '~' &&
        operandFormula.operator === '~' &&
        operandFormula.operands[0] === sources[0].proposition.cleansedFormula
      );
    } else {
      const operandFormula = new Formula(sources[0].proposition.operands[0]);
      return (
        sources[0].proposition.operator === '~' &&
        operandFormula.operator === '~' &&
        operandFormula.operands[0] === target.proposition.cleansedFormula
      );
    }
  },
  [DEDUCTION_RULES.MODUS_PONENS]: (target, sources) =>
    (target.proposition.cleansedFormula ===
      sources[1].proposition.operands[1] &&
      sources[0].proposition.cleansedFormula ===
        sources[1].proposition.operands[0] &&
      sources[1].proposition.operator === '->') ||
    (target.proposition.cleansedFormula ===
      sources[0].proposition.operands[1] &&
      sources[1].proposition.cleansedFormula ===
        sources[0].proposition.operands[0] &&
      sources[0].proposition.operator === '->'),
  [DEDUCTION_RULES.PREMISE]: () => true,
  [DEDUCTION_RULES.SIMPLIFICATION]: (target, sources) =>
    sources[0].proposition.operands.includes(
      target.proposition.cleansedFormula
    ) && sources[0].proposition.operator === '&',
  [DEDUCTION_RULES.TAUTOLOGY]: (target, sources) =>
    sources[0].proposition.operator === '&' &&
    sources[0].proposition.operands[0] === sources[0].proposition.operands[1] &&
    sources[0].proposition.operands[0] === target.proposition.cleansedFormula
};
