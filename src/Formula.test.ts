import { assert } from 'chai';
import { inspect } from 'util';
import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import translateEnglishToSymbolic from './Formula.translate';
import { arrayEquals } from './utils';

/* eslint-disable-next-line */
import { AssignmentInterface, Formula } from './Formula';

interface MockTruthTableInterface {
  formula: string;
  headers: string[];
  table: boolean[][];
}

describe('Formula', function() {
  it('should be imported correctly', function() {
    const formula = new Formula('p');
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
        it(`should return ${test.result} for the formula '${test.formula}'`, function() {
          const formula = new Formula('p');
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
        it(`should return ${test.result} for the formula '${test.formula}'`, function() {
          const formula = new Formula('p');
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
      { input: '(p & (p -> q))', output: 'p & (p -> q)' },
      { input: 'p & (q)', output: 'p & q' },
      { input: '((p) & ((q)))', output: 'p & q' }
    ];
    for (const test of testCases) {
      it(`should return '${test.output}' for the formula '${test.input}'`, function() {
        const formula = new Formula('p');
        assert.equal(formula.trimParens(test.input), test.output);
      });
    }
  });

  describe('cleanseFormulaString()', function() {
    const testCases = [
      { input: 'p & q', output: 'p&q' },
      { input: '(p & q)', output: 'p&q' },
      { input: '((p & q))', output: 'p&q' },
      { input: '(p & q) <-> (p V q)', output: '(p&q)<->(pVq)' },
      { input: '((p & q) <-> (p V q))', output: '(p&q)<->(pVq)' },
      { input: '(p & (p -> q))', output: 'p&(p->q)' },
      { input: 'p & (q)', output: 'p&q' },
      { input: '((p) & ((q)))', output: 'p&q' },
      { input: 'p -> ((q & r))', output: 'p->(q&r)' },
      { input: '((p) -> (((q) & r)))', output: 'p->(q&r)' }
    ];
    for (const test of testCases) {
      it(`should return '${test.output}' for the formula '${test.input}'`, function() {
        const formula = new Formula('p');
        assert.equal(formula.cleanseFormulaString(test.input), test.output);
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
          const formula = new Formula('p');
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
          const formula = new Formula('p');
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
          const formula = new Formula('p');
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
        it(`should recognize that the formula '${test.input}' is well-formed`, function() {
          const formula = new Formula('p');
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
        { input: 'p#q', output: false },
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
        it(`should recognize that the formula '${test.input}' is *not* well-formed`, function() {
          const formula = new Formula('p');
          const isWFF = formula.isWFFString(test.input);
          assert.equal(isWFF, test.output);
        });
      }
    });
  });

  interface TestCaseInterface {
    input: [string, AssignmentInterface];
    output: boolean | null;
  }

  describe('evaluateFormulaString()', function() {
    describe('should correctly evaluate atomic formulas', function() {
      const testCases: TestCaseInterface[] = [
        { input: ['p', { p: true }], output: true },
        { input: ['p', { p: false }], output: false },
        { input: ['pq', { p: false, q: true }], output: null }
      ];
      for (const test of testCases) {
        const assignment = inspect(test.input[1]);
        it(`should recognize that the formula '${test.input[0]}'
        is ${test.output} under the assignment ${assignment}`, function() {
          const formula = new Formula('p');
          assert.equal(
            formula.evaluateFormulaString(...test.input),
            test.output
          );
        });
      }
    });

    describe('should correctly evaluate the basic connectives', function() {
      const testCases: TestCaseInterface[] = [
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
        const assignment = inspect(test.input[1]);
        it(`should recognize that the formula '${test.input[0]}'
        is ${test.output} under the assignment ${assignment}`, function() {
          const formula = new Formula('p');
          assert.equal(
            formula.evaluateFormulaString(...test.input),
            test.output
          );
        });
      }
    });

    describe('should correctly evaluate more complex formulas', function() {
      const testCases: TestCaseInterface[] = [
        { input: ['p -> (q -> p)', { p: true, q: true }], output: true },
        { input: ['p -> (q -> p)', { p: true, q: false }], output: true },
        { input: ['p -> (q -> p)', { p: false, q: true }], output: true },
        { input: ['p -> (q -> p)', { p: false, q: false }], output: true },
        { input: ['p  -> ( q ->  (p))', { p: false, q: false }], output: true },

        { input: ['p & (q V p)', { p: true, q: true }], output: true },
        { input: ['p & (q V p)', { p: true, q: false }], output: true },
        { input: ['p & (q V p)', { p: false, q: true }], output: false },
        { input: ['p & (q V p)', { p: false, q: false }], output: false },

        { input: ['(p & q) -> p', { p: true, q: true }], output: true },
        { input: ['(p & q) -> p', { p: true, q: false }], output: true },
        { input: ['(p & q) -> p', { p: false, q: true }], output: true },
        { input: ['(p & q) -> p', { p: false, q: false }], output: true },

        { input: ['(p -> q) V (q -> p)', { p: true, q: true }], output: true },
        { input: ['(p -> q) V (q -> p)', { p: true, q: false }], output: true },
        { input: ['(p -> q) V (q -> p)', { p: false, q: true }], output: true },
        { input: ['(p -> q)V(q -> p)', { p: false, q: false }], output: true },

        { input: ['(p -> q) V (q -> p)', { p: true, q: true }], output: true },
        { input: ['(p -> q) V (q -> p)', { p: true, q: false }], output: true },
        { input: ['(p -> q) V (q -> p)', { p: false, q: true }], output: true },
        { input: ['(p->(q))V (q ->p)', { p: false, q: false }], output: true },

        {
          input: ['(p <-> q) -> (p -> q)', { p: true, q: true }],
          output: true
        },
        {
          input: ['(p <-> q) -> (p -> q)', { p: false, q: false }],
          output: true
        },
        {
          input: ['(p <-> q) -> (p -> q)', { p: true, q: false }],
          output: true
        },
        {
          input: ['(p <-> q) -> (p -> q)', { p: false, q: true }],
          output: true
        },
        {
          input: ['(p <-> q) -> (p -> q)', { p: false, q: false }],
          output: true
        }
      ];
      for (const test of testCases) {
        const assignment = inspect(test.input[1]);
        it(`should recognize that the formula '${test.input[0]}' is ${test.output} under the assignment ${assignment}`, function() {
          const formula = new Formula('p');
          assert.equal(
            formula.evaluateFormulaString(...test.input),
            test.output
          );
        });
      }
    });
  });

  describe('isEqual()', () => {
    const testCases = [
      /** POSITIVE CASES */
      { input: ['p', 'p'], output: true },
      { input: ['q', 'q'], output: true },
      { input: ['~p', '~p'], output: true },
      { input: ['(p & q)', 'p & q'], output: true },
      { input: ['p -> (q & r)', 'p  ->  (  q & r)'], output: true },
      {
        input: ['(p V q) <-> (p & ~q)', '((pVq)  <-> (p & ~q))'],
        output: true
      },
      /** NEGATIVE CASES */
      { input: ['p', '~q'], output: false },
      { input: ['p', 'p & p'], output: false },
      { input: ['~(p & q)', '~p & q'], output: false },
      { input: ['(p & q)', '~(~(p & q))'], output: false },
      { input: ['p -> (q & r)', 'p -> ~(q & r)'], output: false },
      {
        input: ['(p V q) <-> (p & ~q)', '~((p&q)  <-> (p & ~q))'],
        output: false
      }
    ];
    for (const test of testCases) {
      it(`should recognize that the formula ${test.input[0]}
        is ${test.output ? '' : 'not '}equal to ${test.input[1]}`, function() {
        const formula = new Formula(test.input[0]);
        const otherFormula = new Formula(test.input[1]);
        assert.equal(formula.isEqual(otherFormula), test.output);
        assert.equal(formula.isEqual(test.input[1]), test.output);
        assert.equal(formula.isEqual(formula, otherFormula), test.output);
        assert.equal(formula.isEqual(formula, test.input[1]), test.output);
        assert.equal(
          formula.isEqual(test.input[0], test.input[1]),
          test.output
        );
        assert.equal(otherFormula.isEqual(formula), test.output);
        assert.equal(otherFormula.isEqual(test.input[0]), test.output);
      });
    }
  });

  describe('isNegation()', () => {
    const testCases = [
      /** POSITIVE CASES */
      { input: ['p', '~p'], output: true },
      { input: ['~p', 'p'], output: true },
      { input: ['~(p & q)', 'p & q'], output: true },
      { input: ['(p & q)', '~(p & q)'], output: true },
      { input: ['p -> (q & r)', '~(p -> (q & r))'], output: true },
      {
        input: ['(p V q) <-> (p & ~q)', '~((pVq)  <-> (p & ~q))'],
        output: true
      },
      /** NEGATIVE CASES */
      { input: ['p', '~q'], output: false },
      { input: ['p', 'p'], output: false },
      { input: ['~(p & q)', '~p & q'], output: false },
      { input: ['(p & q)', '~(~(p & q))'], output: false },
      { input: ['p -> (q & r)', 'p -> ~(q & r)'], output: false },
      {
        input: ['(p V q) <-> (p & ~q)', '~((p&q)  <-> (p & ~q))'],
        output: false
      }
    ];
    for (const test of testCases) {
      it(`should recognize that the formula ${test.input[0]} is ${
        test.output ? '' : 'not '
      }the negation of ${test.input[1]}`, function() {
        const formula = new Formula(test.input[0]);
        const otherFormula = new Formula(test.input[1]);
        assert.equal(formula.isNegation(otherFormula), test.output);
        assert.equal(formula.isNegation(test.input[1]), test.output);
        assert.equal(formula.isNegation(formula, otherFormula), test.output);
        assert.equal(formula.isNegation(formula, test.input[1]), test.output);
        assert.equal(
          formula.isNegation(test.input[0], test.input[1]),
          test.output
        );
        assert.equal(otherFormula.isNegation(formula), test.output);
        assert.equal(otherFormula.isNegation(test.input[0]), test.output);
      });
    }
  });

  describe('translateEnglishToSymbolic()', function() {
    const testCases = [
      { input: 'p and q', output: 'p & q' },
      { input: 'p or q', output: 'p V q' },
      { input: 'if p then q', output: 'p -> q' },
      { input: 'p if q', output: 'p <- q' },
      { input: 'p implies q', output: 'p -> q' },
      { input: 'p only if q', output: 'p -> q' },
      { input: 'p if and only if q', output: 'p <-> q' },
      {
        input: 'if (p if and only if q) then (p implies q)',
        output: '(p <-> q) -> (p -> q)'
      },
      {
        input: 'if (p if (q and not r)) then not s',
        output: '(p <- (q & ~r)) -> ~s'
      },
      { input: '(not p) or q', output: '(~p) V q' },
      { input: 'not (if p then q)', output: '~(p -> q)' },
      { input: '(p if q) and r', output: '(p <- q) & r' },
      { input: 'if (p or q) then ( q or p)', output: '(p V q) -> ( q V p)' },
      {
        input: 'if (p implies q) then (if not q then not p)',
        output: '(p -> q) -> (~q -> ~p)'
      },
      { input: '(p V q) -> ( q V p)', output: '(p V q) -> ( q V p)' },
      { input: '(p and not q) implies r', output: '(p & ~q) -> r' }
    ];
    for (const test of testCases) {
      it(`should translate '${test.input}' to '${test.output}'`, function() {
        assert.equal(translateEnglishToSymbolic(test.input), test.output);
      });
    }
  });

  describe('Truth Tables', function() {
    let mockTruthTables: MockTruthTableInterface[];
    try {
      mockTruthTables = safeLoad(
        readFileSync(resolve(__dirname, './mocks/truth-tables.yaml'), 'utf8')
      );
    } catch (e) {
      console.log(e);
    }
    mockTruthTables.forEach(truthTable => {
      const formula = new Formula(truthTable.formula);
      it(`should generate the correct truth table headers for the proposition ${truthTable.formula}`, () => {
        const generatedTableHeaders = formula.generateTruthTableHeaders(
          truthTable.formula
        );
        assert.isTrue(arrayEquals(truthTable.headers, generatedTableHeaders));
      });

      it(`should generate the correct truth table for the proposition ${truthTable.formula}`, () => {
        const generatedTruthTable = formula.generateTruthTable(
          truthTable.formula
        );
        assert.isTrue(arrayEquals(truthTable.table, generatedTruthTable));
      });
    });
  });
});
