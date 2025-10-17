/**
 * Mock Storage Adapter for testing
 */

class MockStorageAdapter {
  constructor(config = {}) {
    this.config = config;
    this.calls = [];
    this.storage = new Map();
    this.shouldFail = config.shouldFail || false;
  }

  async saveFile(filePath, content) {
    this.calls.push({
      method: 'saveFile',
      args: { filePath, content },
      timestamp: Date.now()
    });

    if (this.shouldFail) {
      throw new Error('Storage error: Mock failure');
    }

    this.storage.set(filePath, content);
  }

  async readFile(filePath) {
    this.calls.push({
      method: 'readFile',
      args: { filePath },
      timestamp: Date.now()
    });

    if (this.shouldFail) {
      throw new Error('Storage error: Mock failure');
    }

    if (!this.storage.has(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return this.storage.get(filePath);
  }

  async exists(filePath) {
    this.calls.push({
      method: 'exists',
      args: { filePath },
      timestamp: Date.now()
    });

    return this.storage.has(filePath);
  }

  async deleteFile(filePath) {
    this.calls.push({
      method: 'deleteFile',
      args: { filePath },
      timestamp: Date.now()
    });

    if (this.shouldFail) {
      throw new Error('Storage error: Mock failure');
    }

    this.storage.delete(filePath);
  }

  async saveSession(sessionData) {
    this.calls.push({
      method: 'saveSession',
      args: { sessionData },
      timestamp: Date.now()
    });

    if (this.shouldFail) {
      throw new Error('Storage error: Mock failure');
    }

    const sessionPath = `session-${sessionData.sessionId}.json`;
    this.storage.set(sessionPath, JSON.stringify(sessionData));
  }

  async loadSession(sessionId) {
    this.calls.push({
      method: 'loadSession',
      args: { sessionId },
      timestamp: Date.now()
    });

    if (this.shouldFail) {
      throw new Error('Storage error: Mock failure');
    }

    const sessionPath = `session-${sessionId}.json`;
    if (!this.storage.has(sessionPath)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return JSON.parse(this.storage.get(sessionPath));
  }

  getCallCount() {
    return this.calls.length;
  }

  getLastCall() {
    return this.calls[this.calls.length - 1];
  }

  getStoredFiles() {
    return Array.from(this.storage.keys());
  }

  reset() {
    this.calls = [];
    this.storage.clear();
  }

  setShouldFail(shouldFail) {
    this.shouldFail = shouldFail;
  }

  // Helper method to pre-populate storage
  setFile(filePath, content) {
    this.storage.set(filePath, content);
  }

  async writeFile(filePath, content) {
    return this.saveFile(filePath, content);
  }

  getInfo() {
    return {
      type: 'mock-storage',
      filesStored: this.storage.size,
      version: '1.0.0'
    };
  }
}

module.exports = { MockStorageAdapter };
