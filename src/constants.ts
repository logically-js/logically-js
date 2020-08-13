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
  EXISTENTIAL_GENERALIZATION: 'Existential Generalization',
  DOUBLE_NEGATION: 'Double Negation',
  HYPOTHETICAL_SYLLOGISM: 'Hypothetical Syllogism',
  INDIRECT_PROOF: 'Indirect Proof',
  MATERIAL_EQUIVALENCE: 'Material Equivalence',
  MATERIAL_IMPLICATION: 'Material Implication',
  MODUS_PONENS: 'Modus Ponens',
  MODUS_TOLLENS: 'Modus Tollens',
  QUANTIFIER_NEGATION: 'Quantifier Negation',
  PREMISE: 'Premise',
  SIMPLIFICATION: 'Simplification',
  TAUTOLOGY: 'Tautology',
  TRANSPOSITION: 'Transposition',
  UNIVERSAL_INSTANTION: 'Universal Instantiation'
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
  [DEDUCTION_RULES.EXISTENTIAL_GENERALIZATION]: 1,
  [DEDUCTION_RULES.HYPOTHETICAL_SYLLOGISM]: 2,
  [DEDUCTION_RULES.INDIRECT_PROOF]: 2,
  [DEDUCTION_RULES.MATERIAL_EQUIVALENCE]: 1,
  [DEDUCTION_RULES.MATERIAL_IMPLICATION]: 1,
  [DEDUCTION_RULES.MODUS_PONENS]: 2,
  [DEDUCTION_RULES.MODUS_TOLLENS]: 2,
  [DEDUCTION_RULES.QUANTIFIER_NEGATION]: 1,
  [DEDUCTION_RULES.PREMISE]: 0,
  [DEDUCTION_RULES.SIMPLIFICATION]: 1,
  [DEDUCTION_RULES.TAUTOLOGY]: 1,
  [DEDUCTION_RULES.TRANSPOSITION]: 1,
  [DEDUCTION_RULES.UNIVERSAL_INSTANTION]: 1
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
  // TODO differentiate between propositional variables and names.
  atomicVariable: /^([a-z])$/,
  atomicPLStatement: /^[B-DF-Z]\((\s*[a-z]\s*,\s*|\s*[a-z]\s*)+\)$/, // NOTE: No spaces allowed..
  // TODO: Change for-all to 'A'.
  // atomicPLStatement: /^[A-DF-UW-Z]\(\s*([a-z]\s*,?)+\s*\)$/, // NOTE: No spaces allowed..
  // Operators are ~, V, &, ->, and <->.
  binaryOperator: /^(V|&|->|<->)/,
  operator: /^(~|V|&|->|<->)/,
  unaryOperator: /^(~)/
};

/**
 * Interface for a truth-functional operator.
 */
interface TruthFunctionInterface {
  (...args: boolean[]): boolean;
}

interface TruthFunctionDictInterface {
  [operator: string]: TruthFunctionInterface;
}

/**
 * Dictionary which maps symbols for operators to their truth functions.
 */
export const TRUTH_FUNCTIONS = <TruthFunctionDictInterface>{
  '~': (p: boolean): boolean => p === false,
  '&': (p: boolean, q: boolean): boolean => p === true && q === true,
  V: (p: boolean, q: boolean): boolean => p === true || q === true,
  '->': (p: boolean, q: boolean): boolean => p === false || q === true,
  '<->': (p: boolean, q: boolean): boolean => p === q && typeof p === 'boolean'
};
