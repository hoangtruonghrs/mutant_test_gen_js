#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const MutantTestGenJS = require('./src/index');
const defaultConfig = require('./config/default.config');

const program = new Command();

program
  .name('mutant-test-gen')
  .description('Automated mutation testing with LLM-guided test generation')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate tests for source files using LLM and mutation testing')
  .argument('<files...>', 'Source file(s) or glob pattern(s) to generate tests for')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-t, --target <score>', 'Target mutation score (0-100)', '80')
  .option('-i, --iterations <count>', 'Maximum feedback iterations', '5')
  .option('-m, --model <name>', 'LLM model to use', 'gpt-4')
  .action(async (files, options) => {
    try {
      // Load configuration
      let config = { ...defaultConfig };
      
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (fs.existsSync(configPath)) {
          const userConfig = require(configPath);
          config = { ...config, ...userConfig };
        }
      }

      // Override with CLI options
      if (options.target) {
        config.mutationTesting.targetMutationScore = parseInt(options.target, 10);
      }
      if (options.iterations) {
        config.mutationTesting.maxIterations = parseInt(options.iterations, 10);
      }
      if (options.model) {
        config.llm.model = options.model;
      }

      // Initialize and run
      const mutantTestGen = new MutantTestGenJS(config);
      const result = await mutantTestGen.run(files);

      if (result.success) {
        console.log('\n✓ Test generation completed successfully!');
        console.log(`  Total files: ${result.summary.totalFiles}`);
        console.log(`  Successful: ${result.summary.successful}`);
        console.log(`  Average mutation score: ${result.summary.averageMutationScore}%`);
        console.log(`  Target reached: ${result.summary.targetReached} files`);
        process.exit(0);
      } else {
        console.error('\n✗ Test generation failed:', result.message);
        process.exit(1);
      }
    } catch (error) {
      console.error('\n✗ Error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a configuration file')
  .option('-o, --output <path>', 'Output path for config file', 'mutant-test-gen.config.js')
  .action((options) => {
    const configPath = path.resolve(options.output);
    
    if (fs.existsSync(configPath)) {
      console.error(`Configuration file already exists at ${configPath}`);
      process.exit(1);
    }

    const configContent = `module.exports = ${JSON.stringify(defaultConfig, null, 2)};`;
    fs.writeFileSync(configPath, configContent);
    
    console.log(`✓ Configuration file created at ${configPath}`);
    console.log('\nNext steps:');
    console.log('1. Set your OPENAI_API_KEY environment variable');
    console.log('2. Edit the configuration file to customize settings');
    console.log('3. Run: mutant-test-gen generate <source-files>');
  });

program.parse();
