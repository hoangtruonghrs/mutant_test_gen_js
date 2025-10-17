/**
 * Example configuration for Azure OpenAI
 * Copy this to azure.config.js and update with your values
 */
module.exports = {
  // LLM Configuration
  llm: {
    provider: 'azure',
    model: 'gpt-4', // This should match your deployment model
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY || 'your-azure-openai-api-key',
    
    // Azure OpenAI specific configuration
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://your-resource.openai.azure.com',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'your-deployment-name',
    },
  },

  // Mutation Testing Configuration
  mutationTesting: {
    framework: 'stryker',
    targetMutationScore: 80,
    maxIterations: 5,
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
    batchSize: 3,
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