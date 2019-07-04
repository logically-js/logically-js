import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { assert } from 'chai';
import { inspect } from 'util';

import { Formula } from './Formula';
import { LineOfProof, Proof } from './Proof';

describe('Proof', function() {
  let mockProofs: [][];
  try {
    mockProofs = safeLoad(
      readFileSync(resolve(__dirname, './mocks/proofs.yaml'), 'utf8')
    );
  } catch (e) {
    console.log(e);
  }

  it('Should load properly', () => {
    const proof = new Proof();
    assert.exists(proof);
  });
  describe('Proof should evaluate proofs correctly.', () => {
    for (const mockProof of mockProofs) {
      const proof = new Proof();
      for (const line of mockProof) {
        console.log('LINE!', line[0]);
        proof.addLineToProof(
          new LineOfProof({
            proposition: new Formula(line[0]),
            rule: line[1],
            citedLines: line[2]
          })
        );
      }
      const conclusion = mockProof[mockProof.length - 1][0];
      console.log('CONCLUSION', conclusion);
      proof.setConclusion(conclusion);
      it(`Should validate the proof:
        ${inspect(mockProof)}
        `, () => {
        const { score } = proof.evaluateProof();
        console.log('SCORE', score);
        assert.isTrue(Boolean(score));
      });
    }
  });
});
