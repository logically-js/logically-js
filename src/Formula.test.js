import { assert } from 'chai';

import Formula from './Formula';

describe('Formula', function() {
  it('should be imported correctly', function() {
    const formula = new Formula();
    assert.exists(formula);
  });
  describe('findMainBinaryOperatorIndex()', function() {
    describe('is correct for positive test cases', function() {
      const testCases = [
        { formula: 'p & q', result: 2 },
        { formula: 'p -> q', result: 2 },
        { formula: '(p & q) & r', result: 8 },
        { formula: '(p V q) -> (p & q)', result: 8 },
        { formula: '(p V q) -> (p & q)', result: 8 },
        { formula: 'p <-> q & r', result: 2 } // example of right-associativity
      ];
      for (const test of testCases) {
        it(`should return ${test.result} for the formula '${
          test.formula
        }'`, function() {
          const formula = new Formula();
          assert.equal(
            formula.findMainBinaryOperatorIndex(test.formula),
            test.result
          );
        });
      }
    });

    describe('is correct for negative test cases', function() {
      const testCases = [
        { formula: '~p', result: -1 }, // main operator is unary (not binary)
        { formula: '~(p V q)', result: -1 },
        { formula: 'p', result: -1 }, // atomic formula
        { formula: 'foo', result: -1 } // non-wff
      ];
      for (const test of testCases) {
        it(`should return ${test.result} for the formula '${
          test.formula
        }'`, function() {
          const formula = new Formula();
          assert.equal(
            formula.findMainBinaryOperatorIndex(test.formula),
            test.result
          );
        });
      }
    });

    describe('trimParens()', function() {
      const testCases = [
        { input: 'p & q', output: 'p & q' },
        { input: '(p & q)', output: 'p & q' },
        { input: '((p & q))', output: 'p & q' },
        { input: '(p & q) <-> (p V q)', output: '(p & q) <-> (p V q)' },
        { input: '((p & q) <-> (p V q))', output: '(p & q) <-> (p V q)' },
        { input: '(p & (p -> q))', output: 'p & (p -> q)' }
      ];
      for (const test of testCases) {
        it(`should return '${test.output}' for the formula '${
          test.input
        }'`, function() {
          const formula = new Formula();
          assert.equal(formula.trimParens(test.input), test.output);
        });
      }
    });
  });
});
