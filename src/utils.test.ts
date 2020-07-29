import { arrayEquals } from './utils';
import { assert } from 'chai';
import { flipOperator, getParensGroup } from './utils';
import { inspect } from 'util';

describe('Custom util functions', function() {
  describe('arrayEquals()', function() {
    const testCases = [
      { input: [[], []], output: true },
      {
        input: [
          [1, 2, 3],
          [1, 2, 3]
        ],
        output: true
      },
      {
        input: [
          [1, 2, 3],
          ['1', '2', '3']
        ],
        output: false
      },
      {
        input: [
          [1, 2, 3],
          [3, 2, 1]
        ],
        output: false
      },
      {
        input: [
          [1, 2, 3],
          [1, 2]
        ],
        output: false
      },
      {
        input: [
          [1, 2],
          [1, 2, 3]
        ],
        output: false
      },
      {
        input: [
          [
            [1, 2],
            [3, 4, 5]
          ],
          [
            [1, 2],
            [3, 4, 5]
          ]
        ],
        output: true
      },
      {
        input: [
          [
            [1, 2, [3, 4]],
            [5, 6, 7]
          ],
          [
            [1, 2, [3, 4]],
            [5, 6, 7]
          ]
        ],
        output: true
      },
      {
        input: [
          [
            [1, 2, [3, 4]],
            [5, 6, 7]
          ],
          [
            [1, 2, [4, 3]],
            [5, 6, 7]
          ]
        ],
        output: false
      },
      {
        input: [
          [
            [1, 2, 3],
            [3, 4, 5]
          ],
          [
            [1, 2],
            [3, 4, 5]
          ]
        ],
        output: false
      },
      {
        input: [
          [
            [1, 2],
            [3, 4, 5]
          ],
          [
            [1, 2],
            [3, 4]
          ]
        ],
        output: false
      }
    ];
    for (const test of testCases) {
      it(`should return ${test.output} for ${inspect(
        test.input[0]
      )} and ${inspect(test.input[1])}`, function() {
        assert.equal(arrayEquals(test.input[0], test.input[1]), test.output);
      });
    }
  });

  describe('getParensGroup()', () => {
    it('gets a parens group from a string', () => {
      let string = 'p & (q V r)';
      let result = getParensGroup(string, 4);
      assert.equal(result.string, 'q V r');
      assert.equal(result.start, 4);
      assert.equal(result.end, 10);

      string = '((p V q) -> r)';
      result = getParensGroup(string, 0);
      assert.equal(result.string, '(p V q) -> r');
      assert.equal(result.start, 0);
      assert.equal(result.end, 13);

      string = 'p -> ((q<r) -> (p & (q V s)))';
      result = getParensGroup(string, 5);
      assert.equal(result.string, '(q<r) -> (p & (q V s))');
      assert.equal(result.start, 5);
      assert.equal(result.end, 28);

      // start at no parens
      string = 'p -> ((q<r) -> (p & (q V s)))';
      result = getParensGroup(string, 7);
      assert.equal(result.string, '');
      assert.equal(result.start, 7);
      assert.equal(result.end, 7);
    });
  });

  describe('flipOperator()', () => {
    it('works', () => {
      assert.equal('&', flipOperator('V'));
      assert.equal('V', flipOperator('&'));
      assert.equal('~', flipOperator('~'));
    });
  });
});
