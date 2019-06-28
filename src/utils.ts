/**
 * Returns true iff the two input arrays have strictly equal elements
 * in the same order.
 * @param  {array} arr1 - First input array
 * @param  {array} arr2 - Second input array
 * @return {boolean}    - Do the arrays have identical elements in order?
 */
export const arrayEquals = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};
