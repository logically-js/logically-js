import { Formula } from './Formula';
import { DEDUCTION_RULES } from './constants';
import { evaluateMove } from './deductionFunctions/index';

interface LineOfProofInterface {
  assumptions: number[];
  citedLines: number[];
  lineNumber: number;
  proposition: Formula;
  rule: string;
}

interface ConstructorArgsInterface {
  assumptions?: number[];
  proposition: Formula;
  rule: string;
  citedLines: number[];
}

type ResponseDataType = {
  incorrectMoves: boolean[];
  lastLineIsConclusion: boolean;
  nonDischargedAssumptions: number[];
};

interface EvaluateProofInterface {
  score: number;
  responseData: ResponseDataType;
}

/**
 * Class representing a line in a natural deduction proof.
 */
export class LineOfProof implements LineOfProofInterface {
  assumptions: number[];
  lineNumber: number;
  proposition: Formula;
  rule: string;
  citedLines: number[];

  /**
   * Constructor
   * @param {object} args - { proposition, rule, citedLines }
   */
  constructor(args: ConstructorArgsInterface) {
    const { assumptions = [], proposition, rule, citedLines } = args;
    this.assumptions = assumptions;
    this.citedLines = citedLines;
    this.lineNumber;
    this.proposition = proposition;
    this.rule = rule;
  }

  /**
   * Set the current LineOfProof assumptions
   * @param {number[]} assumptions - the list of assumed line numbers
   */
  setAssumptions = (assumptions: number[]): void => {
    this.assumptions = assumptions;
  };
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
    const newLineOfProof = new LineOfProof({
      assumptions: [],
      proposition,
      rule,
      citedLines: []
    });
    this.lines.push(newLineOfProof);
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
      // newLineOfProof.assumptions = assumptions;
    }
    newLineOfProof.lineNumber = this.lines.length;
    const assumptions = this.getAssumptions(newLineOfProof);
    newLineOfProof.setAssumptions(assumptions);
    this.lines.push(newLineOfProof);
  };

  /**
   * Get the assumptions that a line of proof assumes
   * @param {LineOfProof} line
   * @return {number[]}
   */
  getAssumptions = (line: LineOfProof): number[] => {
    if (line.rule === DEDUCTION_RULES.ASSUMPTION) return [line.lineNumber + 1];
    if (
      line.rule === DEDUCTION_RULES.PREMISE ||
      line.rule === DEDUCTION_RULES.CONDITIONAL_PROOF ||
      line.rule === DEDUCTION_RULES.INDIRECT_PROOF
    ) {
      return [];
    } else {
      return Array.from(
        new Set(
          line.citedLines
            .map(l => this.getAssumptions(this.lines[l - 1]))
            .reduce((acc, arr) => acc.concat(arr))
        )
      );
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
    let lastLineIsConclusion: boolean = false;
    let nonDischargedAssumptions: number[] = [];
    let hasWrongMoves: boolean = false;
    const lastLine: LineOfProof = this.lines[this.lines.length - 1];
    if (lastLine.proposition.isEqual(this.conclusion)) {
      // Proof reaches the conclusion.
      lastLineIsConclusion = true;
    }
    if (lastLine.assumptions.length > 0) {
      nonDischargedAssumptions = lastLine.assumptions;
    }
    const incorrectMoves: boolean[] = new Array(this.lines.length).fill(false);
    this.lines.forEach((line, index) => {
      let isValidMove = false;
      try {
        isValidMove = evaluateMove(line, this);
      } catch (e) {
        console.log('Error processing line of proof: ' + e);
      }
      incorrectMoves[index] = !isValidMove;
      hasWrongMoves = Boolean(
        Math.max(Number(hasWrongMoves), Number(!isValidMove))
      );
    });
    return {
      score: Number(
        !hasWrongMoves &&
          lastLineIsConclusion &&
          !nonDischargedAssumptions.length
      ),
      responseData: {
        incorrectMoves,
        lastLineIsConclusion,
        nonDischargedAssumptions
      }
    };
  };
}
