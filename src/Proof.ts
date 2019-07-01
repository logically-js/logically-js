import { Formula } from './Formula';
import { DEDUCTION_RULES } from './constants';
import { evaluateMove } from './deductionFunctions';

interface LineOfProofInterface {
  proposition: Formula;
  rule: string;
  citedLines: number[];
}

interface ConstructorArgsInterface {
  proposition: Formula;
  rule: string;
  citedLines: number[];
}

type ResponseDataType = {
  incorrectMoves: boolean[];
  lastLineIsConclusion: boolean;
};

interface EvaluateProofInterface {
  score: number;
  responseData: ResponseDataType;
}

/**
 * Class representing a line in a natural deduction proof.
 */
export class LineOfProof implements LineOfProofInterface {
  proposition: Formula;
  rule: string;
  citedLines: number[];

  /**
   * Constructor
   * @param {object} args - { proposition, rule, citedLines }
   */
  constructor(args: ConstructorArgsInterface) {
    const { proposition, rule, citedLines } = args;
    this.proposition = proposition;
    this.rule = rule;
    this.citedLines = citedLines;
  }
}

interface ProofInterface {
  premises: Formula[];
  conclusion: Formula;
  lines: LineOfProof[];
}

interface SimpleAddLineToProofInterface {
  proposition: string;
  rule: string;
  citedLines: number[];
}

/**
 * Class representing a natural deduction proof.
 */
export class Proof implements ProofInterface {
  premises: Formula[];
  conclusion: Formula;
  lines: LineOfProof[];

  /**
   * Constructor
   */
  constructor() {
    this.premises = [];
    this.conclusion = new Formula('');
    this.lines = [];
  }

  /**
   * Add a premise to the proof.
   * @param {string} formulaString - String representation of the premise.
   */
  addPremiseToProof = (formulaString: string): void => {
    const proposition: Formula = new Formula(formulaString);
    const rule = DEDUCTION_RULES.PREMISE;
    this.premises.push(proposition);
    this.lines.push(
      new LineOfProof({
        proposition,
        rule,
        citedLines: []
      })
    );
  };

  /**
   * Add a LineOfProof to the proof.
   * @param {LineOfProof | object} newLine - the line to be added
   */
  addLineToProof = (
    newLine: LineOfProof | SimpleAddLineToProofInterface
  ): void => {
    console.log('addLineToProof', newLine, newLine instanceof LineOfProof);
    if (newLine instanceof LineOfProof) {
      this.lines.push(newLine);
    } else {
      const proposition: Formula = new Formula(newLine.proposition);
      console.log('new LINE', proposition);
      const { citedLines, rule } = newLine;
      const newLineOfProof: LineOfProof = new LineOfProof({
        citedLines,
        proposition,
        rule
      });
      this.lines.push(newLineOfProof);
    }
  };

  /**
   * Set the conclusion of the proof
   * @param {Formula|string} conclusion - The conclusion
   */
  setConclusion = (conclusion: Formula | string): void => {
    if (typeof conclusion === 'string') {
      this.conclusion = new Formula(conclusion);
    } else {
      this.conclusion = conclusion;
    }
  };

  /**
   * Check whether all moves are valid and the conclusion is reached.
   * @return {boolean}
   */
  evaluateProof = (): EvaluateProofInterface => {
    console.log('evaluateProof');
    let lastLineIsConclusion: boolean = false;
    let hasWrongMoves: boolean = false;
    const lastLine: Formula = this.lines[this.lines.length - 1].proposition;
    console.log(
      'HIIIIIIIII',
      lastLine.cleansedFormula,
      this.conclusion.cleansedFormula
    );
    if (lastLine.cleansedFormula === this.conclusion.cleansedFormula) {
      // Proof reaches the conclusion.
      lastLineIsConclusion = true;
    }
    const incorrectMoves: boolean[] = new Array(this.lines.length).fill(false);
    this.lines.forEach((line, index) => {
      console.log('LINE!', line, index);
      const isValidMove = evaluateMove(line, this);
      incorrectMoves[index] = !isValidMove;
      hasWrongMoves = Boolean(
        Math.max(Number(hasWrongMoves), Number(!isValidMove))
      );
    });
    return {
      score: Number(!hasWrongMoves && lastLineIsConclusion),
      responseData: {
        incorrectMoves,
        lastLineIsConclusion
      }
    };
  };
}
