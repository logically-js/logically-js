import { assert } from 'chai';
import util from 'util';

import { arrayEquals } from './utils';

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

  describe('parseString()', function() {
    describe('handles the basic connectives', function() {
      const testCases = [
        { input: 'p', output: { operator: null, operands: ['p'] } },
        { input: 'p & q', output: { operator: '&', operands: ['p', 'q'] } },
        { input: 'p -> q', output: { operator: '->', operands: ['p', 'q'] } },
        { input: 'a <-> b', output: { operator: '<->', operands: ['a', 'b'] } },
        { input: '~p', output: { operator: '~', operands: ['p'] } }
      ];
      for (const test of testCases) {
        it(`should parse the formula '${
          test.input
        }' and return \`{ operator: '${
          test.output.operator
        }', operands: [${test.output.operands.map(
          p => `'${p}'`
        )}]}\``, function() {
          const formula = new Formula();
          const output = formula.parseString(test.input);
          assert.equal(output.operator, test.output.operator);
          assert.isTrue(arrayEquals(output.operands, test.output.operands));
        });
      }
    });

    describe('handles two connectives', function() {
      const testCases = [
        {
          input: 'p -> (p & q)',
          output: { operator: '->', operands: ['p', '(p&q)'] }
        },
        {
          input: '(p V q) -> r',
          output: { operator: '->', operands: ['(pVq)', 'r'] }
        },
        {
          input: '(p & q) V (r <-> s)',
          output: { operator: 'V', operands: ['(p&q)', '(r<->s)'] }
        },
        {
          input: '~(p -> q)',
          output: { operator: '~', operands: ['(p->q)'] }
        },
        {
          input: '~p -> q',
          output: { operator: '->', operands: ['~p', 'q'] }
        }
      ];
      for (const test of testCases) {
        it(`should parse the formula '${
          test.input
        }' and return \`{ operator: '${
          test.output.operator
        }', operands: [${test.output.operands.map(
          p => `'${p}'`
        )}]}\``, function() {
          const formula = new Formula();
          const output = formula.parseString(test.input);
          assert.equal(output.operator, test.output.operator);
          assert.isTrue(arrayEquals(output.operands, test.output.operands));
        });
      }
    });

    describe('handles complex cases', function() {
      const testCases = [
        {
          input: '(~(p & q) <-> (p -> (r V s)))',
          output: { operator: '<->', operands: ['~(p&q)', '(p->(rVs))'] }
        },
        {
          input: '(((p V (s & (q -> r)))))',
          output: { operator: 'V', operands: ['p', '(s&(q->r))'] }
        },
        {
          input: '((p & q) & (r & (s V p))) & ((p <-> q) V (r -> s))',
          output: {
            operator: '&',
            operands: ['((p&q)&(r&(sVp)))', '((p<->q)V(r->s))']
          }
        }
      ];
      for (const test of testCases) {
        it(`should parse the formula '${
          test.input
        }' and return \`{ operator: '${
          test.output.operator
        }', operands: [${test.output.operands.map(
          p => `'${p}'`
        )}]}\``, function() {
          const formula = new Formula();
          const output = formula.parseString(test.input);
          assert.equal(output.operator, test.output.operator);
          assert.isTrue(arrayEquals(output.operands, test.output.operands));
        });
      }
    });
  });

  describe('isWFFString()', function() {
    describe('should validate well-formed formulas', function() {
      const testCases = [
        { input: 'p', output: true },
        { input: 'p  ', output: true }, // Whitespace doesn't matter
        { input: 'p &  q', output: true },
        { input: 'p ->   q', output: true },
        { input: 'p   V  q', output: true }, // Lots of whitespace
        { input: 'p  <-> q', output: true },
        { input: '~p', output: true },
        { input: '(p  V q) -> (r & s)', output: true },
        { input: '(p V  (r & s))', output: true },
        { input: 'p ->  (q -> (r -> s))', output: true },
        { input: '(a  &   ~b) -> ~(~c V d)', output: true }
      ];
      for (const test of testCases) {
        it(`should recognize that the formula '${
          test.input
        }' is well-formed`, function() {
          const formula = new Formula();
          const isWFF = formula.isWFFString(test.input);
          assert.equal(isWFF, test.output);
        });
      }
    });

    describe('should recognize non-wff', function() {
      const testCases = [
        { input: 'pp', output: false },
        { input: 'p a ', output: false },
        { input: 'p->', output: false },
        { input: '~&p', output: false },
        { input: 'p~q', output: false },
        { input: 'p<-q', output: false },
        { input: '& p -> q', output: false },
        { input: 'p & 1', output: false }, // No illegal variables
        { input: 'p & $', output: false },
        { input: '* -> r', output: false },
        { input: 'p -> (q & )', output: false },
        { input: '(p -> q) -> ~', output: false },
        { input: '(p -> q))', output: false }, // Unbalanced parentheses
        { input: 'p (-> q)', output: false }
      ];
      for (const test of testCases) {
        it(`should recognize that the formula '${
          test.input
        }' is *not* well-formed`, function() {
          const formula = new Formula();
          const isWFF = formula.isWFFString(test.input);
          assert.equal(isWFF, test.output);
        });
      }
    });
  });

  describe('evaluateFormulaString()', function() {
    describe('should correctly evaluate atomic formulas', function() {
      const testCases = [
        { input: ['p', { p: true }], output: true },
        { input: ['p', { p: false }], output: false }
      ];
      for (const test of testCases) {
        const assignment = util.inspect(test.input[1]);
        it(`should recognize that the formula '${test.input[0]}'
        is ${test.output} under the assignment ${assignment}`, function() {
          const formula = new Formula();
          assert.equal(
            formula.evaluateFormulaString(...test.input),
            test.output
          );
        });
      }
    });

    describe('should correctly evaluate the basic connectives', function() {
      const testCases = [
        // NEGATION
        { input: ['~p', { p: true }], output: false },
        { input: ['~p', { p: false }], output: true },

        // CONJUNCTION
        { input: ['p & q', { p: true, q: true }], output: true },
        { input: ['p & q', { p: true, q: false }], output: false },
        { input: ['p & q', { p: false, q: true }], output: false },
        { input: ['p & q', { p: false, q: false }], output: false },

        // DISJUNCTION
        { input: ['p V q', { p: true, q: true }], output: true },
        { input: ['p V q', { p: true, q: false }], output: true },
        { input: ['p V q', { p: false, q: true }], output: true },
        { input: ['p V q', { p: false, q: false }], output: false },

        // CONDITIONAL
        { input: ['p -> q', { p: true, q: true }], output: true },
        { input: ['p -> q', { p: true, q: false }], output: false },
        { input: ['p -> q', { p: false, q: true }], output: true },
        { input: ['p -> q', { p: false, q: false }], output: true },

        // BICONDITIONAL
        { input: ['p <-> q', { p: true, q: true }], output: true },
        { input: ['p <-> q', { p: true, q: false }], output: false },
        { input: ['p <-> q', { p: false, q: true }], output: false },
        { input: ['p <-> q', { p: false, q: false }], output: true }
      ];
      for (const test of testCases) {
        const assignment = util.inspect(test.input[1]);
        it(`should recognize that the formula '${test.input[0]}'
        is ${test.output} under the assignment ${assignment}`, function() {
          const formula = new Formula();
          assert.equal(
            formula.evaluateFormulaString(...test.input),
            test.output
          );
        });
      }
    });
  });
});
