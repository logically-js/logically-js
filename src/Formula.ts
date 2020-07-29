import {
  /* eslint-disable-next-line */ // eslint complains about this as `no-unused-vars`
  Operator,
  RE,
  TRUTH_FUNCTIONS
} from './constants';

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
  public operands: Formula[];

  /**
   * @param formulaString - A logical formula in string format.
   */
  constructor(formulaString?: string) {
    if (formulaString && !Formula.isWFFString(formulaString)) {
      throw new Error('Formula string is not well-formed.');
    }
    this.formulaString = formulaString;
    this.operator = null;
    this.operands = [];

    if (!formulaString) return;

    const clean = Formula.cleanStringBasic(formulaString);

    if (Formula.isAtomicString(clean)) {
      // base case - string is atomic proposition
      this.cleansedFormulaString = clean;
      return;
    }

    const { operator, operands } = Formula.findMainOp(clean);
    this.operator = operator;
    this.operands = operands.map(o => new Formula(o));
    this.cleansedFormulaString = Formula.cleanseFormulaString(formulaString);
  }

  /**
   * Getter that prints the "prettified" version of the current formula.
   * (No extra parens; one single space between operators and operands.)
   */
  get prettifiedFormula(): string {
    return this.prettyFormula();
  }

  /**
   * Returns true iff the formula string represents an atomic proposition.
   *
   * @param str - The string to test
   * @return - Is the input string atomic?
   */
  static isAtomicString = (str: string): boolean => {
    str = Formula.removeWhiteSpace(str); // strip whitespace
    if (RE.atomicVariable.test(str) || RE.atomicPLStatement.test(str)) {
      return true;
    }
    return false;
  };

  /**
   * Returns a partially cleansed version of a formulaString with
   * whitespace removed and outer parens removed.
   *
   * @example
   * Formula.cleanStringBasic('(())')
   *
   * @param  Formula.removeWhiteSpace(formulaString [description]
   * @return                                        [description]
   */
  static cleanStringBasic = (str: string): string =>
    Formula.removeOuterParens(Formula.removeWhiteSpace(str));

  /**
   * Getter that specifies whether the current formula is atomic.
   * @return - is the formula atomic?
   */
  get isAtomic() {
    return Formula.isAtomicString(this.cleansedFormulaString);
  }

  /**
   * Remove all whitespace from a string.
   *
   * @param str - String to be trimmed.
   * @return - String with whitespace removed.
   */
  static removeWhiteSpace = (str = ''): string => str.replace(/\s*/g, '');

  removeWhiteSpace = (str = this.cleansedFormulaString): string =>
    Formula.removeWhiteSpace(str);

  /**
   * Determines whether a string has extra, unnecessary parens
   * around the whole string.
   * Basically, we walk through the string and make sure the opening
   * parens closes at the end of the string.
   * We have to avoid closing the parens early for a case
   * like `(p V q) & (r V s)`, which has outer parens but
   * they do not form a pair.
   *
   * @example
   * Formula.hasOuterParens('p V (q V r)') === false
   * @example
   * Formula.hasOuterParens('(p V (q V r))') === true
   *
   * @param  str - The string to check for outer parens.
   * @return - does the string have outer parens?
   */
  static hasOuterParens = (str: string): boolean => {
    str = Formula.removeWhiteSpace(str);
    if (str[0] !== '(' || str[str.length - 1] !== ')') {
      return false;
    }
    let count = 0;
    let i = 0;
    let hasClosed = false;
    for (; i < str.length; i++) {
      const char = str[i];
      count += Number(char === '(');
      count -= Number(char === ')');
      if (count === 0 && i < str.length - 1) {
        hasClosed = true;
      }
      if (!hasClosed && count === 0 && i === str.length - 1) {
        // the opening parens have closed at the end.
        return true;
      }
    }
    return false;
  };

  /**
   *  Removes unnecessary outer parens surrounding a formula, recursively.
   * (This is useful in finding the main operator.)
   * @param  str - The string whose outer parens are to be removed.
   * @return - String with all outer parens removed.
   */
  static removeOuterParens = (str: string): string => {
    if (Formula.isAtomicString(str)) {
      return str;
    }
    if (str[0] !== '(' || str[str.length - 1] !== ')') {
      return str;
    }
    const hasOuterParens = Formula.hasOuterParens(str);
    if (hasOuterParens) {
      // The parens count has closed at the end, so the parens are extra
      // so we recurse.
      return Formula.removeOuterParens(str.slice(1, -1));
    }
    return str;
  };

  /**
   * Analyzes a string to find the main operator, if it has one,
   * and returns an object with the operator and operand(s) (in string format).
   *
   * @example
   * Formula.findMainOp('(p & r) V q') === {
   *  index: 2,
   *  operator: 'V',
   *  operands: ['p & r', 'q']
   * }
   *
   * @param  str [description]
   * @return     [description]
   */
  static findMainOp = (
    str: string
  ): {
    index: number;
    operator: Operator;
    operands: string[];
  } => {
    // The main op is the first one we encounter when the parens count is 0. (This doesn't work if there are outer parens.)
    str = Formula.removeOuterParens(str);
    let count = 0;
    let i = 0;
    const len = str.length;
    for (; i < len; i++) {
      count += Number(str[i] === '(');
      count -= Number(str[i] === ')');
      if (count === 0) {
        const x = RE.binaryOperator.exec(str.slice(i));
        if (x) {
          // No open parens and we found a binary operator
          const len = x[1].length; // binary operators can have variable length
          return {
            index: i,
            operator: x[1] as Operator,
            operands: [str.slice(0, i), str.slice(i + len)]
          };
        }
      }
    }

    // There's no binary operator, so look for other operators.
    // This search has to come after, because
    // otherwise `~(p) V q` would be caught as a negation.

    // negated formula
    if (str[0] === '~') {
      return {
        index: 0,
        operator: '~',
        operands: [str.slice(1)]
      };
    }

    // quantified formula
    // (quantifiers are treated as operators, and the scope is the operand)
    const g = /[EA][a-z]/.exec(str);
    if (g) {
      return {
        index: 0,
        operator: g[0] as Operator,
        operands: [str.slice(2)]
      };
    }

    // no main operator found (atomic)
    return {
      index: -1,
      operator: null,
      operands: []
    };
  };

  /**
   * Determines whether a string is a well-formed formula (wff).
   * Currently all operators and predicates must use parentheses to be wff.
   * (ex. `Fx` => `F(x)`)
   *
   * @param  str - String to test for wff.
   * @return - Is the string a wff?
   */
  static isWFFString = (str = ''): boolean => {
    // quantifiers must be followed by variables.
    if (/[AE][^a-z]/g.test(str)) return false; // ex. `A xF(x)`
    if (/[B-DF-UW-Z][^(]/g.test(str)) return false; // ex. `F (a)`, `Fa`
    // // quantifiers must be follows by parens
    if (/[AE][a-z][^(]/.test(str)) return false; // ex. Ex (F(x))
    // certain extra whitespace is permitted, so just remove it
    const openParensN = str.replace(/[^(]/g, '').length;
    const closedParensN = str.replace(/[^)]/g, '').length;
    // parens must be balanced
    if (openParensN !== closedParensN) return false;
    str = Formula.cleanStringBasic(str);
    const mainOp = Formula.findMainOp(str);
    if (mainOp.index === -1) {
      // no operator - `str` should be atomic.
      if (Formula.isAtomicString(str)) {
        return true;
      } else {
        return false;
      }
    } else {
      // Every subformula (operand) must be wff as well.
      return mainOp.operands.every(op => Formula.isWFFString(op));
    }
  };

  isAtomicString = (string = this.cleansedFormulaString): boolean =>
    Formula.isAtomicString(string);

  /**
   * Remove all whitespace and unnecessary parentheses from a formula.
   * This produces a canonical string representation of a formula.
   *
   * @example
   * Formula.cleanseFormulaString(' (( p V (q))) -> ((r))') === `(pVq)->r`
   *
   * @param formula - the formula to "cleanse"
   * @return - the cleansed formula
   */
  static cleanseFormulaString = (str: string): string => {
    if (!Formula.isWFFString(str)) {
      return str;
    }
    str = Formula.cleanStringBasic(str);
    if (Formula.isAtomicString(str)) {
      // base case
      return str;
    }
    const mainOp = Formula.findMainOp(str);
    if (mainOp.operands.length === 2) {
      // binary operator - recurse on both operands
      const operator = mainOp.operator;
      const operandL = Formula.removeOuterParens(mainOp.operands[0]);
      const operandR = Formula.removeOuterParens(mainOp.operands[1]);
      const isAtomicL = Formula.isAtomicString(operandL);
      const isAtomicR = Formula.isAtomicString(operandR);

      // Add parens around non-atomic operands and build the return string
      // by recursively cleansing the subformulas.
      return `${isAtomicL ? '' : '('}${Formula.cleanseFormulaString(operandL)}${
        isAtomicL ? '' : ')'
      }${operator}${isAtomicR ? '' : '('}${Formula.cleanseFormulaString(
        operandR
      )}${isAtomicR ? '' : ')'}`;
    } else if (mainOp.operator === '~') {
      const operandL = Formula.removeOuterParens(mainOp.operands[0]);
      const isAtomicL = Formula.isAtomicString(operandL);

      return `~${isAtomicL ? '' : '('}${operandL}${isAtomicL ? '' : ')'}`;
    }
    return str;
  };

  /**
   * Compares two formulas for equality (same propositions/operators/operands).
   * Uses the `cleansedFormulaString` as the comparator.
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
   * Checks whether a formula is the negation of another.
   *
   * @param formula - formula to compare for negation
   * @param formula2 - formula to compare for negation
   * @return - Is `formula2` the negation of `formula`?
   */
  static isNegation = (
    formula1: Formula | string,
    formula2: Formula | string
  ): boolean => {
    formula1 = formula1 instanceof Formula ? formula1 : new Formula(formula1);
    formula2 = formula2 instanceof Formula ? formula2 : new Formula(formula2);

    return (
      (formula1.operator === '~' && formula2.isEqual(formula1.operands[0])) ||
      (formula2.operator === '~' && formula1.isEqual(formula2.operands[0]))
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
  static negateFormula = (formula: Formula | string): Formula => {
    formula = typeof formula === 'string' ? new Formula(formula) : formula;
    if (formula.operator === '~') {
      return new Formula(formula.cleansedFormulaString.slice(1));
    } else {
      return new Formula(`~(${formula.cleansedFormulaString})`);
    }
  };

  negateFormula = (
    formula = this.cleansedFormulaString as Formula | string
  ): Formula => Formula.negateFormula(formula);

  // TODO: Reconsider the treatment of `undefined` return values.
  // Ex. `p | q` where `{ p: true }` (and `q` is `undefined`).
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
    const formula = new Formula(formulaString);
    // formulaString = Formula.trimExtraParens(formulaString);
    if (formula.isAtomic) {
      // Base case - atomic formula
      return assignment[formula.cleansedFormulaString];
    }
    const values = formula.operands.map(operand => {
      if (operand.isAtomic) {
        return assignment[operand.cleansedFormulaString];
      } else {
        // If an operand is complex, recurse on it to get the value.
        return operand.evaluateFormulaString(
          operand.cleansedFormulaString,
          assignment
        );
      }
    });
    // Apply the corresponding truth function with the values.
    return TRUTH_FUNCTIONS[formula.operator](...values);
  };

  evaluateFormulaString = (
    formulaString: string,
    assignment: AssignmentInterface
  ): boolean => Formula.evaluateFormulaString(formulaString, assignment);

  /**
   * Generate the headers for the truth table.
   *
   * @param formulaString - Optional formulaString argument.
   * @return - Truth table headers sorted alphabetically and by length.
   */
  static generateTruthTableHeaders = (formulaString: string): string[] => {
    const result: Set<string> = new Set();
    const helper = (formulaString: string): void => {
      formulaString = Formula.cleanseFormulaString(formulaString);
      result.add(formulaString);
      const formula = new Formula(formulaString);
      if (formula.isAtomic) {
        // Base case - atomic formula
        return;
      }
      formula.operands.forEach(operand => {
        if (operand.isAtomic) {
          result.add(operand.cleansedFormulaString);
        } else {
          // If an operand is complex, recurse on it to get the value.
          const h = Formula.generateTruthTableHeaders(
            operand.cleansedFormulaString
          );
          for (const x of h) {
            result.add(x);
          }
        }
      });
    };
    helper(formulaString);
    return Array.from(result)
      .sort(Formula.truthTableHeaderSort)
      .map(str => new Formula(str).prettifiedFormula);
  };

  static truthTableHeaderSort = (a: string, b: string): number => {
    if (a.length < b.length) return -1;
    else if (a.length > b.length) return 1;
    else return a < b ? -1 : b < a ? 1 : 0;
  };

  generateTruthTableHeaders = (formulaString = this.formulaString): string[] =>
    Formula.generateTruthTableHeaders(formulaString);

  /**
   * Takes a formulaString and returns a pretty, normalized formatting
   * with a single space between arguments and operators.
   *
   * @param formulaString - The formula to be prettified.
   * @return - Prettified formula.
   */
  static prettyFormula = (formulaString: string): string =>
    Formula.cleanseFormulaString(formulaString)
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
   * @note - may cause unexpected behavior with quantified formulas.
   * @todo - Switch to subset of alphabet for propositional vars.
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
  static generateTruthTable = (
    formulaString: string,
    partial = false
  ): boolean[][] => {
    const headers = Formula.generateTruthTableHeaders(formulaString);
    const atomicVars: string[] = new Formula(
      formulaString
    ).getAtomicVariables();
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

  generateTruthTable = (partial = false): boolean[][] =>
    Formula.generateTruthTable(this.cleansedFormulaString, partial);

  // static translateEnglishToSymbolic = (formulaString: string): string =>
  //   formulaString
  //     .replace(/\s*\bif and only if\b\s*/g, ' <-> ') // Replace 'if and only if'
  //     .replace(/\s*\bonly if\b\s*/g, ' -> ') // Replace 'only if'
  //     // Replace 'if' with '<-' if it's preceded by a word/letter but *not*
  //     // preceded by another connective.
  //     // The assumption is that 'p if q' occurs whenever 'if' follows
  //     // a propositional variable.
  //     .replace(/(?<=\w+.*)(?<!(and|or|then|only|if|not)(\s|\()*)\bif\b/g, '<-')
  //     .replace(/\s*\bor\b\s*/g, ' | ') // Replace 'or'.
  //     .replace(/\s*\band\b\s*/g, ' & ') // Replace 'and'.
  //     // Replace 'then' with '->' since 'then' only occurs in 'if...then'.
  //     .replace(/\s*\bthen\b\s*/g, ' -> ')
  //     // Replace 'not' with '~' if it follows an open parenthesis.
  //     .replace(/(?<=(\(|^))\s*\bnot\b\s*/g, '~')
  //     // Replace 'not' with ' ~' (extra space) otherwise.
  //     .replace(/\s*\bnot\b\s*/g, ' ~')
  //     .replace(/\s*\bimplies\b\s*/g, ' -> ') // Replace 'implies'.
  //     .replace(/\s*\bif\b\s*/g, ''); // Delete any remaining 'if's.

  /**
   * Generate a random `formulaString` with params to configure difficulty/
   * complexity.
   *
   * @param nVariables - The maximum number of atomic variables to have in the
   * formulaString. (Actual number could be less.)
   * @param difficulty - A number between 0 and 1 that tunes the difficulty.
   * @param minRecursionLevel - Minimum recursion level for the formula.
   * @param maxRecursionLevel - Maximum recursion level for the formula.
   * @param recursionLevel - Current recursion level of this invocation. (Only
   * used internally to this function.)
   * @return - A random formulaString that meets the complexity requirements
   * of the configuration.
   */
  static generateRandomFormulaString = ({
    nVariables = 2,
    difficulty = 0.5,
    maxRecursionLevel = 4,
    recursionLevel = 0,
    minRecursionLevel = 2
  }: generateRandomFormulaInterface = {}): string => {
    const pickVariable = (n: number): string =>
      String.fromCharCode(
        'p'.charCodeAt(0) + Math.round(Math.random() * (n - 1))
      );

    const pickOperator = (): string =>
      ['&', 'V', '->', '~', '<->'][Math.round(Math.random() * 4)];

    if (
      (recursionLevel >= minRecursionLevel && Math.random() > difficulty) ||
      recursionLevel === maxRecursionLevel
    ) {
      return pickVariable(nVariables);
    } else {
      const operator = pickOperator();
      if (operator === '~') {
        return `~(${Formula.generateRandomFormulaString({
          nVariables,
          difficulty,
          maxRecursionLevel,
          recursionLevel: recursionLevel + 1
        })})`;
      } else {
        return `(${Formula.generateRandomFormulaString({
          nVariables,
          difficulty,
          maxRecursionLevel,
          recursionLevel: recursionLevel + 1
        })}) ${operator} (${Formula.generateRandomFormulaString({
          nVariables,
          difficulty,
          maxRecursionLevel,
          recursionLevel: recursionLevel + 1
        })})`;
      }
    }
  };

  /**
   * Generate a random [[Formula]] by invoking the [[Formula]] creator on
   * a random formulaString as generated by
   * [[Formula.generateRandomFormulaString]].
   */
  static generateRandomFormula = (
    args?: generateRandomFormulaInterface
  ): Formula => new Formula(Formula.generateRandomFormulaString(args));
}

interface generateRandomFormulaInterface {
  nVariables?: number;
  difficulty?: number;
  minRecursionLevel?: number;
  maxRecursionLevel?: number;
  recursionLevel?: number;
}
