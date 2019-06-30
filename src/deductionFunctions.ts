import { LineOfProof, Proof } from './Proof';
import { Formula } from './Formula';
import { CITED_LINES_COUNT, DEDUCTION_RULES } from './constants';

export const evaluateMove = (
  move: LineOfProof,
  proof: Proof
): boolean => {
  console.log('evaluateMove', proof, move, CITED_LINES_COUNT[move.rule], move.citedLines.length, move.citedLines.map(
    line => proof.lines[line - 1]
  ), DEDUCTION_FUNCTIONS[move.rule](move, move.citedLines.map(
    line => proof.lines[line - 1]
  )));
  return (
    CITED_LINES_COUNT[move.rule] === move.citedLines.length &&
    DEDUCTION_FUNCTIONS[move.rule](move, move.citedLines.map(
      line => proof.lines[line - 1]
    ))
  );
}

interface DeductionFunctionsInterface {
  [deductionRule: string]: (
    target?: LineOfProof,
    sources?: LineOfProof[]
  ) => boolean
}

export const DEDUCTION_FUNCTIONS = <DeductionFunctionsInterface>{
  [DEDUCTION_RULES.ADDITION]: (target, sources) => (
    target.proposition.operands.includes(sources[0].proposition.cleansedFormula)
    && target.proposition.operator === 'V'
  ),
  [DEDUCTION_RULES.CONJUNCTION]: (target, sources) => (
    target.proposition.operands.includes(sources[0].proposition.cleansedFormula) &&
    target.proposition.operands.includes(sources[1].proposition.cleansedFormula) &&
    target.proposition.operator === '&'
  ),
  [DEDUCTION_RULES.DOUBLE_NEGATION]: (target, sources) => {
    if (
      target.proposition.cleansedFormula.length >
      sources[0].proposition.cleansedFormula.length
    ) {
      const operandFormula = new Formula(target.proposition.operands[0]);
      return target.proposition.operator === '~' &&
             operandFormula.operator === '~' &&
             operandFormula.operands[0] ===
              sources[0].proposition.cleansedFormula;
    } else {
      const operandFormula = new Formula(sources[0].proposition.operands[0]);
      return sources[0].proposition.operator === '~' &&
             operandFormula.operator === '~' &&
             operandFormula.operands[0] === 
              target.proposition.cleansedFormula;
    }
  },
  [DEDUCTION_RULES.MODUS_PONENS]: (target, sources) => (
    (
      target.proposition.cleansedFormula === sources[1].proposition.operands[1] &&
      sources[0].proposition.cleansedFormula ===
        sources[1].proposition.operands[0] &&
      sources[1].proposition.operator === '->'
    ) ||
    (
      target.proposition.cleansedFormula === sources[0].proposition.operands[1] &&
      sources[1].proposition.cleansedFormula ===
        sources[0].proposition.operands[0] &&
      sources[0].proposition.operator === '->'
    )
  ),
  [DEDUCTION_RULES.PREMISE]: () => true,
  [DEDUCTION_RULES.SIMPLIFICATION]: (target, sources) => (
    sources[0].proposition.operands.includes(target.proposition.cleansedFormula)
    && sources[0].proposition.operator === '&'
  )
};
