import { Formula } from './Formula';
import { DEDUCTION_RULES } from './constants';
import { evaluateMove, DEDUCTION_FUNCTIONS } from './deductionFunctions';

interface LineOfProofInterface {
  proposition: Formula,
  rule: string,
  citedLines: number[]
}

interface ConstructorArgsInterface {
  proposition: Formula,
  rule: string,
  citedLines: number[]
}

type TesponseDataType = {
  incorrectMoves: boolean[],
  lastLineIsNotConclusion: boolean
};

interface EvaluateProofInterface {
  score: number,
  responseData:TesponseDataType
}

export class LineOfProof implements LineOfProofInterface {
  proposition: Formula;
  rule: string;
  citedLines: number[];

  constructor(args: ConstructorArgsInterface) {
    const { proposition, rule, citedLines } = args;
    this.proposition = proposition;
    this.rule = rule;
    this.citedLines = citedLines;
  }
}

interface ProofInterface {
  premises: Formula[],
  conclusion: Formula,
  lines: LineOfProof[]
}

interface SimpleAddLineToProofInterface {
  proposition: string,
  rule: string,
  citedLines: number[]
}

export class Proof implements ProofInterface {
  premises: Formula[];
  conclusion: Formula;
  lines: LineOfProof[];

  addPremiseToProof = (formulaString: string): void => {
    const proposition: Formula = new Formula(formulaString);
    const rule = DEDUCTION_RULES.PREMISE;
    this.premises.push(proposition);
    this.lines.push(new LineOfProof({
      proposition,
      rule,
      citedLines: []
    }));
  };

  addLineToProof = (newLine: LineOfProof | SimpleAddLineToProofInterface): void => {
    if (newLine instanceof LineOfProof) {
      this.lines.push(newLine);
    } else {
      const proposition: Formula = new Formula(newLine.proposition);
      const { citedLines, rule } = newLine;
      const newLineOfProof: LineOfProof = new LineOfProof(
        { citedLines, proposition, rule }
      );
      this.lines.push(newLineOfProof)
    }
  };

  evaluateProof = (): EvaluateProofInterface => {
    let lastLineIsNotConclusion: boolean = false;
    let hasWrongMoves: boolean = false;
    const lastLine: Formula = this.lines[this.lines.length - 1].proposition;
    if (lastLine.formulaString !== this.conclusion.formulaString) {
      // Proof does not reach the conclusion.
      lastLineIsNotConclusion = true;
    }
    const incorrectMoves: boolean[] = new Array(this.lines.length).fill(false);
    this.lines.forEach( (line, index) => {
      const isValidMove = evaluateMove(line, this);
      incorrectMoves[index] = isValidMove;
      hasWrongMoves = Boolean(Math.max(
        Number(hasWrongMoves), Number(isValidMove)
      ));
    });
    return {
      score: Number(hasWrongMoves),
      responseData: {
        incorrectMoves,
        lastLineIsNotConclusion
      }
    }
  };
}
