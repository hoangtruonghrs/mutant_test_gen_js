/**
 * Default configuration for mutant test generation system
 */

// Auto-detect provider based on environment variables
const autoDetectProvider = () => {
  if (process.env.AZURE_OPENAI_ENDPOINT) {
    return 'azure';
  }
  return 'openai';
};

module.exports = {
  // LLM Configuration
  llm: {
    provider: autoDetectProvider(), // Auto-detect: 'openai' or 'azure'
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY || '',

    // Azure OpenAI specific configuration
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
    },
  },

  // Mutation Testing Configuration  
  mutation: {
    framework: 'stryker',
    testRunner: 'jest',
    timeout: 60000,
    reporters: ['clear-text', 'progress'],
    tempDirName: 'stryker-tmp',
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
  targetMutationScore: 80, // Target mutation score percentage
  maxIterations: 5, // Maximum feedback loop iterations
  useFeedbackLoop: false, // Use iterative improvement by default (use --feedback flag to enable)
  runMutationAnalysis: false, // Run mutation analysis after generation (disabled by default due to path issues)
  concurrency: 3, // Concurrent processing limit

  // Storage Configuration
  storage: {
    type: 'filesystem',
    encoding: 'utf8'
  },

  // Logging Configuration
  logging: {
    level: 'info',
    file: 'logs/mutation-testing.log',
    console: true,
    format: 'json'
  },

  // Paths
  paths: {
    source: 'src',
    output: 'tests',
    reports: 'reports',
  },
};
