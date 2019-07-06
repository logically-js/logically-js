import { Formula } from './Formula';
import { DEDUCTION_RULES, CITED_LINES_COUNT } from './constants';
import { evaluateMove } from './deductionFunctions';

interface LineOfProofInterface {
  assumptions: LineOfProof[];
  citedLines: number[];
  proposition: Formula;
  rule: string;
}

interface ConstructorArgsInterface {
  assumptions?: LineOfProof[];
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
  assumptions: LineOfProof[];
  proposition: Formula;
  rule: string;
  citedLines: number[];

  /**
   * Constructor
   * @param {object} args - { proposition, rule, citedLines }
   */
  constructor(args: ConstructorArgsInterface) {
    const { assumptions, proposition, rule, citedLines } = args;
    this.assumptions = assumptions;
    this.citedLines = citedLines;
    this.proposition = proposition;
    this.rule = rule;
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
    this.conclusion;
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
        assumptions: [],
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
    let newLineOfProof: LineOfProof;
    if (newLine instanceof LineOfProof) {
      newLineOfProof = newLine;
      // this.lines.push(newLine);
    } else {
      const proposition: Formula = new Formula(newLine.proposition);
      const { citedLines, rule } = newLine;
      newLineOfProof = new LineOfProof({
        citedLines,
        proposition,
        rule
      });
    }
    this.lines.push(newLineOfProof);
  };

  /**
   * Get the assumptions that a line of proof relies on. [WIP]
   * @param {LineOfProof} line
   * @return {LineOfProof[]}
   */
  getAssumptions = (line: LineOfProof): LineOfProof[] => {
    if (line.citedLines.length === 0) return [];
    const citedLines = line.citedLines.map(citedLine => this.lines[0]);
    let result: LineOfProof[] = [];
    citedLines.map(citedLine => {
      if (citedLine.rule === 'ASSUMPTION') {
        result.push(citedLine);
      } else {
        result = [...result, this.getAssumptions(citedLine)] as LineOfProof[];
      }
    });
    return result;
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
    // console.log('evaluateProof');
    let lastLineIsConclusion: boolean = false;
    let hasWrongMoves: boolean = false;
    const lastLine: Formula = this.lines[this.lines.length - 1].proposition;
    if (lastLine.isEqual(this.conclusion)) {
      // Proof reaches the conclusion.
      lastLineIsConclusion = true;
    }
    const incorrectMoves: boolean[] = new Array(this.lines.length).fill(false);
    this.lines.forEach((line, index) => {
      console.log(
        'line!',
        CITED_LINES_COUNT[line.rule],
        line.proposition.cleansedFormulaString
      );
      const isValidMove = evaluateMove(line, this);
      console.log('isValidMove =', isValidMove);
      incorrectMoves[index] = !isValidMove;
      hasWrongMoves = Boolean(
        Math.max(Number(hasWrongMoves), Number(!isValidMove))
      );
    });
    console.log('INCORRECT MOVES', incorrectMoves);
    if (hasWrongMoves) {
      console.log(`
        HAS WRONG MOVES!!!!
        !@*#6164783
        &*^$*!@$&*()`);
    }
    return {
      score: Number(!hasWrongMoves && lastLineIsConclusion),
      responseData: {
        incorrectMoves,
        lastLineIsConclusion
      }
    };
  };
}
