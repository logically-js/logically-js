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
  },
  [DEDUCTION_RULES.COMMUTATIVITY]: (target, sources) =>
    target.proposition.operator === sources[0].proposition.operator &&
    target.proposition.operator.match(/[V&]/) &&
    target.proposition.operands[0] === sources[0].proposition.operands[1] &&
    target.proposition.operands[1] === sources[0].proposition.operands[0],
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
