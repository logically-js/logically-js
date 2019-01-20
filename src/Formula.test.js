import { assert } from 'chai';

import Formula from './Formula';

describe('Formula', function() {
  it('should exist', function() {
    const formula = new Formula();
    assert.exists(formula);
  });
  describe('findMainBinaryOperatorIndex', function() {
    const testCases = [
      { formula: 'p & q', result: 2 },
      { formula: 'p -> q', result: 2 },
      { formula: '(p & q) & r', result: 8 },
      { formula: '(p V q) -> (p & q)', result: 8 },
      /** Negative cases. */
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
});
