import {
  /* eslint-disable-next-line */ // eslint complains about this as `no-unused-vars`
  Operator,
  RE,
  TRUTH_FUNCTIONS
} from './constants';

/**
 * A semi-parsed formula - a [[Formula.formulaString]] parsed into its
 * main operator and operands in string format.
 */
interface ParsedInterface {
  operator: Operator;
  operands: string[];
}

/**
 * An assignment of a truth value to an atomic propositional variable.
 * Used for evaluating formulas under a particular set of assignments.
 */
export interface AssignmentInterface {
  [variable: string]: boolean;
}

/**
 * Class for representing propositional formulas.
 *
 * Formulas have a recursive structure - complex formulas have other formulas
 * as parts (i.e., operands). The "base case" of this structure is the
 * atomic proposition. A [[formulaString]] for an atomic proposition can be
 * identified syntactically as a single lower-case letter after removing any
 * parentheses and whitespace.
 *
 * The class is instantiated with a [[formulaString]], which we want to parse
 * into its [[Operator]] (simply an enum) and its operands, which ultimately
 * should be [[Formula]]s as well. We do an initial parse which gets the main
 * [[Operator]] and [[ParsedInterface.operands]] in string format. We can then
 * recurse on the operands until we just hit atomic propositions.
 *
 * We rely on a canonical string representation of a [[Formula]] to compare the
 * identity of different [[Formula]]s - i.e., the [[cleansedFormulaString]].
 * When the class is instantiated, we parse it in the manner described here and
 * compute and store its "cleansed" representation.
 */
export class Formula {
  /**
   * The initial string passed to the constructor.
   */
  public readonly formulaString: string;
  /**
   * The canonical string representation of
   * the formula. It is stripped of whitespace and any extra parens.
   * This can be used for checking equality of two [[Formula]]s
   * (see [[isEqual]]).
   */
  public cleansedFormulaString: string;
  /**
   * The [[Formula]]'s main operator, if it is complex.
   */
  public operator?: Operator;
  /**
   * The [[Formula]]'s main operands, if it is complex.
   */
  public operands?: Formula[];

  /**
   * @param formulaString - A logical formula in string format.
   */
  constructor(formulaString: string) {
    if (!formulaString) {
      throw new Error('Must pass a formula string to Formula constructor.');
    }
    this.formulaString = formulaString;
    this.operator = null;
    this.operands = [];
    if (
      Formula.trimOuterParens(Formula.removeWhiteSpace(formulaString))
        .length === 1
    ) {
      this.cleansedFormulaString = Formula.trimOuterParens(
        Formula.removeWhiteSpace(formulaString)
      );
      return;
    }
    this.cleansedFormulaString = Formula.cleanseFormulaString(formulaString);
    const parsedFormula = Formula.parseStringBasic(this.cleansedFormulaString);
    this.operator = parsedFormula.operator;
    this.operands = parsedFormula.operands.map(operand => new Formula(operand));
  }

  /**
   * Getter that prints the "prettified" version of the current formula.
   * (No extra parens; one single space between operators and operands.)
   */
  get prettifiedFormula(): string {
    return Formula.prettyFormula(this.cleansedFormulaString);
  }

  /**
   * Returns true iff the formula string represents an atomic proposition.
   *
   * @param string - The string to test
   * @return - Is the input string atomic?
   */
  static isAtomicString = (string: string): boolean => {
    const cleansedString = Formula.removeWhiteSpace(
      Formula.trimOuterParens(string)
    );
    return RE.atomicVariable.test(cleansedString);
  };

  isAtomicString = (string = this.cleansedFormulaString): boolean =>
    Formula.isAtomicString(string);

  /**
   * Compares two formulas for equality (same propositions/operators/operands).
   *
   * @param formula - Formula to be compared.
   * @param formula2 - Other formula to be compared
   *                  (if absent, compares with `this` formula).
   * @return - Are the two formulas identical?
   */
  static isEqual = (
    formula: Formula | string,
    formula2: Formula | string
  ): boolean => {
    formula = formula instanceof Formula ? formula : new Formula(formula);
    const otherFormula =
      formula2 instanceof Formula ? formula2 : new Formula(formula2);
    return formula.cleansedFormulaString === otherFormula.cleansedFormulaString;
  };

  isEqual = (
    formula: Formula | string,
    formula2 = this as Formula | string
  ): boolean => Formula.isEqual(formula, formula2);

  /**
   * Takes a formula and recursively removes any "extra"
   * leading/trailing parentheses, i.e.:
   * `((p & (q -> r)))` => `p & (q -> r)`
   *
   * @note - This does *not* apply recursively.
   * (That would require parsing capabilities, which would make this method
   * unavailable within the [[parseStringBasic]] method.)
   * `((p & ((q -> r))))` => `p & ((q -> r))`
   *
   * @param formulaString - the string to be trimmed
   * @return              - the trimmed string
   */
  static trimOuterParens = (formulaString: string): string => {
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
    return Formula.trimOuterParens(formulaString.slice(1, length - 1));
  };

  trimOuterParens = (formulaString = this.cleansedFormulaString): string =>
    Formula.trimOuterParens(formulaString);

  /**
   * Remove all whitespace from a string.
   *
   * @param str - String to be trimmed.
   * @return - String with whitespace removed.
   */
  static removeWhiteSpace = (string: string): string =>
    string.replace(/\s/g, '');

  removeWhiteSpace = (str = this.cleansedFormulaString): string =>
    Formula.removeWhiteSpace(str);

  /**
   * Find the index of the main binary operator in a formula string,
   * if it exists, or `-1` if there is no main binary operator.
   *
   * @param trimmedFormulaString - The string to be analyzed.
   * We assume that extra parens have been trimmed.
   * @return - The index of the main operator.
   */
  static findMainBinaryOperatorIndex = (
    trimmedFormulaString: string
  ): number => {
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
   * Checks whether a formula is the negation of another.
   *
   * @param formula - formula to compare for negation
   * @param formula2 - formula to compare for negation
   * @return - Is `formula2` the negation of `formula`?
   */
  static isNegation = (
    formula: Formula | string,
    formula2: Formula | string
  ): boolean => {
    formula = formula instanceof Formula ? formula : new Formula(formula);
    const compareFormula =
      formula2 instanceof Formula ? formula2 : new Formula(formula2);
    return (
      (compareFormula.operator === '~' &&
        formula.isEqual(compareFormula.operands[0])) ||
      (formula.operator === '~' && compareFormula.isEqual(formula.operands[0]))
    );
  };

  isNegation = (
    formula: Formula | string,
    formula2 = this as Formula | string
  ): boolean => Formula.isNegation(formula, formula2);

  /**
   * Generate a new [[Formula]] that is the negation of the input formula
   * (or `this` formula by default).
   *
   * @param formula  - The formula to be negated.
   * @return - The negated formula.
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
   *
   * @param formula - the formula to "cleanse"
   * @return - the cleansed formula
   */
  private static cleanseFormulaString = (
    formula?: string
  ): string | undefined => {
    if (!formula) return;
    const parsed = Formula.parseStringBasic(formula);
    if (!parsed.operator) {
      return (
        formula && Formula.trimOuterParens(Formula.removeWhiteSpace(formula))
      );
    }
    let op1 = Formula.cleanseFormulaString(parsed.operands[0]);
    let op2 = Formula.cleanseFormulaString(parsed.operands[1]);
    const operator = parsed.operator;
    op1 = op1 && (op1.length > 1 ? `(${op1})` : op1);
    op2 = op2 && (op2.length > 1 ? `(${op2})` : op2);
    let result;
    if (op2) {
      result = `${op1} ${operator} ${op2}`;
    } else {
      result = operator + op1;
    }
    return Formula.trimOuterParens(Formula.removeWhiteSpace(result));
  };

  /**
   * Takes a formula string and returns an object with
   * the main operator and main operands in string form.
   *
   * @param formulaString - Formula string with extra parens removed.
   * @return - Object with operator and operands.
   */
  static parseStringBasic = (formulaString: string): ParsedInterface | null => {
    // TODO: Use this.cleanseFormulaString()?
    // TODO: Should an atomic proposition just return no operator or operands?

    // Remove whitespace and any unnecessary parens.
    formulaString = Formula.removeWhiteSpace(formulaString);
    formulaString = Formula.trimOuterParens(formulaString);

    if (Formula.isAtomicString(formulaString)) {
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

    const mainBinaryOperatorIndex = Formula.findMainBinaryOperatorIndex(
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

  parseStringBasic = (
    formulaString = this.cleansedFormulaString
  ): ParsedInterface | null => Formula.parseStringBasic(formulaString);

  /**
   * Returns true iff the `formulaString` is a well-formed formula (wff).
   * @param formulaString - The string to be analyzed.
   * @return - Does the string represent a wff?
   */
  static isWFFString = (formulaString: string): boolean => {
    // TODO: this.cleanseFormulaString()?
    formulaString = Formula.removeWhiteSpace(formulaString);
    formulaString = Formula.trimOuterParens(formulaString);
    if (formulaString.length === 1)
      return Formula.isAtomicString(formulaString);
    // Not an atomic formula, so parse it and continue.
    const formula = Formula.parseStringBasic(formulaString);
    if (formula === null) return false; // couldn't parse
    if (!RE.operator.test(formula.operator)) return false; // illegal operator
    // Every operand must also be a wff.
    return formula.operands.every(operand => Formula.isWFFString(operand));
  };

  isWFFString = (formulaString = this.formulaString): boolean =>
    Formula.isWFFString(formulaString);

  // TODO: Reconsider the treatment of `undefined` return values.
  // Ex. `p V q` where `{ p: true }` (and `q` is `undefined`).
  /**
   * Takes a formula (string) and a set of assignments of propositional
   * variables to truth values, and returns true iff the proposition
   * represented by the formula is true under the given assignment.
   * Returns `null` if the string is non-well-formed. (Cannot evaluate.)
   * Returns `undefined` if the formula contains atomic variables
   * that do not have an assignment. (Truth value is indeterminate.)
   *
   * @param formulaString - String representing the proposition to evaluate.
   * @param assignment - Assignment of truth values to atomic variables.
   * @return - Is the `formulaString` true under the `assignment`?
   */
  static evaluateFormulaString = (
    formulaString: string,
    assignment: AssignmentInterface
  ): boolean => {
    if (!Formula.isWFFString(formulaString)) return null;
    // Clean the formula.
    formulaString = Formula.removeWhiteSpace(formulaString);
    formulaString = Formula.trimOuterParens(formulaString);
    if (Formula.isAtomicString(formulaString)) {
      // Base case - atomic formula
      return assignment[formulaString];
    }
    const parsed = Formula.parseStringBasic(formulaString);
    const values = parsed.operands.map(operand => {
      if (Formula.isAtomicString(operand)) {
        return assignment[operand];
      } else {
        // If an operand is complex, recurse on it to get the value.
        return Formula.evaluateFormulaString(operand, assignment);
      }
    });
    // Apply the corresponding truth function with the values.
    return TRUTH_FUNCTIONS[parsed.operator](...values);
  };

  evaluateFormulaString = (
    formulaString: string,
    assignment: AssignmentInterface
  ): boolean => Formula.evaluateFormulaString(formulaString, assignment);

  // TODO: This function should probably return an array of Formulas.
  /**
   * Generate the headers for the truth table.
   *
   * @param formulaString - Optional formulaString argument.
   * @return - Truth table headers sorted alphabetically and by length.
   */
  generateTruthTableHeaders = (
    formulaString = this.cleansedFormulaString
  ): string[] => {
    const result: Set<string> = new Set();
    const helper = (formulaString: string): void => {
      result.add(formulaString);
      if (Formula.isAtomicString(formulaString)) {
        // Base case - atomic formula
        return;
      }
      const parsed = Formula.parseStringBasic(formulaString);
      parsed.operands.forEach(operand => {
        if (Formula.isAtomicString(operand)) {
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
      .map(Formula.prettyFormula);
  };

  /**
   * Takes a formulaString and returns a pretty, normalized formatting
   * with a single space between arguments and operators.
   *
   * @param formulaString - The formula to be prettified.
   * @return - Prettified formula.
   */
  static prettyFormula = (formulaString: string): string =>
    Formula.trimOuterParens(formulaString)
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/([a-zV&^(-(?>:>))])/g, (_, x) => x + ' ') // Add spaces
      .replace(/\(\s+/g, '(') // Remove spaces after `(`
      .replace(/\s+\)/g, ')') // Remove spaces before ')'
      .replace(/\s+$/g, ''); // Remove possible extra space at end

  prettyFormula = (formulaString = this.cleansedFormulaString): string =>
    Formula.prettyFormula(formulaString);

  /**
   * Returns a sorted list of the atomic variables of a `formulaString`.
   *
   * @param formulaString - The formula whose variables will be retrieved.
   * @return - An array with unique atomic variables (lower case letters),
   *           sorted alphabetically.
   */
  static getAtomicVariables = (formulaString: string): string[] => {
    const result: Set<string> = new Set();
    for (const letter of formulaString) {
      if (/[a-z]/.test(letter)) {
        result.add(letter);
      }
    }
    return Array.from(result).sort();
  };

  /**
   * Class method invoking the static method [[Formula.getAtomicVariables]].
   */
  getAtomicVariables = (formulaString = this.cleansedFormulaString): string[] =>
    Formula.getAtomicVariables(formulaString);

  /**
   * Generate a complete truth table with values filled in if
   * partial is true.
   *
   * @param formulaString
   * @param partial=false - Should we only fill out the atomic values?
   * @return - Truth table as matrix with values filled in.
   */
  generateTruthTable = (
    formulaString = this.cleansedFormulaString,
    partial = false
  ): boolean[][] => {
    const headers = this.generateTruthTableHeaders(formulaString);
    const atomicVars: string[] = Formula.getAtomicVariables(formulaString);
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
        result[j][i] = Formula.evaluateFormulaString(headers[i], assignment);
      }
    }
    return result;
  };

  static translateEnglishToSymbolic = (formulaString: string): string =>
    formulaString
      .replace(/\s*\bif and only if\b\s*/g, ' <-> ') // Replace 'if and only if'
      .replace(/\s*\bonly if\b\s*/g, ' -> ') // Replace 'only if'
      // NOTE: Next line should be valid (works in node console)
      // but won't compile.
      // Replace 'if' with '<-' if it's preceded by a word/letter but *not*
      // preceded by another connective.
      // The assumption is that 'p if q' occurs whenever 'if' follows
      // a propositional variable.
      .replace(/(?<=\w+.*)(?<!(and|or|then|only|if|not)(\s|\()*)\bif\b/g, '<-')
      .replace(/\s*\bor\b\s*/g, ' V ') // Replace 'or'.
      .replace(/\s*\band\b\s*/g, ' & ') // Replace 'and'.
      // Replace 'then' with '->' since 'then' only occurs in 'if...then'.
      .replace(/\s*\bthen\b\s*/g, ' -> ')
      // Replace 'not' with '~' if it follows an open parenthesis.
      .replace(/(?<=(\(|^))\s*\bnot\b\s*/g, '~')
      // Replace 'not' with ' ~' (extra space) otherwise.
      .replace(/\s*\bnot\b\s*/g, ' ~')
      .replace(/\s*\bimplies\b\s*/g, ' -> ') // Replace 'implies'.
      .replace(/\s*\bif\b\s*/g, ''); // Delete any remaining 'if's.
}
