const OpenAIClient = require('../src/llm/openai-client');

/**
 * Test script to verify Azure OpenAI integration
 */
async function testAzureOpenAI() {
  console.log('Testing Azure OpenAI integration...\n');

  // Azure OpenAI configuration
  const azureConfig = {
    provider: 'azure',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500,
    apiKey: process.env.OPENAI_API_KEY,
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    },
  };

  // Mock logger
  const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
  };

  try {
    console.log('Configuration:', {
      provider: azureConfig.provider,
      endpoint: azureConfig.azure.endpoint,
      deploymentName: azureConfig.azure.deploymentName,
      apiVersion: azureConfig.azure.apiVersion,
    });

    const client = new OpenAIClient(azureConfig, logger);
    
    // Simple test function to generate tests for
    const sourceCode = `
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

module.exports = { add };
`;

    console.log('\nGenerating tests for sample function...');
    const tests = await client.generateTests(sourceCode, 'add.js');
    
    console.log('\n✅ Success! Generated tests:');
    console.log(tests);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('endpoint')) {
      console.log('\n💡 Make sure to set AZURE_OPENAI_ENDPOINT environment variable');
    }
    if (error.message.includes('deployment')) {
      console.log('💡 Make sure to set AZURE_OPENAI_DEPLOYMENT_NAME environment variable');
    }
    if (error.message.includes('API key')) {
      console.log('💡 Make sure to set OPENAI_API_KEY environment variable with your Azure OpenAI key');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAzureOpenAI();
}

module.exports = { testAzureOpenAI };