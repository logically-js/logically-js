import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { assert } from 'chai';
import { inspect } from 'util';

import { Formula } from './Formula';
import { LineOfProof, Proof } from './Proof';

describe('Proof', function() {
  let mockProofs: any;
  try {
    mockProofs = safeLoad(
      readFileSync(resolve(__dirname, './mocks/proofs.yaml'), 'utf8')
    );
  } catch (e) {
    // istanbul ignore next
    console.log(e);
  }

  let mockInvalidProofs: any;
  try {
    mockInvalidProofs = safeLoad(
      readFileSync(resolve(__dirname, './mocks/proofs.invalid.yaml'), 'utf8')
    );
  } catch (e) {
    // istanbul ignore next
    console.log(e);
  }

  describe('Should load properly', () => {
    it('', () => {
      const proof = new Proof();
      assert.exists(proof);
    });
  });

  describe('Proof should evaluate proofs correctly.', () => {
    // debugger;
    for (const mockProof of mockProofs) {
      const proof = new Proof();
      for (const line of mockProof) {
        proof.addLineToProof(
          new LineOfProof({
            proposition: new Formula(line[0]),
            rule: line[1],
            citedLines: line[2]
          })
        );
      }
      const conclusion = mockProof[mockProof.length - 1][0];
      proof.setConclusion(conclusion);
      it(`Should validate the proof:
        ${inspect(mockProof)}
        `, () => {
        // debugger;
        const { score } = proof.evaluateProof();
        assert.isTrue(Boolean(score));
      });
    }

    for (const invalidProof of mockInvalidProofs) {
      const proof = new Proof();
      for (let i = 0; i < invalidProof.length; i++) {
        const line = invalidProof[i];
        try {
          proof.addLineToProof({
            proposition: line[0] as string,
            rule: line[1] as string,
            citedLines: line[2] as number[]
          });
        } catch (err) {
          it(`Should reject the proof:
            ${inspect(invalidProof)}
            `, () => {
            assert.throws(() => {
              proof.addLineToProof({
                proposition: line[0] as string,
                rule: line[1] as string,
                citedLines: line[2] as number[]
              });
            });
          });
          continue;
        }
      }
      const conclusion = invalidProof[invalidProof.length - 1][0];
      try {
        proof.setConclusion(conclusion);
      } catch (err) {
        it(`Should reject the proof:
          ${inspect(invalidProof)}
          `, () => {
          assert.throws(() => {
            proof.setConclusion(conclusion);
          });
        });
        continue;
      }
      it(`Should reject the proof:
        ${inspect(invalidProof)}
        `, () => {
        try {
          const { score } = proof.evaluateProof();
          assert.isFalse(Boolean(score));
        } catch (err) {
          assert.throws(() => {
            proof.evaluateProof();
          });
        }
      });
    }
  });

  describe('setConclusion()', () => {
    it('works as expected', () => {
      const proof = new Proof();
      proof.setConclusion('p');
      assert.isTrue(proof.conclusion.cleansedFormulaString === 'p');

      const proof2 = new Proof();
      proof2.setConclusion(new Formula('p'));
      assert.isTrue(proof2.conclusion.cleansedFormulaString === 'p');

      const proof3 = new Proof();
      proof3.setConclusion('p');
    });
  });
});

describe('LineOfProof', () => {
  describe('should load properly', () => {
    const line = new LineOfProof({
      assumptions: [],
      proposition: new Formula('p'),
      rule: 'Simplification',
      citedLines: undefined
    });
    assert.exists(line);
  });
});
