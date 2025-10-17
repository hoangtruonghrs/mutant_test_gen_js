/**
 * Test Fixtures - Sample data for testing
 */

const sampleSourceCode = `
function calculateSum(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Arguments must be numbers');
  }
  return a + b;
}

function multiply(x, y) {
  return x * y;
}

module.exports = { calculateSum, multiply };
`.trim();

const sampleTestCode = `
const { calculateSum, multiply } = require('./calculator');

describe('Calculator', () => {
  describe('calculateSum', () => {
    test('should add two positive numbers', () => {
      expect(calculateSum(2, 3)).toBe(5);
    });

    test('should throw error for non-number inputs', () => {
      expect(() => calculateSum('a', 2)).toThrow('Arguments must be numbers');
    });
  });

  describe('multiply', () => {
    test('should multiply two numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });
  });
});
`.trim();

const sampleMutationResults = {
  mutationScore: 75.0,
  totalMutants: 8,
  killedMutants: 6,
  survivedMutants: 2,
  timedOutMutants: 0,
  noCoverageMutants: 0,
  mutants: [
    {
      id: '1',
      mutatorName: 'ConditionalExpression',
      location: { start: { line: 2, column: 7 }, end: { line: 2, column: 28 } },
      replacement: 'true',
      status: 'Killed',
      killedBy: ['Calculator should add two positive numbers']
    },
    {
      id: '2',
      mutatorName: 'ArithmeticOperator',
      location: { start: { line: 5, column: 9 }, end: { line: 5, column: 18 } },
      replacement: 'a - b',
      status: 'Survived',
      killedBy: []
    }
  ]
};

const sampleConfig = {
  llm: {
    provider: 'openai',
    apiKey: 'test-api-key',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  },
  mutation: {
    framework: 'stryker',
    timeout: 30000,
    maxMutants: 100
  },
  targetMutationScore: 80,
  maxIterations: 3,
  outputDir: './generated-tests'
};

const sampleSessionData = {
  sessionId: 'test-session-123',
  startTime: Date.now(),
  sourceFile: '/path/to/calculator.js',
  testFile: '/path/to/calculator.test.js',
  iterations: [
    {
      iteration: 1,
      mutationScore: 60,
      testCode: sampleTestCode,
      mutationResults: sampleMutationResults
    }
  ],
  finalScore: 75,
  status: 'completed'
};

const complexSourceCode = `
class UserManager {
  constructor(database) {
    this.db = database;
    this.users = [];
  }

  async createUser(userData) {
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }

    const existingUser = await this.db.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = {
      id: Date.now(),
      ...userData,
      createdAt: new Date()
    };

    await this.db.save(user);
    this.users.push(user);
    return user;
  }

  async deleteUser(userId) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) {
      return false;
    }

    await this.db.delete(userId);
    this.users.splice(index, 1);
    return true;
  }

  getUserCount() {
    return this.users.length;
  }
}

module.exports = UserManager;
`.trim();

module.exports = {
  sampleSourceCode,
  sampleTestCode,
  sampleMutationResults,
  sampleConfig,
  sampleSessionData,
  complexSourceCode
};
