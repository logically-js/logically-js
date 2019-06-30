import { LineOfProof, Proof } from './Proof';
import { CITED_LINES_COUNT, DEDUCTION_RULES } from './constants';

export const evaluateMove = (
  move: LineOfProof,
  proof: Proof
): boolean => (
  CITED_LINES_COUNT[move.rule] === move.citedLines.length &&
  DEDUCTION_FUNCTIONS[move.rule](move, move.citedLines.map(
    line => proof.lines[line]
  ))
);

interface DeductionFunctionsInterface {
  [deductionRule: string]: (
    target: LineOfProof,
    source: LineOfProof[]
  ) => boolean
}

export const DEDUCTION_FUNCTIONS = <DeductionFunctionsInterface>{
  [DEDUCTION_RULES.ADDITION]: (target, source) => (
    target.proposition.operands.includes(source[0].proposition.formulaString) &&
    target.proposition.operator === 'V'
  ),
  [DEDUCTION_RULES.CONJUNCTION]: (target, source) => (
    target.proposition.operands.includes(source[0].proposition.formulaString) &&
    target.proposition.operands.includes(source[1].proposition.formulaString) &&
    target.proposition.operator === '&'
  ),
  [DEDUCTION_RULES.MODUS_PONENS]: (target, source) => (
    (
      target.proposition.formulaString === source[1].proposition.operands[1] &&
      source[0].proposition.formulaString ===
        source[1].proposition.operands[0] &&
      source[1].proposition.operator === '->'
    ) ||
    (
      target.proposition.formulaString === source[0].proposition.operands[1] &&
      source[1].proposition.formulaString ===
        source[0].proposition.operands[0] &&
      source[0].proposition.operator === '->'
    )
  )
};
