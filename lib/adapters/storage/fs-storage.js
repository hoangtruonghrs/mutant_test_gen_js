const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const StorageProvider = require('../../interfaces/storage-provider');

/**
 * File system storage adapter
 */
class FileSystemStorage extends StorageProvider {
  constructor(config = {}, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.basePath = config.basePath || process.cwd();
  }

  /**
   * Read file content
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File content
   */
  async readFile(filePath) {
    try {
      const fullPath = this._resolvePath(filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      this.logger?.debug('File read successfully', { filePath, size: content.length });
      return content;
    } catch (error) {
      this.logger?.error('Failed to read file', { filePath, error: error.message });
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write file content
   * @param {string} filePath - Path to file
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content) {
    try {
      const fullPath = this._resolvePath(filePath);
      
      // Ensure directory exists
      await this.ensureDirectory(path.dirname(fullPath));
      
      await fs.writeFile(fullPath, content, 'utf-8');
      
      this.logger?.debug('File written successfully', { 
        filePath, 
        size: content.length,
        lines: content.split('\n').length
      });
    } catch (error) {
      this.logger?.error('Failed to write file', { filePath, error: error.message });
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - Path to file
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filePath) {
    try {
      const fullPath = this._resolvePath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory if it doesn't exist
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async ensureDirectory(dirPath) {
    try {
      const fullPath = this._resolvePath(dirPath);
      await fs.mkdir(fullPath, { recursive: true });
      
      this.logger?.debug('Directory ensured', { dirPath: fullPath });
    } catch (error) {
      this.logger?.error('Failed to create directory', { dirPath, error: error.message });
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * List files matching pattern
   * @param {string} pattern - Glob pattern
   * @param {Object} options - Options
   * @returns {Promise<Array<string>>} List of file paths
   */
  async listFiles(pattern, options = {}) {
    try {
      const searchPattern = this._resolvePath(pattern);
      const defaultOptions = {
        ignore: ['**/node_modules/**', '**/.*/**'],
        ...options
      };
      
      const files = await glob(searchPattern, defaultOptions);
      const resolvedFiles = files.map(f => path.resolve(f));
      
      this.logger?.debug('Files listed', { 
        pattern, 
        count: resolvedFiles.length,
        sample: resolvedFiles.slice(0, 3)
      });
      
      return resolvedFiles;
    } catch (error) {
      this.logger?.error('Failed to list files', { pattern, error: error.message });
      throw new Error(`Failed to list files with pattern ${pattern}: ${error.message}`);
    }
  }

  /**
   * Copy file
   * @param {string} sourcePath - Source file path
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  async copyFile(sourcePath, destPath) {
    try {
      const fullSourcePath = this._resolvePath(sourcePath);
      const fullDestPath = this._resolvePath(destPath);
      
      // Ensure destination directory exists
      await this.ensureDirectory(path.dirname(fullDestPath));
      
      await fs.copyFile(fullSourcePath, fullDestPath);
      
      this.logger?.debug('File copied successfully', { 
        sourcePath: fullSourcePath, 
        destPath: fullDestPath 
      });
    } catch (error) {
      this.logger?.error('Failed to copy file', { 
        sourcePath, 
        destPath, 
        error: error.message 
      });
      throw new Error(`Failed to copy file from ${sourcePath} to ${destPath}: ${error.message}`);
    }
  }

  /**
   * Delete file
   * @param {string} filePath - Path to file
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    try {
      const fullPath = this._resolvePath(filePath);
      await fs.unlink(fullPath);
      
      this.logger?.debug('File deleted successfully', { filePath: fullPath });
    } catch (error) {
      this.logger?.error('Failed to delete file', { filePath, error: error.message });
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get file stats
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File statistics
   */
  async getStats(filePath) {
    try {
      const fullPath = this._resolvePath(filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        permissions: stats.mode
      };
    } catch (error) {
      this.logger?.error('Failed to get file stats', { filePath, error: error.message });
      throw new Error(`Failed to get stats for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Move file
   * @param {string} sourcePath - Source file path
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  async moveFile(sourcePath, destPath) {
    try {
      const fullSourcePath = this._resolvePath(sourcePath);
      const fullDestPath = this._resolvePath(destPath);
      
      // Ensure destination directory exists
      await this.ensureDirectory(path.dirname(fullDestPath));
      
      await fs.rename(fullSourcePath, fullDestPath);
      
      this.logger?.debug('File moved successfully', { 
        sourcePath: fullSourcePath, 
        destPath: fullDestPath 
      });
    } catch (error) {
      this.logger?.error('Failed to move file', { 
        sourcePath, 
        destPath, 
        error: error.message 
      });
      throw new Error(`Failed to move file from ${sourcePath} to ${destPath}: ${error.message}`);
    }
  }

  /**
   * Read directory contents
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array<Object>>} Directory contents
   */
  async readDirectory(dirPath) {
    try {
      const fullPath = this._resolvePath(dirPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      const contents = entries.map(entry => ({
        name: entry.name,
        path: path.join(fullPath, entry.name),
        isFile: entry.isFile(),
        isDirectory: entry.isDirectory(),
        isSymbolicLink: entry.isSymbolicLink()
      }));
      
      this.logger?.debug('Directory read successfully', { 
        dirPath: fullPath, 
        entries: contents.length 
      });
      
      return contents;
    } catch (error) {
      this.logger?.error('Failed to read directory', { dirPath, error: error.message });
      throw new Error(`Failed to read directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Create backup of file
   * @param {string} filePath - Path to file
   * @param {string} backupSuffix - Backup suffix (default: .bak)
   * @returns {Promise<string>} Backup file path
   */
  async createBackup(filePath, backupSuffix = '.bak') {
    try {
      const backupPath = `${filePath}${backupSuffix}`;
      await this.copyFile(filePath, backupPath);
      
      this.logger?.debug('Backup created', { filePath, backupPath });
      return backupPath;
    } catch (error) {
      this.logger?.error('Failed to create backup', { filePath, error: error.message });
      throw new Error(`Failed to create backup of ${filePath}: ${error.message}`);
    }
  }

  /**
   * Watch file for changes
   * @param {string} filePath - Path to file
   * @param {Function} callback - Change callback
   * @returns {Object} Watcher instance
   */
  watchFile(filePath, callback) {
    try {
      const fullPath = this._resolvePath(filePath);
      const watcher = fs.watch(fullPath, (eventType, filename) => {
        this.logger?.debug('File change detected', { 
          filePath: fullPath, 
          eventType, 
          filename 
        });
        
        callback(eventType, filename, fullPath);
      });
      
      return {
        close: () => watcher.close(),
        path: fullPath
      };
    } catch (error) {
      this.logger?.error('Failed to watch file', { filePath, error: error.message });
      throw new Error(`Failed to watch file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get storage information
   * @returns {Object} Storage metadata
   */
  getInfo() {
    return {
      type: 'filesystem',
      basePath: this.basePath,
      capabilities: [
        'read', 'write', 'delete', 'copy', 'move', 
        'list', 'watch', 'backup', 'stats'
      ]
    };
  }

  /**
   * Resolve full path
   * @param {string} filePath - Relative or absolute path
   * @returns {string} Resolved path
   * @private
   */
  _resolvePath(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.resolve(this.basePath, filePath);
  }
}

module.exports = FileSystemStorage;