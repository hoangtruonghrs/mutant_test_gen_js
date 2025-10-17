/**
 * Mock Factory - Create all mocks in one place
 */

const { MockLLMAdapter } = require('./mock-llm-adapter');
const { MockMutationAdapter } = require('./mock-mutation-adapter');
const { MockStorageAdapter } = require('./mock-storage-adapter');

/**
 * Create all mocks with default or custom configurations
 */
function createMocks(config = {}) {
  return {
    llmAdapter: new MockLLMAdapter(config.llm || {}),
    mutationAdapter: new MockMutationAdapter(config.mutation || {}),
    storageAdapter: new MockStorageAdapter(config.storage || {})
  };
}

/**
 * Reset all mocks
 */
function resetMocks(mocks) {
  if (mocks.llmAdapter) mocks.llmAdapter.reset();
  if (mocks.mutationAdapter) mocks.mutationAdapter.reset();
  if (mocks.storageAdapter) mocks.storageAdapter.reset();
}

module.exports = {
  MockLLMAdapter,
  MockMutationAdapter,
  MockStorageAdapter,
  createMocks,
  resetMocks
};
