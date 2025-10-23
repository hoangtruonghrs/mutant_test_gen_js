#!/usr/bin/env node

/**
 * Pre-installation verification script
 * Checks Node.js version and basic requirements
 */

const MIN_NODE_VERSION = 14;

function checkNodeVersion() {
    const currentVersion = process.versions.node;
    const majorVersion = parseInt(currentVersion.split('.')[0], 10);

    console.log(`Checking Node.js version...`);
    console.log(`Current version: ${currentVersion}`);
    console.log(`Required version: >=${MIN_NODE_VERSION}.0.0`);

    if (majorVersion < MIN_NODE_VERSION) {
        console.error(`\n❌ ERROR: Node.js version ${MIN_NODE_VERSION}.0.0 or higher is required.`);
        console.error(`   You are currently running version ${currentVersion}`);
        console.error(`   Please upgrade Node.js: https://nodejs.org/`);
        process.exit(1);
    }

    console.log(`✅ Node.js version check passed\n`);
}

function displayWelcomeMessage() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Installing Mutant Test Gen JS                     ║');
    console.log('║     Automated Mutation Testing with LLMs              ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
}

function displayPostInstallInfo() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Installation Complete!                            ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('');
    console.log('1. Set up your LLM provider:');
    console.log('   OpenAI:');
    console.log('   export OPENAI_API_KEY=your-api-key');
    console.log('');
    console.log('   Azure OpenAI:');
    console.log('   export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com');
    console.log('   export AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment');
    console.log('   export OPENAI_API_KEY=your-azure-api-key');
    console.log('');
    console.log('2. Try the quick start:');
    console.log('   mutant-test-gen --help');
    console.log('');
    console.log('3. Generate your first tests:');
    console.log('   mutant-test-gen generate your-file.js');
    console.log('');
    console.log('📚 Documentation: https://github.com/hoangtruonghrs/mutant_test_gen_js');
    console.log('');
}

// Run checks
displayWelcomeMessage();
checkNodeVersion();

// Export for potential use in package.json scripts
module.exports = { checkNodeVersion, displayPostInstallInfo };
