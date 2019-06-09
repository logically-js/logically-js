import { assert } from 'chai';
import { inspect } from 'util';
import { arrayEquals } from './utils';

describe('Custom util functions', function() {
  describe('arrayEquals()', function() {
    const testCases = [
      { input: [[], []], output: true },
      { input: [[1, 2, 3], [1, 2, 3]], output: true },
      { input: [[1, 2, 3], ['1', '2', '3']], output: false },
      { input: [[1, 2, 3], [3, 2, 1]], output: false },
      { input: [[1, 2, 3], [1, 2]], output: false },
      { input: [[1, 2], [1, 2, 3]], output: false }
    ];
    for (const test of testCases) {
      it(`should return ${test.output} for ${inspect(
        test.input[0]
      )} and ${inspect(test.input[1])}`, function() {
        assert.equal(arrayEquals(...test.input), test.output);
      });
    }
  });
});