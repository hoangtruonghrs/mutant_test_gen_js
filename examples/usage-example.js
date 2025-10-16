/**
 * Example of using Mutant Test Gen JS programmatically
 */

require('dotenv').config();
const MutantTestGenJS = require('../src/index');
const config = require('../config/default.config');

async function main() {
  console.log('Starting Mutant Test Gen JS Example...\n');

  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set');
    console.error('Please set it with: export OPENAI_API_KEY=your-api-key');
    process.exit(1);
  }

  // Customize configuration if needed
  const customConfig = {
    ...config,
    mutationTesting: {
      ...config.mutationTesting,
      targetMutationScore: 75, // Lower target for demo
      maxIterations: 3, // Fewer iterations for demo
    },
    llm: {
      ...config.llm,
      model: 'gpt-3.5-turbo', // Use cheaper model for demo
    },
  };

  try {
    // Initialize the system
    const mutantTestGen = new MutantTestGenJS(customConfig);

    // Generate tests for example files
    console.log('Generating tests for calculator.js...\n');
    const result = await mutantTestGen.run(['examples/calculator.js']);

    // Display results
    if (result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('✓ Test Generation Completed Successfully!');
      console.log('='.repeat(60));
      console.log(`Total Files Processed: ${result.summary.totalFiles}`);
      console.log(`Successful: ${result.summary.successful}`);
      console.log(`Failed: ${result.summary.failed}`);
      console.log(`Average Mutation Score: ${result.summary.averageMutationScore}%`);
      console.log(`Files Reaching Target: ${result.summary.targetReached}`);
      console.log(`Total Iterations: ${result.summary.totalIterations}`);
      console.log('='.repeat(60));

      // Display per-file results
      console.log('\nPer-File Results:');
      result.results.forEach((fileResult, index) => {
        console.log(`\n${index + 1}. ${fileResult.sourceFile}`);
        if (fileResult.success) {
          console.log(`   ✓ Mutation Score: ${fileResult.mutationScore.toFixed(2)}%`);
          console.log(`   ✓ Iterations: ${fileResult.iterations}`);
          console.log(`   ✓ Target Reached: ${fileResult.targetReached ? 'Yes' : 'No'}`);
          console.log(`   ✓ Test File: ${fileResult.testFilePath}`);
        } else {
          console.log(`   ✗ Error: ${fileResult.error}`);
        }
      });
    } else {
      console.error('\n✗ Test generation failed:', result.message);
      process.exit(1);
    }
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
