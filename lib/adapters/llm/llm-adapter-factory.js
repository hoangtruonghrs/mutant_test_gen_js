/**
 * Factory for creating LLM adapter instances
 */

const OpenAIAdapter = require('./openai-adapter');
const AzureOpenAIAdapter = require('./azure-adapter');

class LLMAdapterFactory {
  /**
   * Create an LLM adapter based on configuration
   * @param {Object} config - LLM configuration
   * @returns {LLMProvider} LLM adapter instance
   */
  createAdapter(config = {}) {
    const provider = config.provider || 'openai';

    switch (provider.toLowerCase()) {
      case 'openai':
        return new OpenAIAdapter(config);
      
      case 'azure':
        return new AzureOpenAIAdapter(config);
      
      default:
        throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: openai, azure`);
    }
  }

  /**
   * Get list of supported providers
   * @returns {Array<string>} List of provider names
   */
  getSupportedProviders() {
    return ['openai', 'azure'];
  }

  /**
   * Check if a provider is supported
   * @param {string} provider - Provider name
   * @returns {boolean} True if supported
   */
  isProviderSupported(provider) {
    return this.getSupportedProviders().includes(provider.toLowerCase());
  }
}

module.exports = LLMAdapterFactory;
