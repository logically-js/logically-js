interface DeductionRulesInterface {
  [rule: string]: string
}

export const DEDUCTION_RULES = <DeductionRulesInterface>{
  ADDITION: 'Addition',
  CONJUNCTION: 'Conjunction',
  MODUS_PONENS: 'Modus Ponens',
  MODUS_TOLLENS: 'Modus Tollens',
  PREMISE: 'Premise',
  SIMPLIFICATION: 'Simplification'
};

interface CitedLinesCount {
  [rule: string]: number
}

export const CITED_LINES_COUNT = <CitedLinesCount>{
  [DEDUCTION_RULES.ADDITION]: 1,
  [DEDUCTION_RULES.CONJUNCTION]: 2,
  [DEDUCTION_RULES.MODUS_PONENS]: 2,
  [DEDUCTION_RULES.MODUS_TOLLENS]: 2,
  [DEDUCTION_RULES.PREMISE]: 0,
  [DEDUCTION_RULES.SIMPLIFICATION]: 1
};
