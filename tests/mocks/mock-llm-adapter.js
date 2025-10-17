/**
 * Mock LLM Adapter for testing
 */

class MockLLMAdapter {
  constructor(config = {}) {
    this.config = config;
    this.calls = [];
    this.responses = config.responses || [];
    this.responseIndex = 0;
    this.shouldFail = config.shouldFail || false;
    this.delay = config.delay || 0;
  }

  async generateTests(sourceCode, context = {}) {
    this.calls.push({
      method: 'generateTests',
      args: { sourceCode, context },
      timestamp: Date.now()
    });

    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('LLM API Error: Mock failure');
    }

    // Return predefined response or generate a default one
    if (this.responses.length > 0) {
      const response = this.responses[this.responseIndex % this.responses.length];
      this.responseIndex++;
      // If response has testCode property, return the testCode string
      return response.testCode || response;
    }

    return `
describe('Generated Test', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
});
    `.trim();
  }

  async improveTests(sourceCode, existingTests, survivedMutants) {
    this.calls.push({
      method: 'improveTests',
      args: { sourceCode, existingTests, survivedMutants },
      timestamp: Date.now()
    });

    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('LLM API Error: Mock failure');
    }

    // Return predefined response or generate improved version
    if (this.responses.length > 0) {
      const response = this.responses[this.responseIndex % this.responses.length];
      this.responseIndex++;
      // If response has testCode property, return the testCode string
      return response.testCode || response;
    }

    return `
describe('Improved Test', () => {
  test('should work better', () => {
    expect(true).toBe(true);
  });
  
  test('handles edge cases', () => {
    expect(null).toBeNull();
  });
});
    `.trim();
  }

  getCallCount() {
    return this.calls.length;
  }

  getLastCall() {
    return this.calls[this.calls.length - 1];
  }

  reset() {
    this.calls = [];
    this.responseIndex = 0;
  }

  setResponses(responses) {
    this.responses = responses;
    this.responseIndex = 0;
  }

  setShouldFail(shouldFail) {
    this.shouldFail = shouldFail;
  }

  async isHealthy() {
    if (this.shouldFail) {
      throw new Error('Health check failed');
    }
    return true;
  }

  getInfo() {
    return {
      provider: this.config.provider || 'mock',
      model: this.config.model || 'mock-model',
      version: '1.0.0'
    };
  }

  estimateCost(sourceCode, options = {}) {
    const baseTokens = Math.ceil(sourceCode.length / 4);
    const outputTokens = options.maxTokens || 2000;
    const totalTokens = baseTokens + outputTokens;

    return {
      inputTokens: baseTokens,
      outputTokens: outputTokens,
      totalTokens: totalTokens,
      estimatedCost: (totalTokens / 1000) * 0.03,
      model: this.config.model || 'mock-model'
    };
  }
}

module.exports = { MockLLMAdapter };
