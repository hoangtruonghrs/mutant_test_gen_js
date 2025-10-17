/**
 * Generation session entity representing a complete test generation workflow
 */
class GenerationSession {
  constructor(config = {}) {
    this.id = this._generateId();
    this.config = config;
    this.startTime = new Date();
    this.endTime = null;
    this.status = 'started';
    this.sourceFiles = [];
    this.results = [];
    this.totalIterations = 0;
    this.errors = [];
    this.metadata = {
      llmProvider: config.llm?.provider || 'unknown',
      model: config.llm?.model || 'unknown',
      targetScore: config.mutationTesting?.targetMutationScore || 80,
      maxIterations: config.mutationTesting?.maxIterations || 5
    };
  }

  /**
   * Add source file to session
   * @param {SourceFile} sourceFile - Source file to add
   */
  addSourceFile(sourceFile) {
    this.sourceFiles.push(sourceFile);
  }

  /**
   * Add result to session
   * @param {Object} result - Generation result
   */
  addResult(result) {
    this.results.push(result);
    this.totalIterations += result.iterations || 0;
  }

  /**
   * Add error to session
   * @param {Error} error - Error that occurred
   * @param {string} context - Context where error occurred
   */
  addError(error, context = 'unknown') {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    });
  }

  /**
   * Complete the session
   * @param {string} status - Final status (completed, failed, cancelled)
   */
  complete(status = 'completed') {
    this.endTime = new Date();
    this.status = status;
  }

  /**
   * Get session duration in milliseconds
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    const endTime = this.endTime || new Date();
    return endTime.getTime() - this.startTime.getTime();
  }

  /**
   * Get session duration in human readable format
   * @returns {string} Human readable duration
   */
  getHumanDuration() {
    const duration = this.getDuration();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get success rate
   * @returns {number} Success rate percentage
   */
  getSuccessRate() {
    const successful = this.results.filter(r => r.success).length;
    return this.results.length > 0 ? (successful / this.results.length) * 100 : 0;
  }

  /**
   * Get average mutation score
   * @returns {number} Average mutation score
   */
  getAverageMutationScore() {
    const successful = this.results.filter(r => r.success && r.mutationScore);
    if (successful.length === 0) return 0;
    
    const total = successful.reduce((sum, r) => sum + r.mutationScore, 0);
    return total / successful.length;
  }

  /**
   * Get files that reached target
   * @returns {number} Number of files that reached target
   */
  getFilesReachedTarget() {
    return this.results.filter(r => r.targetReached).length;
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    const avgTimePerFile = this.results.length > 0 ? 
      this.getDuration() / this.results.length : 0;
    
    const avgIterationsPerFile = this.results.length > 0 ?
      this.totalIterations / this.results.length : 0;
    
    return {
      totalDuration: this.getDuration(),
      humanDuration: this.getHumanDuration(),
      avgTimePerFile,
      avgIterationsPerFile,
      totalIterations: this.totalIterations,
      filesPerHour: this.getDuration() > 0 ? 
        (this.results.length / (this.getDuration() / 3600000)) : 0
    };
  }

  /**
   * Get session summary
   * @returns {Object} Session summary
   */
  getSummary() {
    return {
      id: this.id,
      status: this.status,
      duration: this.getHumanDuration(),
      totalFiles: this.sourceFiles.length,
      processedFiles: this.results.length,
      successful: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      targetReached: this.getFilesReachedTarget(),
      successRate: this.getSuccessRate(),
      averageMutationScore: this.getAverageMutationScore(),
      totalIterations: this.totalIterations,
      errors: this.errors.length,
      performance: this.getPerformanceMetrics()
    };
  }

  /**
   * Get detailed report
   * @returns {Object} Detailed session report
   */
  getDetailedReport() {
    return {
      session: this.getSummary(),
      metadata: this.metadata,
      sourceFiles: this.sourceFiles.map(f => f.toJSON()),
      results: this.results,
      errors: this.errors,
      config: this.config
    };
  }

  /**
   * Export session data
   * @param {string} format - Export format ('json', 'summary')
   * @returns {Object|string} Exported data
   */
  export(format = 'json') {
    switch (format) {
      case 'summary':
        return this.getSummary();
      case 'detailed':
        return this.getDetailedReport();
      case 'json':
      default:
        return JSON.stringify(this.getDetailedReport(), null, 2);
    }
  }

  /**
   * Check if session is complete
   * @returns {boolean} True if session is complete
   */
  isComplete() {
    return this.status === 'completed' || this.status === 'failed' || this.status === 'cancelled';
  }

  /**
   * Check if session was successful
   * @returns {boolean} True if session was successful
   */
  isSuccessful() {
    return this.status === 'completed' && this.getSuccessRate() > 0;
  }

  /**
   * Convert to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return this.getSummary();
  }

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   * @private
   */
  _generateId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = GenerationSession;