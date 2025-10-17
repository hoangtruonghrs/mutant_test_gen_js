/**
 * Test Helpers - Common utilities for tests
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * Create a temporary directory for test files
 */
async function createTempDir(prefix = 'test') {
  const tmpDir = path.join(__dirname, '..', 'tmp', `${prefix}-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  return tmpDir;
}

/**
 * Clean up temporary directory
 */
async function cleanupTempDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Create a temporary file with content
 */
async function createTempFile(dirPath, filename, content) {
  const filePath = path.join(dirPath, filename);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Wait for a specific amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Capture console output during test execution
 */
function captureConsole() {
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => logs.push({ level: 'log', args });
  console.error = (...args) => logs.push({ level: 'error', args });
  console.warn = (...args) => logs.push({ level: 'warn', args });

  return {
    logs,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };
}

/**
 * Assert that an async function throws an error
 */
async function expectAsyncError(fn, errorMessage) {
  let error;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  
  if (!error) {
    throw new Error('Expected function to throw an error, but it did not');
  }
  
  if (errorMessage && !error.message.includes(errorMessage)) {
    throw new Error(
      `Expected error message to include "${errorMessage}", but got "${error.message}"`
    );
  }
  
  return error;
}

/**
 * Create a spy function that tracks calls
 */
function createSpy(implementation) {
  const calls = [];
  
  const spy = function(...args) {
    calls.push({ args, timestamp: Date.now() });
    return implementation ? implementation(...args) : undefined;
  };
  
  spy.calls = calls;
  spy.callCount = () => calls.length;
  spy.calledWith = (...expectedArgs) => {
    return calls.some(call => 
      JSON.stringify(call.args) === JSON.stringify(expectedArgs)
    );
  };
  spy.reset = () => calls.length = 0;
  
  return spy;
}

/**
 * Deep clone an object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Assert object properties
 */
function assertObjectContains(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] === undefined) {
      throw new Error(`Expected object to have property "${key}"`);
    }
    
    if (typeof value === 'object' && value !== null) {
      assertObjectContains(actual[key], value);
    } else if (actual[key] !== value) {
      throw new Error(
        `Expected property "${key}" to be "${value}", but got "${actual[key]}"`
      );
    }
  }
}

module.exports = {
  createTempDir,
  cleanupTempDir,
  createTempFile,
  wait,
  captureConsole,
  expectAsyncError,
  createSpy,
  deepClone,
  assertObjectContains
};
