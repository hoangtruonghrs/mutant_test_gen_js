/**
 * Default configuration for mutant test generation system
 */
module.exports = {
  // LLM Configuration
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // Mutation Testing Configuration
  mutationTesting: {
    framework: 'stryker',
    targetMutationScore: 80, // Target mutation score percentage
    maxIterations: 5, // Maximum feedback loop iterations
    mutators: [
      'ArithmeticOperator',
      'ArrayDeclaration',
      'BlockStatement',
      'BooleanLiteral',
      'ConditionalExpression',
      'EqualityOperator',
      'LogicalOperator',
      'StringLiteral',
      'UnaryOperator',
    ],
  },

  // Test Generation Configuration
  testGeneration: {
    framework: 'jest',
    testFilePattern: '**/*.test.js',
    sourceFilePattern: 'src/**/*.js',
    outputDir: 'tests',
    batchSize: 3, // Number of tests to generate per iteration
  },

  // Logging Configuration
  logging: {
    level: 'info',
    file: 'logs/mutation-testing.log',
    console: true,
  },

  // Paths
  paths: {
    source: 'src',
    tests: 'tests',
    reports: 'reports',
  },
};
