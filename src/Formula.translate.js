/**
 * NOTE: This belongs with `Formula`. Putting it in a separate file
 * because eslint cannot properly parse the regex with lookbehind.
 */

/**
 * Translate a (rough) English formula to symbolic notation.
 * This trivially works for a symbolic formula as well.
 * @param  {string} formulaString - The formula to be translated.
 * @return {string}               - The proposition in symbolic notation.
 */
function translateEnglishToSymbolic(formulaString) {
  return (
    formulaString
      .replace(/\s*\bif and only if\b\s*/g, ' <-> ') // Replace 'if and only if'
      .replace(/\s*\bonly if\b\s*/g, ' -> ') // Replace 'only if'
      // NOTE: Next line should be valid (works in node console)
      // but won't compile.
      // Replace 'if' with '<-' if it's preceded by a word/letter but *not*
      // preceded by another connective.
      // The assumption is that 'p if q' occurs whenever 'if' follows
      // a propositional variable.
      .replace(/(?<=\w+.*)(?<!(and|or|then|only|if|not)(\s|\()*)\bif\b/g, '<-')
      .replace(/\s*\bor\b\s*/g, ' V ') // Replace 'or'.
      .replace(/\s*\band\b\s*/g, ' & ') // Replace 'and'.
      // Replace 'then' with '->' since 'then' only occurs in 'if...then'.
      .replace(/\s*\bthen\b\s*/g, ' -> ')
      // Replace 'not' with '~' if it follows an open parenthesis.
      .replace(/(?<=(\(|^))\s*\bnot\b\s*/g, '~')
      // Replace 'not' with ' ~' (extra space) otherwise.
      .replace(/\s*\bnot\b\s*/g, ' ~')
      .replace(/\s*\bimplies\b\s*/g, ' -> ') // Replace 'implies'.
      .replace(/\s*\bif\b\s*/g, '')
  ); // Delete any remaining 'if's.
}

export default translateEnglishToSymbolic;
