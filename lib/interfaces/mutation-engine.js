/**
 * Interface for mutation testing engines
 * Defines the contract for mutation testing adapters
 */
class MutationEngine {
  /**
   * Run mutation testing on source and test files
   * @param {string} sourceFile - Path to source file
   * @param {string} testFile - Path to test file
   * @param {Object} options - Mutation testing options
   * @returns {Promise<Object>} Mutation results
   */
  async runMutationTests(sourceFile, testFile, options = {}) {
    throw new Error('runMutationTests method must be implemented');
  }

  /**
   * Analyze mutation results
   * @param {Object} rawResults - Raw mutation testing results
   * @returns {Object} Processed results with scores and mutant details
   */
  analyzeResults(rawResults) {
    throw new Error('analyzeResults method must be implemented');
  }

  /**
   * Generate mutation testing report
   * @param {Object} results - Mutation results
   * @param {string} outputPath - Path to save report
   * @returns {Promise<void>}
   */
  async generateReport(results, outputPath) {
    throw new Error('generateReport method must be implemented');
  }

  /**
   * Get supported mutators
   * @returns {Array<string>} List of available mutators
   */
  getSupportedMutators() {
    throw new Error('getSupportedMutators method must be implemented');
  }

  /**
   * Validate engine configuration
   * @param {Object} config - Engine configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    throw new Error('validateConfig method must be implemented');
  }

  /**
   * Check if mutation engine is available
   * @returns {Promise<boolean>} True if engine is ready
   */
  async isAvailable() {
    throw new Error('isAvailable method must be implemented');
  }

  /**
   * Get engine information
   * @returns {Object} Engine metadata
   */
  getInfo() {
    throw new Error('getInfo method must be implemented');
  }
}

module.exports = MutationEngine;