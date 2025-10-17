/**
 * Interface for test frameworks
 * Defines the contract for test framework adapters
 */
class TestFramework {
  /**
   * Generate test file structure
   * @param {string} sourceFile - Source file path
   * @param {Object} options - Generation options
   * @returns {Object} Test file structure
   */
  generateTestStructure(sourceFile, options = {}) {
    throw new Error('generateTestStructure method must be implemented');
  }

  /**
   * Validate test syntax
   * @param {string} testCode - Test code to validate
   * @returns {boolean} True if syntax is valid
   */
  validateTestSyntax(testCode) {
    throw new Error('validateTestSyntax method must be implemented');
  }

  /**
   * Execute tests
   * @param {string} testFile - Test file path
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Test execution results
   */
  async executeTests(testFile, options = {}) {
    throw new Error('executeTests method must be implemented');
  }

  /**
   * Format test code
   * @param {string} testCode - Raw test code
   * @returns {string} Formatted test code
   */
  formatTestCode(testCode) {
    throw new Error('formatTestCode method must be implemented');
  }

  /**
   * Merge test files
   * @param {Array<string>} testFiles - Test file paths
   * @returns {string} Merged test content
   */
  mergeTests(testFiles) {
    throw new Error('mergeTests method must be implemented');
  }

  /**
   * Get framework information
   * @returns {Object} Framework metadata
   */
  getInfo() {
    throw new Error('getInfo method must be implemented');
  }

  /**
   * Check if framework is available
   * @returns {Promise<boolean>} True if framework is ready
   */
  async isAvailable() {
    throw new Error('isAvailable method must be implemented');
  }
}

module.exports = TestFramework;