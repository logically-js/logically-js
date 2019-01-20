import { assert } from 'chai';

import Formula from './Formula';

describe('Formula', function() {
  it('should exist', function() {
    const formula = new Formula();
    assert.exists(formula);
  });
  describe('findMainBinaryOperatorIndex', function() {
    it('should return 2 for the formula `p & q` ', function() {
      const formula = new Formula();
      assert.equal(formula.findMainBinaryOperatorIndex('p & q'), 2);
    });

    it('should return 2 for the formula `p -> q`', function() {
      const formula = new Formula();
      assert.equal(formula.findMainBinaryOperatorIndex('p -> q'), 2);
    });

    it('should return 8 for the formula `(p & q) & r`', function() {
      const formula = new Formula();
      assert.equal(formula.findMainBinaryOperatorIndex('(p & q) & r'), 8);
    });

    it('should return 8 for the formula `(p V q) -> (p & q)`', function() {
      const formula = new Formula();
      assert.equal(
        formula.findMainBinaryOperatorIndex('(p V q) -> (p & q)'),
        8
      );
    });
  });
});
