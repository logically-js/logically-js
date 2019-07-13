/**
 * Returns true iff the two input arrays have strictly equal elements
 * in the same order. (If two corresponding elements are both arrays,
 * we will recurse on the arrays, so this function works for nested arrays.)
 *
 * @param arr1 - First input array
 * @param arr2 - Second input array
 * @return - Do the arrays have identical elements in order?
 */
export const arrayEquals = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) {
    // Different lengths - definitely not equal.
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    /**
     * Walk through both arrays in order and compare the elements for strict
     * equality.
     */
    if (Array.isArray(arr1[i]) && Array.isArray(arr2[i])) {
      /**
       * If both elements are arrays, we recursively check whether
       * [[arrayEquals]] is true for the subarrays.
       */
      if (!arrayEquals(arr1[i], arr2[i])) return false;
    } else if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};

/**
 * A function that takes two elements and two functions, and checks if each
 * function can return true for distinct elements.
 *
 * @param  el1 - The first element
 * @param  el2 - The second element
 * @param  el1 - The first function
 * @param  el1 - The second function
 * @return  - Return true iff there are two pairs of functions and elements
 * such that both pairs return true.
 */
export const someAndOther = (
  el1: any,
  el2: any,
  cb1: (arg: any) => boolean,
  cb2: (arg: any) => boolean
) => (cb1(el1) && cb2(el2)) || (cb1(el2) && cb2(el1));
