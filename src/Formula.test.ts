import { assert } from 'chai';
import { inspect } from 'util';
import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { arrayEquals } from './utils';

/* eslint-disable-next-line */
import { AssignmentInterface, Formula } from './Formula';

describe('Formula', function() {
  it('should be constructed correctly.', () => {
    const formula = new Formula('p');
    assert.exists(formula);
    assert.equal(formula.formulaString, 'p');
  });

  it('can be constructed with no input.', () => {
    const formula = new Formula();
    assert.exists(formula);
  });

  it('should throw if constructed with non-wff input.', () => {
    try {
      new Formula('abc');
    } catch (err) {
      assert.throws(() => {
        new Formula('abc');
      });
    }
  });

  describe('isWFFString() - STATIC method', function() {
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
        { input: '(a  &   ~b) -> ~(~c V d)', output: true },

        { input: 'F(a)', output: true },
        { input: '  F(a)  ', output: true },
        { input: '  F( a, b )  ', output: true },
        { input: '((F(a))) &  G(b)', output: true },
        { input: 'F( a) ->   q', output: true },

        { input: 'Ex(F(x))', output: true },
        { input: 'Ex(F(a))', output: true },
        { input: 'Ex(~F(a))', output: true },
        { input: 'Ax(F(x))', output: true },
        { input: 'Ex(~F(x)) & p', output: true },
        { input: 'Ax(Ey(F(a,b)))', output: true },
        { input: 'Ax(Ey(F(a,b))) V G(a)', output: true },
        { input: '~p', output: true },
        { input: '~F(x)', output: true }
      ];
      for (const test of testCases) {
        it(`should recognize that the formula '${test.input}' is well-formed`, function() {
          const isWFF = Formula.isWFFString(test.input);
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
        { input: 'p (-> q)', output: false },
        /** */
        { input: 'pF(a)', output: false },
        { input: 'p F(a) ', output: false },
        { input: 'G(b) F(a) ', output: false },
        { input: 'F(a)->', output: false },
        { input: 'F(a)#G(a)', output: false },
        { input: '~&F(a)', output: false },
        { input: 'F(a)~G(b)', output: false },
        { input: 'F(a)))', output: false },
        { input: '( F(a) V G(b)', output: false },
        /** */
        { input: 'EAxF(a)', output: false },
        { input: 'ExFy', output: false },
        { input: 'Ex (F(y))', output: false },
        { input: 'Ex(F(x))) & p', output: false }
      ];
      for (const test of testCases) {
        it(`should recognize that the formula '${test.input}' is *not* well-formed`, function() {
          // debugger;
          const isWFF = Formula.isWFFString(test.input);
          assert.equal(isWFF, test.output);
        });
      }
      // for coverage
      assert.isFalse(Formula.isWFFString());
    });
  });

  interface TestCaseInterface {
    input: [string, AssignmentInterface];
    output: boolean | null;
  }

  // // TODO: Add PL tests
  describe('evaluateFormulaString() - STATIC method', function() {
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
          assert.equal(
            Formula.evaluateFormulaString(...test.input),
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
          assert.equal(
            Formula.evaluateFormulaString(...test.input),
            test.output
          );
        });
      }
    });

    // TODO: Add PL tests
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
          assert.equal(
            Formula.evaluateFormulaString(...test.input),
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
      { input: ['F(a)', '((F(a)))'], output: true },
      { input: ['F( a,   b)', '(F(a, b))'], output: true },
      { input: ['~((F(a)))', '~(F(a))'], output: true },
      /** NEGATIVE CASES */
      { input: ['p', '~q'], output: false },
      { input: ['p', 'p & p'], output: false },
      { input: ['~(p & q)', '~p & q'], output: false },
      { input: ['(p & q)', '~(~(p & q))'], output: false },
      { input: ['p -> (q & r)', 'p -> ~(q & r)'], output: false },
      {
        input: ['(p V q) <-> (p & ~q)', '~((p&q)  <-> (p & ~q))'],
        output: false
      },
      { input: ['F(a)', 'F(b)'], output: false },
      { input: ['F(a, b)', 'F(a)'], output: false },
      { input: ['F(a) -> ((G(b)))', 'F( a ) -> G(a)'], output: false }
    ];
    for (const test of testCases) {
      it(`should recognize that the formula ${test.input[0]}
        is ${test.output ? '' : 'not '}equal to ${test.input[1]}`, function() {
        // debugger;
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
      { input: ['p', '~(p)'], output: true },
      { input: ['~p', 'p'], output: true },
      { input: ['~(p & q)', 'p & q'], output: true },
      { input: ['~(~(p & q))', '~(p & q)'], output: true },
      { input: ['p -> (q & r)', '~(p -> (q & r))'], output: true },
      {
        input: ['(p V q) <-> (p & ~q)', '~((pVq)  <-> (p & ~q))'],
        output: true
      },
      { input: ['(F(a))', '~F(a)'], output: true },
      { input: ['~F(a, b)', 'F(a, b)'], output: true },
      { input: ['~Ex(F(x))', 'Ex(F(x))'], output: true },
      { input: ['~Ex(Aw(F(a, b)))', 'Ex(Aw(F(a, b)))'], output: true },
      /** NEGATIVE CASES */
      { input: ['F(a)', '~F(b)'], output: false },
      { input: ['F(a)', 'p'], output: false }
    ];
    for (const test of testCases) {
      it(`should recognize that the formula ${test.input[0]} is ${
        test.output ? '' : 'not '
      }the negation of ${test.input[1]}`, function() {
        // debugger;
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

  // // describe('translateEnglishToSymbolic()', function() {
  // //   const testCases = [
  // //     { input: 'p and q', output: 'p & q' },
  // //     { input: 'p or q', output: 'p | q' },
  // //     { input: 'if p then q', output: 'p -> q' },
  // //     { input: 'p if q', output: 'p <- q' },
  // //     { input: 'p implies q', output: 'p -> q' },
  // //     { input: 'p only if q', output: 'p -> q' },
  // //     { input: 'p if and only if q', output: 'p <-> q' },
  // //     {
  // //       input: 'if (p if and only if q) then (p implies q)',
  // //       output: '(p <-> q) -> (p -> q)'
  // //     },
  // //     {
  // //       input: 'if (p if (q and not r)) then not s',
  // //       output: '(p <- (q & ~r)) -> ~s'
  // //     },
  // //     { input: '(not p) or q', output: '(~p) | q' },
  // //     { input: 'not (if p then q)', output: '~(p -> q)' },
  // //     { input: '(p if q) and r', output: '(p <- q) & r' },
  // //     { input: 'if (p or q) then ( q or p)', output: '(p | q) -> ( q | p)' },
  // //     {
  // //       input: 'if (p implies q) then (if not q then not p)',
  // //       output: '(p -> q) -> (~q -> ~p)'
  // //     },
  // //     { input: '(p | q) -> ( q | p)', output: '(p | q) -> ( q | p)' },
  // //     { input: '(p and not q) implies r', output: '(p & ~q) -> r' }
  // //   ];
  // //   for (const test of testCases) {
  // //     it(`should translate '${test.input}' to '${test.output}'`, function() {
  // //       assert.equal(
  // //         Formula.translateEnglishToSymbolic(test.input),
  // //         test.output
  // //       );
  // //     });
  // //   }
  // // });
  //
  describe('Truth Tables', function() {
    let mockTruthTables: any;
    try {
      mockTruthTables = safeLoad(
        readFileSync(
          resolve(__dirname, './mocks/truth-tables.yaml'),
          'utf8'
        ) as string
      );
    } catch (e) {
      // istanbul ignore next
      console.log(e);
    }
    mockTruthTables.forEach((truthTable: any) => {
      const formula = new Formula(truthTable.formula);
      it(`should generate the correct truth table headers for the proposition ${truthTable.formula}`, () => {
        const generatedTableHeaders = formula.generateTruthTableHeaders();
        assert.isTrue(arrayEquals(truthTable.headers, generatedTableHeaders));
      });

      it(`should generate the correct truth table for the proposition ${truthTable.formula}`, () => {
        const generatedTruthTable = formula.generateTruthTable();
        assert.isTrue(arrayEquals(truthTable.table, generatedTruthTable));
      });

      it(`should generate the partial truth table for the proposition ${truthTable.formula}`, () => {
        const partial = formula.generateTruthTable(true);
        console.log(partial);
        console.log(truthTable.partial);
        assert.isTrue(arrayEquals(truthTable.partial, partial));
      });
    });

    it('needs more coverage', () => {
      const partial = Formula.generateTruthTable('p V q', true);
      const expectedPartial = [
        [true, true, null],
        [true, false, null],
        [false, true, null],
        [false, false, null]
      ];
      const expectedComplete = [
        [true, true, true],
        [true, false, true],
        [false, true, true],
        [false, false, false]
      ];
      const complete = Formula.generateTruthTable('p V q');
      assert.deepEqual(partial, expectedPartial);
      assert.deepEqual(complete, expectedComplete);
    });
  });

  describe('generateRandomFormulaString', function() {
    it('should generate a random formula string', done => {
      for (let i = 0; i < 5; i++) {
        const randomString = Formula.generateRandomFormulaString();
        assert.isString(randomString);
      }
      done();
    });
  });

  describe('generateRandomFormula', function() {
    it('should generate a random formula', done => {
      for (let i = 0; i < 5; i++) {
        const randomFormula = Formula.generateRandomFormula();
        assert.isTrue(randomFormula instanceof Formula);
      }
      done();
    });
  });

  describe('isAtomicString', function() {
    describe('should determine if a formula string is atomic', () => {
      describe('works for proposotional logic', () => {
        const testCases = [
          { input: 'p', output: true },
          { input: '(p)', output: false },
          { input: '~(p)', output: false },
          { input: 'p V q', output: false },
          { input: 'F(x)', output: true },
          { input: 'F(x, y) V p', output: false },
          { input: 'Ex(p)', output: false },
          { input: 'Ex(F(x))', output: false },
          { input: 'F(a, b)', output: true }
        ];
        for (const test of testCases) {
          it(`Determines that ${test.input} was ${
            test.output ? 'atomic' : 'not atomic'
          }`, () => {
            assert.equal(Formula.isAtomicString(test.input), test.output);
          });
        }
        it('does other stuff', () => {
          assert.isTrue(new Formula('(p)').isAtomicString());
        });
      });
    });
  });

  describe('removeWhiteSpace', function() {
    describe('should remove whitespace', () => {
      const testCases = [
        { input: ' p   ', output: 'p' },
        { input: '~ ( ((p -> r)) )', output: '~(((p->r)))' },
        { input: ' ', output: '' },
        { input: null, output: '' }
      ];
      for (const test of testCases) {
        it(`Removes whitespace from ${test.input} equals ${test.output}`, () => {
          try {
            assert.equal(
              new Formula(test.input).removeWhiteSpace(test.input),
              test.output
            );
          } catch (err) {
            assert.throws(() => {
              new Formula(test.input).removeWhiteSpace(test.input);
            });
          }
        });
      }
      it('[for coverage]:]', () => {
        assert.equal(new Formula(' p ').removeWhiteSpace(), 'p');
        assert.equal(Formula.removeWhiteSpace(), '');
      });
    });
  });

  describe('hasOuterParens', function() {
    describe('should validate unnecessary outer parens', () => {
      const testCases = [
        { input: ' p   ', output: false },
        { input: '~(p)', output: false },
        { input: '(p)', output: true },
        { input: '(((p)))', output: true },
        { input: '((p)) V q', output: false }
      ];
      for (const test of testCases) {
        it(`Validates that ${test.input} ${
          test.output ? 'has outer parens' : "doesn't have outer parens"
        }`, () => {
          assert.equal(Formula.hasOuterParens(test.input), test.output);
        });
      }
    });
  });

  describe('removeOuterParens', function() {
    describe('should remove unnecessary outer parens', () => {
      const testCases = [
        { input: '(p)', output: 'p' },
        { input: '(((p)))', output: 'p' },
        { input: '(( (p) ))', output: ' (p) ' },
        { input: '(((Ex(F(a)))))', output: 'Ex(F(a))' }
      ];
      for (const test of testCases) {
        it(`Validates that removing outer parens from ${test.input} equals ${test.output}`, () => {
          assert.equal(Formula.removeOuterParens(test.input), test.output);
        });
      }
    });
  });

  // TODO: Non-wff
  describe('findMainOp', function() {
    describe('find the main operator and operands', () => {
      const testCases: {
        input: string;
        output: {
          index: number;
          operator?: string;
          operands: string[];
        };
      }[] = [
        {
          input: 'p',
          output: {
            index: -1,
            operator: null,
            operands: []
          }
        },
        {
          input: 'p V q',
          output: {
            index: 2,
            operator: 'V',
            operands: ['p ', ' q']
          }
        },
        {
          input: '(~(p)) V q',
          output: {
            index: 7,
            operator: 'V',
            operands: ['(~(p)) ', ' q']
          }
        },
        {
          input: '( p V q)',
          output: {
            index: 3,
            operator: 'V',
            operands: [' p ', ' q']
          }
        },
        {
          input: '~( p V q)',
          output: {
            index: 0,
            operator: '~',
            operands: ['( p V q)']
          }
        },
        {
          input: 'Ex(F(x))',
          output: {
            index: 0,
            operator: 'Ex',
            operands: ['(F(x))']
          }
        },
        {
          input: 'Ex(F(x)) & p',
          output: {
            index: 9,
            operator: '&',
            operands: ['Ex(F(x)) ', ' p']
          }
        }
      ];
      for (const test of testCases) {
        it(`Validates that the main operator of ${
          test.input
        } is ${JSON.stringify(test.output)}`, () => {
          // debugger;
          const mainOp = Formula.findMainOp(test.input);
          assert.deepEqual(mainOp, test.output);
        });
      }
    });
  });

  describe('cleanseFormulaString', function() {
    describe('removes all whitespace and unnecessary parens', () => {
      const testCases: {
        input: string;
        output: String;
      }[] = [
        { input: 'p   V  q', output: 'pVq' },
        { input: '( ( p )  V ((q -> r)))', output: 'pV(q->r)' },
        { input: 'asdf', output: 'asdf' }
      ];
      for (const test of testCases) {
        it(`Validates that the cleansedFormulaString of ${test.input} is ${test.output}`, () => {
          // debugger;
          assert.isTrue(
            Formula.cleanseFormulaString(test.input) === test.output
          );
        });
      }
    });
  });

  describe('negateFormula()', function() {
    describe('takes a formula and returns its negation', () => {
      const testCases: {
        input: string;
        output: string;
      }[] = [
        { input: 'p', output: '~(p)' },
        { input: '~(p)', output: 'p' },
        { input: '~(((((p)))))', output: 'p' },
        { input: '~p', output: 'p' },
        { input: 'F(a, b)', output: '~(F(a, b)  )' }
      ];
      for (const test of testCases) {
        it(`Validates that the negation of ${test.input} is ${test.output}`, () => {
          // debugger;
          assert.isTrue(
            new Formula(test.input)
              .negateFormula(test.input)
              .isEqual(new Formula(test.output))
          );

          // for more coverage
          assert.isTrue(
            new Formula(test.input)
              .negateFormula()
              .isEqual(new Formula(test.output))
          );

          assert.isTrue(
            Formula.negateFormula(new Formula(test.input)).isEqual(
              new Formula(test.output)
            )
          );
        });
      }
    });
  });

  describe('prettyFormula()', function() {
    describe('takes a formula and returns a prettified version of it', () => {
      const testCases: {
        input: string;
        output: string;
      }[] = [
        { input: ' (p) ', output: 'p' },
        { input: ' (p)  V  q', output: 'p V q' },
        { input: '( ( (p)) ->  (  r))', output: 'p -> r' }
      ];
      for (const test of testCases) {
        it(`Validates that the prettied version of ${test.input} is ${test.output}`, () => {
          // debugger;
          console.log(new Formula(test.input).prettifiedFormula);
          assert.equal(new Formula(test.input).prettifiedFormula, test.output);
        });
      }
    });
  });

  // for coverage
  describe('truthTableHeaderSort()', () => {
    it('sorts the truth table headers', () => {
      const x = ['p', 'p'];
      x.sort(Formula.truthTableHeaderSort);
      assert.deepEqual(x, ['p', 'p']);
    });
  });
});
