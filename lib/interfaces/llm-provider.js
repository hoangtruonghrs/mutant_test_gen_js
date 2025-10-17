/**
 * Interface for LLM providers
 * Defines the contract that all LLM adapters must implement
 */
class LLMProvider {
  /**
   * Generate initial tests for source code
   * @param {string} sourceCode - The source code to analyze
   * @param {string} fileName - Name of the source file
   * @param {Object} context - Additional context (existing tests, etc.)
   * @returns {Promise<string>} Generated test code
   */
  async generateTests(sourceCode, fileName, context = {}) {
    throw new Error('generateTests method must be implemented');
  }

  /**
   * Improve existing tests based on mutation analysis
   * @param {string} sourceCode - The source code
   * @param {string} existingTests - Current test code
   * @param {Array} survivedMutants - Mutants that survived testing
   * @returns {Promise<string>} Improved test code
   */
  async improveTests(sourceCode, existingTests, survivedMutants) {
    throw new Error('improveTests method must be implemented');
  }

  /**
   * Validate provider configuration
   * @param {Object} config - Provider configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    throw new Error('validateConfig method must be implemented');
  }

  /**
   * Get provider information
   * @returns {Object} Provider metadata
   */
  getInfo() {
    throw new Error('getInfo method must be implemented');
  }

  /**
   * Estimate cost for a request
   * @param {string} input - Input text
   * @param {Object} options - Request options
   * @returns {Object} Cost estimation
   */
  estimateCost(input, options = {}) {
    throw new Error('estimateCost method must be implemented');
  }

  /**
   * Check if provider is available and configured correctly
   * @returns {Promise<boolean>} True if provider is ready
   */
  async isHealthy() {
    throw new Error('isHealthy method must be implemented');
  }
}

module.exports = LLMProvider;