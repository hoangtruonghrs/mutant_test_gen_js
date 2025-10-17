/**
 * Source file entity representing a source code file to be tested
 */
class SourceFile {
  constructor(filePath, content, language = 'javascript') {
    this.filePath = filePath;
    this.content = content;
    this.language = language;
    this.size = content.length;
    this.lineCount = content.split('\n').length;
    this.createdAt = new Date();
    this.lastModified = null;
    this.hash = this._calculateHash(content);
  }

  /**
   * Get file name without path
   * @returns {string} File name
   */
  getFileName() {
    return this.filePath.split(/[/\\]/).pop();
  }

  /**
   * Get file extension
   * @returns {string} File extension
   */
  getExtension() {
    return this.getFileName().split('.').pop();
  }

  /**
   * Get relative path from a base directory
   * @param {string} baseDir - Base directory
   * @returns {string} Relative path
   */
  getRelativePath(baseDir) {
    return this.filePath.replace(baseDir, '').replace(/^[/\\]/, '');
  }

  /**
   * Check if file has changed
   * @param {string} newContent - New content to compare
   * @returns {boolean} True if content has changed
   */
  hasChanged(newContent) {
    return this.hash !== this._calculateHash(newContent);
  }

  /**
   * Update file content
   * @param {string} newContent - New content
   */
  updateContent(newContent) {
    this.content = newContent;
    this.size = newContent.length;
    this.lineCount = newContent.split('\n').length;
    this.lastModified = new Date();
    this.hash = this._calculateHash(newContent);
  }

  /**
   * Get complexity metrics
   * @returns {Object} Complexity metrics
   */
  getComplexityMetrics() {
    const functionCount = (this.content.match(/function\s+\w+/g) || []).length;
    const classCount = (this.content.match(/class\s+\w+/g) || []).length;
    const conditionalCount = (this.content.match(/\b(if|else|while|for|switch)\b/g) || []).length;
    
    return {
      functions: functionCount,
      classes: classCount,
      conditionals: conditionalCount,
      lines: this.lineCount,
      size: this.size,
      complexity: Math.floor(Math.log10(functionCount + classCount + conditionalCount + 1) * 10)
    };
  }

  /**
   * Extract function signatures
   * @returns {Array<Object>} Function signatures
   */
  extractFunctions() {
    const functionRegex = /(?:function\s+(\w+)\s*\([^)]*\)|(\w+)\s*:\s*function\s*\([^)]*\)|(\w+)\s*\([^)]*\)\s*\{)/g;
    const functions = [];
    let match;

    while ((match = functionRegex.exec(this.content)) !== null) {
      const functionName = match[1] || match[2] || match[3];
      if (functionName) {
        functions.push({
          name: functionName,
          line: this.content.substring(0, match.index).split('\n').length,
          signature: match[0]
        });
      }
    }

    return functions;
  }

  /**
   * Convert to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      filePath: this.filePath,
      fileName: this.getFileName(),
      language: this.language,
      size: this.size,
      lineCount: this.lineCount,
      hash: this.hash,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      complexity: this.getComplexityMetrics()
    };
  }

  /**
   * Calculate content hash
   * @param {string} content - Content to hash
   * @returns {string} Hash string
   * @private
   */
  _calculateHash(content) {
    // Simple hash function - in production, use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

module.exports = SourceFile;