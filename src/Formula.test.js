const assert = require('chai').assert;

const Formula = require('./Formula.js').default;

describe('Formula', function() {
  it('should exist', function() {
    const formula = new Formula('p');
    assert.exists(formula);
  });
});
