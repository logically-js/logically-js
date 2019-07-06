interface DeductionRulesInterface {
  [rule: string]: string;
}

export const DEDUCTION_RULES = <DeductionRulesInterface>{
  ADDITION: 'Addition',
  ASSOCIATIVITY: 'Associativity',
  ASSUMPTION: 'Assumption',
  COMMUTATIVITY: 'Commutativity',
  CONDITIONAL_PROOF: 'Conditional Proof',
  CONJUNCTION: 'Conjunction',
  CONSTRUCTIVE_DILEMMA: 'Constructive Dilemma',
  DEMORGANS: `DeMorgan's Rule`,
  DISJUNCTIVE_SYLLOGISM: 'Disjunctive Syllogism',
  DISTRIBUTION: 'Distribution',
  EXPORTATION: 'Exportation',
  DOUBLE_NEGATION: 'Double Negation',
  HYPOTHETICAL_SYLLOGISM: 'Hypothetical Syllogism',
  INDIRECT_PROOF: 'Indirect Proof',
  MATERIAL_EQUIVALENCE: 'Material Equivalence',
  MATERIAL_IMPLICATION: 'Material Implication',
  MODUS_PONENS: 'Modus Ponens',
  MODUS_TOLLENS: 'Modus Tollens',
  PREMISE: 'Premise',
  SIMPLIFICATION: 'Simplification',
  TAUTOLOGY: 'Tautology',
  TRANSPOSITION: 'Transposition'
};

interface CitedLinesCount {
  [rule: string]: number;
}

export const CITED_LINES_COUNT = <CitedLinesCount>{
  [DEDUCTION_RULES.ADDITION]: 1,
  [DEDUCTION_RULES.ASSOCIATIVITY]: 1,
  [DEDUCTION_RULES.ASSUMPTION]: 0,
  [DEDUCTION_RULES.COMMUTATIVITY]: 1,
  [DEDUCTION_RULES.CONDITIONAL_PROOF]: 2,
  [DEDUCTION_RULES.CONJUNCTION]: 2,
  [DEDUCTION_RULES.CONSTRUCTIVE_DILEMMA]: 2,
  [DEDUCTION_RULES.DEMORGANS]: 1,
  [DEDUCTION_RULES.DISJUNCTIVE_SYLLOGISM]: 2,
  [DEDUCTION_RULES.DISTRIBUTION]: 1,
  [DEDUCTION_RULES.DOUBLE_NEGATION]: 1,
  [DEDUCTION_RULES.EXPORTATION]: 1,
  [DEDUCTION_RULES.HYPOTHETICAL_SYLLOGISM]: 2,
  [DEDUCTION_RULES.INDIRECT_PROOF]: 2,
  [DEDUCTION_RULES.MATERIAL_EQUIVALENCE]: 1,
  [DEDUCTION_RULES.MATERIAL_IMPLICATION]: 1,
  [DEDUCTION_RULES.MODUS_PONENS]: 2,
  [DEDUCTION_RULES.MODUS_TOLLENS]: 2,
  [DEDUCTION_RULES.PREMISE]: 0,
  [DEDUCTION_RULES.SIMPLIFICATION]: 1,
  [DEDUCTION_RULES.TAUTOLOGY]: 1,
  [DEDUCTION_RULES.TRANSPOSITION]: 1
};

interface REInterface {
  [operatorName: string]: RegExp;
}

export type Operator = '~' | '&' | 'V' | '->' | '<->';

/**
 * Enum of regular expressions for testing various logical patterns.
 */
export const RE = <REInterface>{
  // Any lowercase alphabetic letter is an atomic variable.
  atomicVariable: /^([a-z])$/,
  // Operators are ~, V, &, ->, and <->.
  binaryOperator: /^(V|&|->|<->)/,
  operator: /^(~|V|&|->|<->)/,
  unaryOperator: /^(~)/
};

interface TruthFunctionInterface {
  (...args: boolean[]): boolean;
}

interface TruthFunctionDictInterface {
  [operator: string]: TruthFunctionInterface;
}

export const TRUTH_FUNCTIONS = <TruthFunctionDictInterface>{
  '~': (p: boolean): boolean => p === false,
  '&': (p: boolean, q: boolean): boolean => p === true && q === true,
  V: (p: boolean, q: boolean): boolean => p === true || q === true,
  '->': (p: boolean, q: boolean): boolean => p === false || q === true,
  '<->': (p: boolean, q: boolean): boolean => p === q && typeof p === 'boolean'
};
