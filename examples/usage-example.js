/**
 * Example of using Mutant Test Gen JS programmatically
 */

require('dotenv').config();
const { createApplication } = require('../index');
const config = require('../config/default.config');

async function main() {
  console.log('Starting Mutant Test Gen JS Example...\n');

  // Detect provider based on environment variables
  const provider = process.env.AZURE_OPENAI_ENDPOINT ? 'azure' : 'openai';
  
  // Check if required API credentials are set
  if (provider === 'azure') {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      console.error('Error: Azure OpenAI credentials are not set');
      console.error('Please set the following environment variables:');
      console.error('  - AZURE_OPENAI_ENDPOINT');
      console.error('  - AZURE_OPENAI_DEPLOYMENT_NAME');
      console.error('  - AZURE_OPENAI_API_VERSION (optional)');
      process.exit(1);
    }
    console.log(`Using Azure OpenAI: ${process.env.AZURE_OPENAI_ENDPOINT}\n`);
  } else {
    if (!process.env.OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY environment variable is not set');
      console.error('Please set it with: export OPENAI_API_KEY=your-api-key');
      console.error('\nOr use Azure OpenAI by setting:');
      console.error('  - AZURE_OPENAI_ENDPOINT');
      console.error('  - AZURE_OPENAI_DEPLOYMENT_NAME');
      process.exit(1);
    }
    console.log('Using OpenAI\n');
  }

  // Customize configuration based on provider
  const customConfig = {
    ...config,
    llm: {
      ...config.llm,
      provider: provider,
      model: provider === 'azure' ? 'gpt-4' : 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      azure: provider === 'azure' ? {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      } : undefined
    },
    targetMutationScore: 75, // Lower target for demo
    maxIterations: 3, // Fewer iterations for demo
  };

  try {
    // Initialize the application
    const app = createApplication(customConfig);

    // Generate tests for example files
    console.log('Generating tests for calculator.js...\n');
    
    const result = await app.generateTests({
      sourcePath: 'examples/calculator.js',
      outputPath: 'tests/calculator.test.js',
      useFeedbackLoop: true,
      targetMutationScore: customConfig.targetMutationScore,
      maxIterations: customConfig.maxIterations
    });

    // Display results
    if (result.success || result.type) {
      console.log('\n' + '='.repeat(60));
      console.log('✓ Test Generation Completed Successfully!');
      console.log('='.repeat(60));
      console.log(`Source File: ${result.sourceFile || 'examples/calculator.js'}`);
      console.log(`Test File: ${result.testFile || 'tests/calculator.test.js'}`);
      console.log(`Generation Type: ${result.type || 'simple'}`);
      
      if (result.type === 'feedback_loop' && result.feedbackResult) {
        console.log(`\nFeedback Loop Results:`);
        console.log(`  Iterations: ${result.feedbackResult.totalIterations}`);
        console.log(`  Final Score: ${result.feedbackResult.finalScore?.toFixed(2)}%`);
        console.log(`  Target Reached: ${result.feedbackResult.targetReached ? 'Yes' : 'No'}`);
        console.log(`  Duration: ${Math.floor(result.feedbackResult.totalDuration / 1000)}s`);
      } else if (result.mutationResult) {
        console.log(`\nMutation Analysis:`);
        console.log(`  Mutation Score: ${result.mutationResult.mutationScore?.toFixed(2)}%`);
        console.log(`  Total Mutants: ${result.mutationResult.totalMutants}`);
        console.log(`  Killed: ${result.mutationResult.killedMutants}`);
        console.log(`  Survived: ${result.mutationResult.survivedMutants}`);
      }
      
      if (result.testCases) {
        console.log(`\nGenerated ${result.testCases.length} test case(s)`);
      }
      
      console.log('='.repeat(60));
    } else {
      console.error('\n✗ Test generation failed:', result.error || 'Unknown error');
      process.exit(1);
    }
    
    // Cleanup
    await app.cleanup();
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the example
main();
