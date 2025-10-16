/**
 * Simple calculator module for demonstration
 */

class Calculator {
  /**
   * Add two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Sum of a and b
   */
  add(a, b) {
    return a + b;
  }

  /**
   * Subtract b from a
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Difference of a and b
   */
  subtract(a, b) {
    return a - b;
  }

  /**
   * Multiply two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Product of a and b
   */
  multiply(a, b) {
    return a * b;
  }

  /**
   * Divide a by b
   * @param {number} a - Numerator
   * @param {number} b - Denominator
   * @returns {number} Quotient of a and b
   * @throws {Error} If b is zero
   */
  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }

  /**
   * Calculate power of a number
   * @param {number} base - Base number
   * @param {number} exponent - Exponent
   * @returns {number} base raised to exponent
   */
  power(base, exponent) {
    return Math.pow(base, exponent);
  }

  /**
   * Calculate square root
   * @param {number} n - Number to calculate square root of
   * @returns {number} Square root of n
   * @throws {Error} If n is negative
   */
  sqrt(n) {
    if (n < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }
    return Math.sqrt(n);
  }

  /**
   * Check if number is even
   * @param {number} n - Number to check
   * @returns {boolean} True if n is even, false otherwise
   */
  isEven(n) {
    return n % 2 === 0;
  }

  /**
   * Get absolute value
   * @param {number} n - Number
   * @returns {number} Absolute value of n
   */
  abs(n) {
    return n < 0 ? -n : n;
  }
}

module.exports = Calculator;
