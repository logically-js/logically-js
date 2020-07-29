import { Formula } from './Formula';
import { DEDUCTION_RULES } from './constants';
import { evaluateMove } from './deductionFunctions/index';

interface LineOfProofInterface {
  assumptions: number[];
  citedLines: number[];
  lineNumber?: number;
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
  /**
   * Does the current line rely on any other lines which are `Assumptions`
   * (i.e., statements introduced for indirect/conditional proof)?
   * Ultimately, in order to check validity, we need to confirm that the
   * [[Proof.conclusion]] does not rely on any non-discharged assumptions.
   */
  public assumptions: number[];
  /**
   * The line number of the proof.
   */
  public lineNumber?: number;
  public proposition: Formula;
  public rule: string;
  public citedLines: number[];

  /**
   * Constructor
   *
   * @param args - {
   *                  proposition - The Formula for the current line,
   *                  rule - The rule cited to justify for this line,
   *                  citedLines - The lines cited in the justification
   *                }
   */
  constructor(args: ConstructorArgsInterface) {
    const { assumptions, proposition, rule, citedLines } = args;

    this.assumptions = assumptions || [];
    this.citedLines = citedLines || [];
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
  /**
   * The list of premises of the proof.
   */
  premises: Formula[];
  /** A conclusion is a single [[Formula]]. */
  conclusion: Formula;
  /** The actual lines of the proof. */
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
   * Add a LineOfProof to the proof.
   * @param newLine - the line to be added
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
   * Get the assumptions that a line of proof assumes.
   *
   * We search recursively through the cited lines
   * and look for a line that is justified as an `Assumption`. We store any such
   * assumptions in an array. If a line refers directly to an `Assumption`,
   * *but* it correctly applies either `Conditional Proof` or `Indirect Proof`,
   * then the assumption is "discharged" at that point. The new line would
   * refer to the assumption as a cited line, but it will not *assume* the
   * assumptions as one of its non-discharged assumptions.
   *
   * @param line - The line to be analyzed.
   * @return - An array of line numbers representing the non-discharged
   * assumptions of the input line.
   */
  getAssumptions = (line: LineOfProof): number[] => {
    if (line.rule === DEDUCTION_RULES.ASSUMPTION) return [line.lineNumber + 1];
    if (
      //
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
            .reduce((acc, arr) => acc.concat(arr), [])
        )
      );
    }
  };

  /**
   * Set the conclusion of the proof.
   * @param conclusion - The conclusion.
   */
  setConclusion = (conclusion: Formula | string): void => {
    if (typeof conclusion === 'string') {
      try {
        this.conclusion = new Formula(conclusion);
      } catch (e) {
        throw new Error('Could not construct Formula for conclusion.');
      }
    } else if (conclusion instanceof Formula) {
      this.conclusion = conclusion;
    }
  };

  /**
   * Check whether all moves are valid and the conclusion is reached.
   *
   * @return - Are all moves valid and the conclusion has been reached?
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
