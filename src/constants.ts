interface DeductionRulesInterface {
  [rule: string]: string
}

export const DEDUCTION_RULES = <DeductionRulesInterface>{
  ADDITION: 'Addition',
  ASSOCIATIVITY: 'Associativity',
  COMMUTATIVITY: 'Commutativity',
  CONJUNCTION: 'Conjunction',
  DOUBLE_NEGATION: 'Double Negation',
  MODUS_PONENS: 'Modus Ponens',
  MODUS_TOLLENS: 'Modus Tollens',
  PREMISE: 'Premise',
  SIMPLIFICATION: 'Simplification',
  TAUTOLOGY: 'Tautology'
};

interface CitedLinesCount {
  [rule: string]: number
}

export const CITED_LINES_COUNT = <CitedLinesCount>{
  [DEDUCTION_RULES.ADDITION]: 1,
  [DEDUCTION_RULES.ASSOCIATIVITY]: 1,
  [DEDUCTION_RULES.COMMUTATIVITY]: 1,
  [DEDUCTION_RULES.CONJUNCTION]: 2,
  [DEDUCTION_RULES.DOUBLE_NEGATION]: 1,
  [DEDUCTION_RULES.MODUS_PONENS]: 2,
  [DEDUCTION_RULES.MODUS_TOLLENS]: 2,
  [DEDUCTION_RULES.PREMISE]: 0,
  [DEDUCTION_RULES.SIMPLIFICATION]: 1,
  [DEDUCTION_RULES.TAUTOLOGY]: 1
};
