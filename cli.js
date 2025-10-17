#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { createApplication } = require('./index');
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
  .option('-o, --output <dir>', 'Output directory for generated tests (default: tests)')
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
      if (options.output) {
        config.paths = config.paths || {};
        config.paths.output = options.output;
      }
      if (options.target) {
        config.targetMutationScore = parseInt(options.target, 10);
      }
      if (options.iterations) {
        config.maxIterations = parseInt(options.iterations, 10);
      }
      if (options.model) {
        config.llm.model = options.model;
      }

      // Initialize application
      const app = createApplication(config);

      // Determine if single file or batch
      const isSingleFile = files.length === 1 && !files[0].includes('*') && !files[0].includes('?');
      
      let result;
      if (isSingleFile) {
        // Single file processing
        const sourcePath = path.resolve(files[0]);
        const outputDir = config.paths.output || 'tests';
        const outputPath = path.join(
          outputDir,
          path.basename(sourcePath, '.js') + '.test.js'
        );
        
        console.log(`\n📝 Generating tests for: ${sourcePath}`);
        console.log(`📁 Output directory: ${path.resolve(outputDir)}`);
        console.log(`📄 Test file: ${path.basename(outputPath)}\n`);
        
        result = await app.generateTests({
          sourcePath,
          outputPath,
          useFeedbackLoop: config.useFeedbackLoop || false,
          targetMutationScore: config.targetMutationScore,
          maxIterations: config.maxIterations
        });
        
        result = {
          success: result.success,
          outputPath: path.resolve(outputPath),
          sourcePath: sourcePath,
          summary: {
            totalFiles: 1,
            successful: result.success ? 1 : 0,
            failed: result.success ? 0 : 1
          }
        };
      } else {
        // Batch processing
        const outputDir = config.paths.output || 'tests';
        
        console.log(`\n📝 Batch processing ${files.length} file pattern(s)`);
        console.log(`📁 Output directory: ${path.resolve(outputDir)}\n`);
        
        result = await app.batchProcess({
          sourcePattern: files.join(','),
          outputDir: outputDir,
          mode: 'generate',
          concurrency: config.concurrency || 3
        });
        
        result = {
          success: result.failedFiles === 0,
          outputDir: path.resolve(outputDir),
          summary: {
            totalFiles: result.totalFiles,
            successful: result.successfulFiles,
            failed: result.failedFiles,
            duration: result.duration
          }
        };
      }

      if (result.success) {
        console.log('\n✅ Test generation completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`  Total files: ${result.summary.totalFiles}`);
        console.log(`  Successful: ${result.summary.successful}`);
        console.log(`  Failed: ${result.summary.failed}`);
        if (result.summary.duration) {
          console.log(`  Duration: ${Math.floor(result.summary.duration / 1000)}s`);
        }
        
        if (result.outputPath) {
          // Single file
          console.log(`\n📄 Generated test file:`);
          console.log(`  ${result.outputPath}`);
        } else if (result.outputDir) {
          // Batch processing
          console.log(`\n📁 Tests generated in:`);
          console.log(`  ${result.outputDir}`);
        }
        
        console.log('\n💡 Next steps:');
        console.log('  1. Review the generated tests');
        console.log('  2. Run: npm test');
        console.log('  3. Adjust tests as needed\n');
        
        await app.cleanup();
        process.exit(0);
      } else {
        console.error('\n❌ Test generation failed');
        console.error(`  Successful: ${result.summary.successful}/${result.summary.totalFiles}`);
        console.error(`  Failed: ${result.summary.failed}/${result.summary.totalFiles}\n`);
        await app.cleanup();
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
