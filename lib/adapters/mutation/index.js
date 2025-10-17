const StrykerAdapter = require('./stryker-adapter');

/**
 * Mutation engine adapter factory
 */
class MutationEngineFactory {
  constructor() {
    this.engines = new Map();
    this.registerDefaultEngines();
  }

  /**
   * Register default engines
   * @private
   */
  registerDefaultEngines() {
    this.register('stryker', StrykerAdapter);
  }

  /**
   * Register a new mutation engine adapter
   * @param {string} name - Engine name
   * @param {class} EngineClass - Engine class
   */
  register(name, EngineClass) {
    this.engines.set(name.toLowerCase(), EngineClass);
  }

  /**
   * Create a mutation engine adapter instance
   * @param {string} engine - Engine name
   * @param {Object} config - Configuration
   * @param {Object} logger - Logger instance
   * @returns {MutationEngine} Engine instance
   */
  create(engine, config, logger) {
    const engineName = engine.toLowerCase();
    const EngineClass = this.engines.get(engineName);
    
    if (!EngineClass) {
      throw new Error(`Unknown mutation engine: ${engine}. Available engines: ${Array.from(this.engines.keys()).join(', ')}`);
    }
    
    return new EngineClass(config, logger);
  }

  /**
   * Get list of available engines
   * @returns {Array<string>} Engine names
   */
  getAvailableEngines() {
    return Array.from(this.engines.keys());
  }

  /**
   * Check if engine is supported
   * @param {string} engine - Engine name
   * @returns {boolean} True if supported
   */
  isSupported(engine) {
    return this.engines.has(engine.toLowerCase());
  }
}

// Export singleton instance
const factory = new MutationEngineFactory();

module.exports = {
  factory,
  StrykerAdapter,
  
  // Convenience methods
  createEngine: (engine, config, logger) => factory.create(engine, config, logger),
  getAvailableEngines: () => factory.getAvailableEngines(),
  isSupported: (engine) => factory.isSupported(engine),
  register: (name, EngineClass) => factory.register(name, EngineClass)
};