const OpenAIAdapter = require('./openai-adapter');
const AzureOpenAIAdapter = require('./azure-adapter');

/**
 * LLM adapter factory and registry
 */
class LLMAdapterFactory {
  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  /**
   * Register default adapters
   * @private
   */
  registerDefaultAdapters() {
    this.register('openai', OpenAIAdapter);
    this.register('azure', AzureOpenAIAdapter);
  }

  /**
   * Register a new LLM adapter
   * @param {string} name - Adapter name
   * @param {class} AdapterClass - Adapter class
   */
  register(name, AdapterClass) {
    this.adapters.set(name.toLowerCase(), AdapterClass);
  }

  /**
   * Create an LLM adapter instance
   * @param {string} provider - Provider name
   * @param {Object} config - Configuration
   * @param {Object} logger - Logger instance
   * @returns {LLMProvider} Adapter instance
   */
  create(provider, config, logger) {
    const providerName = provider.toLowerCase();
    const AdapterClass = this.adapters.get(providerName);
    
    if (!AdapterClass) {
      throw new Error(`Unknown LLM provider: ${provider}. Available providers: ${Array.from(this.adapters.keys()).join(', ')}`);
    }
    
    return new AdapterClass(config, logger);
  }

  /**
   * Get list of available providers
   * @returns {Array<string>} Provider names
   */
  getAvailableProviders() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if provider is supported
   * @param {string} provider - Provider name
   * @returns {boolean} True if supported
   */
  isSupported(provider) {
    return this.adapters.has(provider.toLowerCase());
  }
}

// Export singleton instance
const factory = new LLMAdapterFactory();

module.exports = {
  factory,
  OpenAIAdapter,
  AzureOpenAIAdapter,
  
  // Convenience methods
  createAdapter: (provider, config, logger) => factory.create(provider, config, logger),
  getAvailableProviders: () => factory.getAvailableProviders(),
  isSupported: (provider) => factory.isSupported(provider),
  register: (name, AdapterClass) => factory.register(name, AdapterClass)
};