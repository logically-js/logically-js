### logically

`logically` is a library for representing and evaluating symbolic logic
formulas and proofs.

Complete documentation for the API can be found at <a href="logically-js.github.io/docs">logically-js.github.io/docs</a>.

Currently, the library mainly consists of a few classes: Formula, Line of
Proof, and Proof. The Formula class allows you to analyze and perform
operations on propositional logical formulas as inputs. E.g.:

```
const p = new Formula('p');
const notP = new Formula('~p');
assert(p.isNegation(notP));
```

Proofs are made of Lines of Proof. A Line of Proof consists of a Formula,
followed by the name of a natural deduction rule justifying that line, followed
by a list of citations to any other lines were "cited" or that played a role in
the justification of the current line.

A Proof, then, is a series of Lines of Proof.
