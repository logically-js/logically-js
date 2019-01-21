/**
 * Class for representing propositional formulas.
 */
class Formula {
  /**
   * Class constructor
   * @param {string} formulaString - A logical formula in string format.
   */
  constructor(formulaString) {
    this.operator = null;
    this.operands = [];
    this.formulaString = formulaString;
    if (formulaString) {
      this.formula = this.parseString(formulaString);
      this.operator = this.formula.operator;
      this.operands = this.formula.operands;
    }
  }

  /**
   * Is the formula an atomic proposition?
   * @return {boolean}
   */
  get isAtomic() {
    return this.operator === null;
  }

  /**
   * Returns true iff the formula string represents an atomic proposition.
   * @param  {string}  string - The string to test
   * @return {boolean}        - Is the input string atomic?
   */
  isAtomicString(string) {
    return RE.atomicVariable.test(string);
  }

  /**
   * Takes a formula and recursively removes any "extra"
   * leading/trailing parentheses, i.e.:
   * `((p & (q -> r)))` => `p & (q -> r)`
   * @param  {string} formulaString - the string to be trimmed
   * @return {string}               - the trimmed string
   */
  trimParens(formulaString) {
    const length = formulaString.length;
    if (formulaString[0] !== '(' || formulaString[length - 1] !== ')') {
      return formulaString; // if no leading/trailing parens, just return;
    }
    // Walk through the string and see if the open parens count ever hits 0.
    // If it doesn't until the end, the leading/trailing parens are unnecessary.
    let count = 1;
    for (let i = 1; i < length - 1; i++) {
      const char = formulaString[i];
      count += char === '(';
      count -= char === ')';
      if (count === 0) {
        return formulaString;
      }
    }
    return this.trimParens(formulaString.slice(1, length - 1));
  }

  /**
   * Remove all whitespace from a string.
   * @param  {string} string - String to be trimmed.
   * @return {string}        - String with whitespace removed.
   */
  removeWhiteSpace(string) {
    return string.replace(/\s/g, '');
  }

  /**
   * Find the index of the main binary operator in a formula string,
   * if it exists.
   * @param  {string} trimmedFormulaString - The string to be analyzed.
   *                  We assume that extra parens have been trimmed.
   * @return {number}                      - The index of the main operator.
   */
  findMainBinaryOperatorIndex(trimmedFormulaString) {
    /*
     * The main binary operator in a (trimmed) wff is the first binary operator
     * that you see when there are no open parens.
     * If there is no main binary operator, the formula must be atomic,
     * or the main operator is negation, or it is not well formed.
     */
    const length = trimmedFormulaString.length;
    let count = 0;
    for (let i = 0; i < length; i++) {
      const suffix = trimmedFormulaString.slice(i);
      if (count === 0) {
        const operatorMatch = suffix.match(RE.binaryOperator);
        if (operatorMatch) {
          return i;
        }
      }
      count += suffix[0] === '(';
      count -= suffix[0] === ')';
    }
    return -1; // no main binary operator found.
  }

  /**
   * Takes a formula string and returns an object with
   * the main operator and main operands.
   * @param  {string} formulaString - Formula string
   *                                  with extra parens removed.
   * @return {object}               - Object with operator and operands.
   */
  parseString(formulaString) {
    // Remove whitespace and any unnecessary parens.
    formulaString = this.removeWhiteSpace(formulaString);
    formulaString = this.trimParens(formulaString);

    console.log('Trimmed formulaString: ', formulaString);

    if (this.isAtomicString(formulaString)) {
      console.log('isAtomicString');
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
    // (By default, we apply right-associativity if there is ambiguity.)

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
      const operator = match[0];
      const operandL = formulaString.slice(0, mainBinaryOperatorIndex);
      const operandR = formulaString.slice(
        mainBinaryOperatorIndex + operator.length
      );
      // const operandR = new Formula(
      //   formulaString.slice(mainBinaryOperatorIndex + operator.length)
      // );
      // const operandL = new Formula(
      //   formulaString.slice(0, mainBinaryOperatorIndex)
      // );
      // const operandR = new Formula(
      //   formulaString.slice(mainBinaryOperatorIndex + operator.length)
      // );
      console.log('operator', operator);
      console.log('operands', [operandL, operandR]);
      return {
        operator,
        operands: [operandL, operandR]
      };
    } else {
      // Main operator should be negation.
      if (RE.unaryOperator.test(formulaString)) {
        // Main operator is negation.
        const subFormula = new Formula(formulaString.slice(1));
        return {
          operator: '~',
          operands: [subFormula]
        };
      }
    }

    // Unable to parse the formula.
    throw new Error('Not a well-formed formula.');
  }
}

/**
 * Enum of regular expressions for testing various logical patterns.
 * @type {Object}
 */
const RE = {
  // Any lowercase alphabetic letter is an atomic variable.
  atomicVariable: /^([a-z])$/,
  // Operators are ~, V, &, ->, and <->.
  binaryOperator: /^(V|&|->|<->)/,
  operator: /^(~|V|&|->|<->)/,
  unaryOperator: /^(~)/
};

export default Formula;
