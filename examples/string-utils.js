/**
 * String utility functions for demonstration
 */

/**
 * Capitalize first letter of a string
 * @param {string} str - Input string
 * @returns {string} String with first letter capitalized
 */
function capitalize(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Reverse a string
 * @param {string} str - Input string
 * @returns {string} Reversed string
 */
function reverse(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.split('').reverse().join('');
}

/**
 * Check if string is palindrome
 * @param {string} str - Input string
 * @returns {boolean} True if palindrome, false otherwise
 */
function isPalindrome(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

/**
 * Count vowels in a string
 * @param {string} str - Input string
 * @returns {number} Number of vowels
 */
function countVowels(str) {
  if (!str || typeof str !== 'string') {
    return 0;
  }
  const vowels = str.match(/[aeiou]/gi);
  return vowels ? vowels.length : 0;
}

/**
 * Truncate string to specified length
 * @param {string} str - Input string
 * @param {number} length - Maximum length
 * @returns {string} Truncated string with ellipsis if needed
 */
function truncate(str, length) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + '...';
}

/**
 * Repeat a string n times
 * @param {string} str - String to repeat
 * @param {number} times - Number of times to repeat
 * @returns {string} Repeated string
 */
function repeat(str, times) {
  if (!str || typeof str !== 'string' || times <= 0) {
    return '';
  }
  return str.repeat(times);
}

module.exports = {
  capitalize,
  reverse,
  isPalindrome,
  countVowels,
  truncate,
  repeat,
};
