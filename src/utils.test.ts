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
      { input: [[1, 2], [1, 2, 3]], output: false },
      { input: [[[1, 2], [3, 4, 5]], [[1, 2], [3, 4, 5]]], output: true },
      {
        input: [[[1, 2, [3, 4]], [5, 6, 7]], [[1, 2, [3, 4]], [5, 6, 7]]],
        output: true
      },
      {
        input: [[[1, 2, [3, 4]], [5, 6, 7]], [[1, 2, [4, 3]], [5, 6, 7]]],
        output: false
      },
      { input: [[[1, 2, 3], [3, 4, 5]], [[1, 2], [3, 4, 5]]], output: false },
      { input: [[[1, 2], [3, 4, 5]], [[1, 2], [3, 4]]], output: false }
    ];
    for (const test of testCases) {
      it(`should return ${test.output} for ${inspect(
        test.input[0]
      )} and ${inspect(test.input[1])}`, function() {
        assert.equal(arrayEquals(test.input[0], test.input[1]), test.output);
      });
    }
  });
});
