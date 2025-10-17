const FileSystemStorage = require('./fs-storage');

/**
 * Storage adapter factory
 */
class StorageFactory {
  constructor() {
    this.storages = new Map();
    this.registerDefaultStorages();
  }

  /**
   * Register default storage adapters
   * @private
   */
  registerDefaultStorages() {
    this.register('fs', FileSystemStorage);
    this.register('filesystem', FileSystemStorage);
  }

  /**
   * Register a new storage adapter
   * @param {string} name - Storage name
   * @param {class} StorageClass - Storage class
   */
  register(name, StorageClass) {
    this.storages.set(name.toLowerCase(), StorageClass);
  }

  /**
   * Create a storage adapter instance
   * @param {string} storage - Storage type
   * @param {Object} config - Configuration
   * @param {Object} logger - Logger instance
   * @returns {StorageProvider} Storage instance
   */
  create(storage, config, logger) {
    const storageName = storage.toLowerCase();
    const StorageClass = this.storages.get(storageName);
    
    if (!StorageClass) {
      throw new Error(`Unknown storage type: ${storage}. Available types: ${Array.from(this.storages.keys()).join(', ')}`);
    }
    
    return new StorageClass(config, logger);
  }

  /**
   * Get list of available storage types
   * @returns {Array<string>} Storage type names
   */
  getAvailableStorages() {
    return Array.from(this.storages.keys());
  }

  /**
   * Check if storage type is supported
   * @param {string} storage - Storage type
   * @returns {boolean} True if supported
   */
  isSupported(storage) {
    return this.storages.has(storage.toLowerCase());
  }
}

// Export singleton instance
const factory = new StorageFactory();

module.exports = {
  factory,
  FileSystemStorage,
  
  // Convenience methods
  createStorage: (storage, config, logger) => factory.create(storage, config, logger),
  getAvailableStorages: () => factory.getAvailableStorages(),
  isSupported: (storage) => factory.isSupported(storage),
  register: (name, StorageClass) => factory.register(name, StorageClass)
};