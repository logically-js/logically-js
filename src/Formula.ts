import {
  /* eslint-disable-next-line */ // eslint complains about this as `no-unused-vars`
  Operator,
  RE,
  TRUTH_FUNCTIONS
} from './constants';

interface FormulaInterface {
  /**
   * cleansedFormulaString is the canonical string representation of
   * the formula. It is stripped of whitespace and any extra parens.
   * This can be used for checking equality of two formulas.
   */
  cleansedFormulaString: string;
  conclusion?: Formula;
  initialFormulaString: string;
  operator?: Operator;
  operands?: Formula[];
}

interface ParsedInterface {
  operator: Operator;
  operands: string[];
}

export interface AssignmentInterface {
  [variable: string]: boolean;
}

/**
 * Class for representing propositional formulas.
 */
export class Formula implements FormulaInterface {
  cleansedFormulaString: string;
  conclusion?: Formula;
  initialFormulaString: string;
  operator?: Operator;
  operands?: Formula[];
  /**
   * Class constructor
   * @param {string} formulaString - A logical formula in string format
   */
  constructor(formulaString: string) {
    // console.log('CONSTRUCTOR', formulaString);
    this.operator = null;
    this.operands = [];
    this.cleansedFormulaString = undefined;
    if (formulaString) {
      if (this.trimParens(this.removeWhiteSpace(formulaString)).length === 1) {
        this.cleansedFormulaString = this.trimParens(
          this.removeWhiteSpace(formulaString)
        );
        return;
      }
      this.cleansedFormulaString = this.cleanseFormulaString(formulaString);
      const parsedFormula = this.parseString(this.cleansedFormulaString);
      this.operator = parsedFormula.operator;
      this.operands = parsedFormula.operands.map(
        operand => new Formula(operand)
      );
    }
  }

  /**
   * Getter that prints the "prettified" version of the current formula
   * @return {string} - Prettified formula description
   */
  get prettifiedFormula() {
    return this.prettyFormula(this.cleansedFormulaString);
  }

  /**
   * Returns true iff the formula string represents an atomic proposition.
   * @param  {string}  string - The string to test
   * @return {boolean}        - Is the input string atomic?
   */
  isAtomicString = (string = this.cleansedFormulaString): boolean => {
    return RE.atomicVariable.test(string);
  };

  /**
   * Compares two formulas for equality.
   * @param {Formula | string} formula - formula to be compared
   * @param {Formula | string} formula2 - other formula to be compared
                                    (if absent, compares with `this` formula)
   * @return {boolean}
   */
  isEqual = (
    formula: Formula | string,
    formula2?: Formula | string
  ): boolean => {
    formula = formula instanceof Formula ? formula : new Formula(formula);
    const otherFormula = formula2
      ? formula2 instanceof Formula
        ? formula2
        : new Formula(formula2)
      : this;
    return formula.cleansedFormulaString === otherFormula.cleansedFormulaString;
  };

  /**
   * Takes a formula and recursively removes any "extra"
   * leading/trailing parentheses, i.e.:
   * `((p & (q -> r)))` => `p & (q -> r)`
   * @param  {string} formulaString - the string to be trimmed
   * @return {string}               - the trimmed string
   */
  trimParens = (formulaString: string): string => {
    while (/\([a-z]\)/g.test(formulaString)) {
      formulaString = formulaString.replace(
        /(\([a-z]\))/g,
        (_, group) => group[1]
      );
    }
    const length: number = formulaString.length;
    if (formulaString[0] !== '(' || formulaString[length - 1] !== ')') {
      return formulaString; // if no leading/trailing parens, just return;
    }
    // Walk through the string and see if the open parens count ever hits 0.
    // If it doesn't until the end, the leading/trailing parens are unnecessary.
    let count: number = 1;
    for (let i = 1; i < length - 1; i++) {
      const char = formulaString[i];
      count += Number(char === '(');
      count -= Number(char === ')');
      if (count === 0) {
        return formulaString;
      }
    }
    return this.trimParens(formulaString.slice(1, length - 1));
  };

  /**
   * Remove all whitespace from a string.
   * @param  {string} string - String to be trimmed.
   * @return {string}        - String with whitespace removed.
   */
  removeWhiteSpace = (string = this.cleansedFormulaString): string => {
    return string.replace(/\s/g, '');
  };

  /**
   * Find the index of the main binary operator in a formula string,
   * if it exists, or `-1` if there is no main binary operator.
   * @param  {string} trimmedFormulaString - The string to be analyzed.
   *                  We assume that extra parens have been trimmed.
   * @return {number}                      - The index of the main operator.
   */
  findMainBinaryOperatorIndex = (trimmedFormulaString: string): number => {
    /*
     * The main binary operator in a (trimmed) wff is the first binary operator
     * that you see when there are no open parens.
     * If there is no main binary operator, the formula must be atomic,
     * or the main operator is negation, or it is not well formed.
     */
    const length: number = trimmedFormulaString.length;
    let count: number = 0;
    for (let i = 0; i < length; i++) {
      const suffix = trimmedFormulaString.slice(i);
      if (count === 0) {
        const operatorMatch = suffix.match(RE.binaryOperator);
        if (operatorMatch) {
          return i;
        }
      }
      count += Number(suffix[0] === '(');
      count -= Number(suffix[0] === ')');
    }
    return -1; // no main binary operator found.
  };

  /**
   * Checks whether a formula is the negation of another
   * @param {Formula|string} formula - formula to compare for negation
   * @param {Formula|string} formula2 - formula to compare for negation
   * @return {boolean}
   */
  isNegation = (
    formula: Formula | string,
    formula2?: Formula | string
  ): boolean => {
    formula = formula instanceof Formula ? formula : new Formula(formula);
    const compareFormula = formula2
      ? formula2 instanceof Formula
        ? formula2
        : new Formula(formula2)
      : this;
    return (
      (compareFormula.operator === '~' &&
        formula.isEqual(compareFormula.operands[0])) ||
      (formula.operator === '~' && compareFormula.isEqual(formula.operands[0]))
    );
  };

  /**
   * Generate a new Formula that is the negation of the input formula
   * (or `this` formula by default)
   * @param {Formula|string} formula  - The fomrula to be negated
   * @return {Formula} - The negated formula
   */
  negateFormula = (formula?: Formula | string): Formula => {
    formula =
      typeof formula === 'string'
        ? new Formula(formula)
        : typeof formula === 'undefined'
        ? this
        : formula;
    return new Formula(`'(${formula.cleansedFormulaString})'`);
  };

  /**
   * Remove all whitespace and unnecessary parentheses from a formula.
   * This produces a canonical string representation of a formula.
   * @param {string} formula - the formula to "cleanse"
   * @return {string} - the cleansed formula
   */
  cleanseFormulaString = (formula?: string): string | undefined => {
    if (!formula) return;
    const parsed = this.parseString(formula);
    if (!parsed.operator) {
      return formula && this.trimParens(this.removeWhiteSpace(formula));
    }
    let op1 = this.cleanseFormulaString(parsed.operands[0]);
    let op2 = this.cleanseFormulaString(parsed.operands[1]);
    const operator = parsed.operator;
    op1 = op1 && (op1.length > 1 ? `(${op1})` : op1);
    op2 = op2 && (op2.length > 1 ? `(${op2})` : op2);
    let result;
    if (op2) {
      result = `${op1} ${operator} ${op2}`;
    } else {
      result = operator + op1;
    }
    return this.trimParens(this.removeWhiteSpace(result));
  };

  /**
   * Takes a formula string and returns an object with
   * the main operator and main operands in string form.
   * @param  {string} formulaString - Formula string
   *                                  with extra parens removed.
   * @return {object}               - Object with operator and operands.
   */
  parseString = (formulaString: string): ParsedInterface | null => {
    // Remove whitespace and any unnecessary parens.
    formulaString = this.removeWhiteSpace(formulaString);
    formulaString = this.trimParens(formulaString);

    if (this.isAtomicString(formulaString)) {
      // Atomic formula.
      // An atomic formula is a Formula with no operator and one operand.
      return {
        operator: null,
        operands: [formulaString]
      };
    }

    // Check for main binary operator first.
    // We have to do this before checking for negation, because
    // negation is right-associative, and parentheses are often omitted.
    // We want to assume that the main operator is the first operator
    // encountered with no open parentheses, but the syntax of negation
    // precludes this. So, first we check if there is a main binary operator,
    // before proceeding.
    // Ex.: `~p V q` should be parsed as `~p` OR `q`, but `~` would otherwise
    // appear to be the main operator, so we would get `~(p V q)`.
    // (By default, we apply right-associativity if there is ambiguity,
    // except for negation.)

    const mainBinaryOperatorIndex = this.findMainBinaryOperatorIndex(
      formulaString
    );

    if (mainBinaryOperatorIndex > -1) {
      // Main operator is a binary operator.
      // Take slices to the left and right of the main operator,
      // make new Formulas, and set them as the operands.
      const match = formulaString
        .slice(mainBinaryOperatorIndex)
        .match(RE.binaryOperator);
      const operator = match[0] as Operator;
      const operandL: string = formulaString.slice(0, mainBinaryOperatorIndex);
      const operandR: string = formulaString.slice(
        mainBinaryOperatorIndex + operator.length
      );
      return {
        operator,
        operands: [operandL, operandR]
      };
    } else {
      // Main operator should be negation.
      if (RE.unaryOperator.test(formulaString)) {
        // Main operator is negation.
        const subFormula = formulaString.slice(1);
        return {
          operator: '~',
          operands: [subFormula]
        };
      }
    }

    // Unable to parse the formula.
    return null;
  };

  /**
   * Returns true iff the `formulaString` is a well-formed formula (wff).
   * @param {string} formulaString - The string to be analyzed.
   * @return {boolean}             - Does the string represent a wff?
   */
  isWFFString = (formulaString: string): boolean => {
    formulaString = this.removeWhiteSpace(formulaString);
    formulaString = this.trimParens(formulaString);
    if (formulaString.length === 1) return this.isAtomicString(formulaString);
    // Not an atomic formula, so parse it and continue.
    const formula = this.parseString(formulaString);
    if (formula === null) return false; // couldn't parse
    if (!RE.operator.test(formula.operator)) return false; // illegal operator
    // Every operand must also be a wff.
    return formula.operands.every(operand => this.isWFFString(operand));
  };

  // TODO: Reconsider the treatment of `undefined` return values.
  // Ex. `p V q` where `{ p: true }` (and `q` is `undefined`).
  /**
   * Takes a formula (string) and a set of assignments of propositional
   * variables to truth values, and returns true iff the proposition
   * represented by the formula is true under the given assignment.
   * Returns `null` if the string is non-well-formed. (Cannot evaluate.)
   * Returns `undefined` if the formula contains atomic variables
   * that do not have an assignment. (Truth value is indeterminate.)
   * @param  {string} formulaString - String representing the proposition to
   *                                  evaluate.
   * @param  {object} assignment    - Assignment of atomic variables to truth
   *                                  values.
   * @return {boolean|null|undefined} Is the `formulaString` true under the
   *                                  `assignment`?
   */
  evaluateFormulaString = (
    formulaString: string,
    assignment: AssignmentInterface
  ): boolean => {
    if (!this.isWFFString(formulaString)) return null;
    // Clean the formula.
    formulaString = this.removeWhiteSpace(formulaString);
    formulaString = this.trimParens(formulaString);
    if (this.isAtomicString(formulaString)) {
      // Base case - atomic formula
      return assignment[formulaString];
    }
    const parsed = this.parseString(formulaString);
    const values = parsed.operands.map(operand => {
      if (this.isAtomicString(operand)) {
        return assignment[operand];
      } else {
        // If an operand is complex, recurse on it to get the value.
        return this.evaluateFormulaString(operand, assignment);
      }
    });
    // Apply the corresponding truth function with the values.
    return TRUTH_FUNCTIONS[parsed.operator](...values);
  };

  // TODO: This function should probably return an array of Formulas.
  /**
   * Generate the headers for the truth table
   * @param  {string} formulaString - Optional formulaString argument
   * @return {string[]}  Truth table headers sorted alphabetically and by length
   */
  generateTruthTableHeaders = (
    formulaString = this.cleansedFormulaString
  ): string[] => {
    const result: Set<string> = new Set();
    const helper = (formulaString: string): void => {
      result.add(formulaString);
      if (this.isAtomicString(formulaString)) {
        // Base case - atomic formula
        return;
      }
      const parsed = this.parseString(formulaString);
      parsed.operands.forEach(operand => {
        if (this.isAtomicString(operand)) {
          result.add(operand);
        } else {
          // If an operand is complex, recurse on it to get the value.
          const h = this.generateTruthTableHeaders(operand);
          for (const x of h) {
            result.add(x);
          }
        }
      });
    };
    helper(formulaString);
    return Array.from(result)
      .sort((a, b) => {
        if (a.length < b.length) return -1;
        else if (a.length > b.length) return 1;
        else return a < b ? -1 : b < a ? 1 : 0;
      })
      .map(this.prettyFormula);
  };

  /**
   * Takes a formulaString and returns a pretty, normalized formatting
   * with a single space between arguments and operators.
   * @param  {string} formulaString - The formula to be prettified
   * @return {string} - Prettified formula
   */
  prettyFormula = (formulaString = this.cleansedFormulaString): string =>
    this.trimParens(formulaString)
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/([a-zV&^(-(?>:>))])/g, (_, x) => x + ' ') // Add spaces
      .replace(/\(\s+/g, '(') // Remove spaces after `(`
      .replace(/\s+\)/g, ')') // Remove spaces before ')'
      .replace(/\s+$/g, ''); // Remove possible extra space at end

  /**
   * Returns a sorted list of the atomic variables.
   * @param  {string} formulaString
   * @return {string[]}
   */
  getAtomicVariables = (formulaString: string): string[] => {
    const result: Set<string> = new Set();
    for (const letter of formulaString) {
      if (/[a-z]/.test(letter)) {
        result.add(letter);
      }
    }
    return Array.from(result).sort();
  };

  /**
   * Generate a complete truth table with values filled in if partail = true.
   * @param  {string}  formulaString
   * @param  {Boolean} partial=false Should we only fill out the atomic values?
   * @return {Array.Boolean[]}    Truth table as matrix with values filled in.
   */
  generateTruthTable = (formulaString: string, partial = false) => {
    const headers = this.generateTruthTableHeaders(formulaString);
    const atomicVars: string[] = this.getAtomicVariables(formulaString);
    const nRows: number = Math.pow(2, atomicVars.length);
    const result = new Array(nRows)
      .fill(0)
      .map(() => new Array(headers.length).fill(null));
    let i = 0;
    // Set the values for the atomic variables
    for (; i < atomicVars.length; i++) {
      for (let j = 0; j < nRows; j++) {
        const lengthOfSegment = nRows / Math.pow(2, i);
        result[j][i] = j % lengthOfSegment < lengthOfSegment / 2;
      }
    }
    if (partial) return result;
    // Evaluate the values for each cell based on the truth value assignment
    for (; i < result[0].length; i++) {
      for (let j = 0; j < result.length; j++) {
        const assignment: AssignmentInterface = {};
        result[j].slice(0, atomicVars.length).forEach((val, idx) => {
          assignment[atomicVars[idx]] = val;
        });
        result[j][i] = this.evaluateFormulaString(headers[i], assignment);
      }
    }
    return result;
  };
}
