import { Formula } from './Formula';
import { DEDUCTION_RULES } from './constants';
import { DEDUCTION_FUNCTIONS } from './deductionFunctions';

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

  addLineToProof = (newLine: LineOfProof): void => {
    this.lines.push(newLine);
  };

  // evaluateMove = (line: LineOfProof): boolean => {
  //   const { proposition, rule, citedLines } = line;
  //   return DEDUCTION_FUNCTIONS[line.rule](line, this.lines)
  //   return true;
  // };

  evaluateProof = () => {
    let lastLineIsNotConclusion: boolean = false;
    const lastLine: Formula = this.lines[this.lines.length - 1].proposition;
    if (lastLine.formulaString !== this.conclusion.formulaString) {
      // Proof does not reach the conclusion.
      lastLineIsNotConclusion = true;
    }
    const incorrectMoves: boolean[] = new Array(this.lines.length).fill(false);
    this.lines.forEach( (line, index) => {
      // const isValidMove = this.evaluateMove(line);
      // incorrectMoves[index] = isValidMove;
    });
  };
}
