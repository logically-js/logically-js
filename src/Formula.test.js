import { assert } from 'chai';

import Formula from './Formula';

describe('Formula', function() {
  it('should exist', function() {
    const formula = new Formula('p');
    assert.exists(formula);
  });
});
