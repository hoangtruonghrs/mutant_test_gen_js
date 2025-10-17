/**
 * Interface for storage providers
 * Defines the contract for file and data storage
 */
class StorageProvider {
  /**
   * Read file content
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File content
   */
  async readFile(filePath) {
    throw new Error('readFile method must be implemented');
  }

  /**
   * Write file content
   * @param {string} filePath - Path to file
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content) {
    throw new Error('writeFile method must be implemented');
  }

  /**
   * Check if file exists
   * @param {string} filePath - Path to file
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filePath) {
    throw new Error('fileExists method must be implemented');
  }

  /**
   * Create directory if it doesn't exist
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async ensureDirectory(dirPath) {
    throw new Error('ensureDirectory method must be implemented');
  }

  /**
   * List files matching pattern
   * @param {string} pattern - Glob pattern
   * @param {Object} options - Options
   * @returns {Promise<Array<string>>} List of file paths
   */
  async listFiles(pattern, options = {}) {
    throw new Error('listFiles method must be implemented');
  }

  /**
   * Copy file
   * @param {string} sourcePath - Source file path
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  async copyFile(sourcePath, destPath) {
    throw new Error('copyFile method must be implemented');
  }

  /**
   * Delete file
   * @param {string} filePath - Path to file
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    throw new Error('deleteFile method must be implemented');
  }

  /**
   * Get file stats
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File statistics
   */
  async getStats(filePath) {
    throw new Error('getStats method must be implemented');
  }
}

module.exports = StorageProvider;