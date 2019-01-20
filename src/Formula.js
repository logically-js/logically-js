/**
 * Class for representing propositional formulas.
 */
class Formula {
  constructor(formulaString) {
    this.operator = null;
    this.operands = [];
    // this.parseFormulaString(formulaString);
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
    if (
      formulaString[0] !== '(' ||
      formulaString[length - 1] !== ')'
    ) {
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
        return formulaString
      }
    }
    return trimParens(formulaString.slice(1, length - 1));
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
   * Takes a formula and returns
   * @param  {string} formulaString - Formula string
   *                  with extra parens removed.
   * @return {[type]}                      [description]
   */
  parseString(formulaString) {
    // Remove whitespace and any unnecessary parens.
    formulaString = removeWhiteSpace(formulaString);
    formulaString = trimParens(formulaString);

    if (this.isAtomicString(formulaString)) {
      return {
        operator: null,
        operands: [formulaString]
      };
    }

    let operator = null;;
    const operands = [];

    const length = formulaString.length;
    let count = 0; // count of open parens
    for (let i = 0; i < length; i++) {
      const suffix = formulaString.slice(i);
      count += suffix[0] === '(';
      count -= suffix[0] === ')';
      const operatorMatch = suffix.match(RE.operator);
      if (operatorMatch) {
        operator = operatorMatch[0];
        const operatorLength = operator.length;
        formulaString.slice(0, i);
      }
    }
  }
}

const RE = {
  // Any lowercase alphabetic letter is an atomic variable.
  atomicVariable: /^[a-z]$/,
  // Operators are ~, V, &, ->, and <->
  operator: /^(~|V|&|->|<->)/
};

module.exports.default = Formula;
