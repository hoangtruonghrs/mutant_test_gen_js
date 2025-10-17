const OpenAI = require('openai');
const LLMProvider = require('../../interfaces/llm-provider');

/**
 * Azure OpenAI adapter implementing the LLMProvider interface
 */
class AzureOpenAIAdapter extends LLMProvider {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.client = null;
    this.info = {
      name: 'Azure OpenAI',
      version: '1.0.0',
      models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
      maxTokens: 128000,
      supportsStreaming: true
    };
    
    this._initialize();
  }

  /**
   * Initialize Azure OpenAI client
   * @private
   */
  _initialize() {
    if (!this.validateConfig(this.config)) {
      throw new Error('Invalid Azure OpenAI configuration');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: `${this.config.azure.endpoint}/openai/deployments/${this.config.azure.deploymentName}`,
      defaultQuery: { 'api-version': this.config.azure.apiVersion },
      defaultHeaders: {
        'api-key': this.config.apiKey,
      },
    });

    this.logger.info('Azure OpenAI adapter initialized', {
      endpoint: this.config.azure.endpoint,
      deployment: this.config.azure.deploymentName,
      apiVersion: this.config.azure.apiVersion
    });
  }

  /**
   * Generate initial tests for source code
   * @param {string} sourceCode - The source code to analyze
   * @param {string} fileName - Name of the source file
   * @param {Object} context - Additional context
   * @returns {Promise<string>} Generated test code
   */
  async generateTests(sourceCode, fileName, context = {}) {
    this.logger.info('Generating tests via Azure OpenAI', { 
      fileName, 
      deployment: this.config.azure.deploymentName 
    });

    const prompt = this._buildInitialPrompt(sourceCode, fileName, context);

    try {
      const response = await this.client.chat.completions.create({
        // Note: Azure OpenAI doesn't need model in request
        messages: [
          {
            role: 'system',
            content: this._getSystemPrompt('generate')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000
      });

      const generatedCode = response.choices[0].message.content;
      return this._extractCodeFromResponse(generatedCode);
    } catch (error) {
      this.logger.error('Error generating tests via Azure OpenAI', { 
        error: error.message,
        fileName 
      });
      throw error;
    }
  }

  /**
   * Improve existing tests based on mutation analysis
   * @param {string} sourceCode - The source code
   * @param {string} existingTests - Current test code
   * @param {Array} survivedMutants - Mutants that survived testing
   * @returns {Promise<string>} Improved test code
   */
  async improveTests(sourceCode, existingTests, survivedMutants) {
    this.logger.info('Improving tests via Azure OpenAI', {
      survivedMutantsCount: survivedMutants.length,
      deployment: this.config.azure.deploymentName
    });

    const prompt = this._buildImprovementPrompt(sourceCode, existingTests, survivedMutants);

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this._getSystemPrompt('improve')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 2000
      });

      const improvedCode = response.choices[0].message.content;
      return this._extractCodeFromResponse(improvedCode);
    } catch (error) {
      this.logger.error('Error improving tests via Azure OpenAI', { 
        error: error.message,
        survivedMutantsCount: survivedMutants.length
      });
      throw error;
    }
  }

  /**
   * Validate provider configuration
   * @param {Object} config - Provider configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    if (!config) return false;
    if (!config.apiKey || typeof config.apiKey !== 'string') return false;
    if (!config.azure) return false;
    if (!config.azure.endpoint || typeof config.azure.endpoint !== 'string') return false;
    if (!config.azure.deploymentName || typeof config.azure.deploymentName !== 'string') return false;
    if (!config.azure.apiVersion || typeof config.azure.apiVersion !== 'string') return false;
    if (config.temperature && (config.temperature < 0 || config.temperature > 2)) return false;
    if (config.maxTokens && (config.maxTokens < 1 || config.maxTokens > this.info.maxTokens)) return false;
    
    return true;
  }

  /**
   * Get provider information
   * @returns {Object} Provider metadata
   */
  getInfo() {
    return { 
      ...this.info,
      azure: {
        endpoint: this.config.azure.endpoint,
        deploymentName: this.config.azure.deploymentName,
        apiVersion: this.config.azure.apiVersion
      }
    };
  }

  /**
   * Estimate cost for a request
   * @param {string} input - Input text
   * @param {Object} options - Request options
   * @returns {Object} Cost estimation
   */
  estimateCost(input, options = {}) {
    const inputTokens = Math.ceil(input.length / 4); // Rough estimation
    const outputTokens = options.maxTokens || this.config.maxTokens || 2000;
    
    // Azure OpenAI pricing varies by region and deployment
    // This is a rough estimation - actual pricing should be configured
    const inputCost = (inputTokens / 1000) * 0.002; // Generic rate
    const outputCost = (outputTokens / 1000) * 0.002;
    
    return {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD',
      note: 'Azure pricing varies by region and deployment'
    };
  }

  /**
   * Check if provider is available and configured correctly
   * @returns {Promise<boolean>} True if provider is ready
   */
  async isHealthy() {
    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      
      return response.choices && response.choices.length > 0;
    } catch (error) {
      this.logger.warn('Azure OpenAI health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get system prompt for different tasks
   * @param {string} task - Task type ('generate' or 'improve')
   * @returns {string} System prompt
   * @private
   */
  _getSystemPrompt(task) {
    const basePrompt = 'You are an expert software testing engineer specializing in writing comprehensive unit tests.';
    
    switch (task) {
      case 'generate':
        return `${basePrompt} Generate high-quality, thorough unit tests that achieve high code coverage and mutation score.`;
      case 'improve':
        return `${basePrompt} Analyze survived mutants and generate additional or improved tests to kill them. Focus on edge cases and boundary conditions.`;
      default:
        return basePrompt;
    }
  }

  /**
   * Build initial test generation prompt
   * @param {string} sourceCode - Source code
   * @param {string} fileName - File name
   * @param {Object} context - Additional context
   * @returns {string} Prompt text
   * @private
   */
  _buildInitialPrompt(sourceCode, fileName, context) {
    let prompt = `Generate comprehensive unit tests for the following JavaScript code from file "${fileName}".\n\n`;
    prompt += `Source Code:\n\`\`\`javascript\n${sourceCode}\n\`\`\`\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- Use Jest testing framework\n`;
    prompt += `- Include tests for all functions and methods\n`;
    prompt += `- Cover edge cases, boundary conditions, and error handling\n`;
    prompt += `- Use descriptive test names\n`;
    prompt += `- Aim for high code coverage and mutation score\n`;
    
    if (context.existingTests) {
      prompt += `\nExisting tests:\n\`\`\`javascript\n${context.existingTests}\n\`\`\`\n`;
      prompt += `Generate additional tests that complement the existing ones.\n`;
    }

    prompt += `\nProvide only the test code without explanations.`;
    
    return prompt;
  }

  /**
   * Build improvement prompt based on mutation feedback
   * @param {string} sourceCode - Source code
   * @param {string} existingTests - Existing tests
   * @param {Array} survivedMutants - Survived mutants
   * @returns {string} Prompt text
   * @private
   */
  _buildImprovementPrompt(sourceCode, existingTests, survivedMutants) {
    let prompt = `The following source code has survived mutants that need to be killed.\n\n`;
    prompt += `Source Code:\n\`\`\`javascript\n${sourceCode}\n\`\`\`\n\n`;
    prompt += `Existing Tests:\n\`\`\`javascript\n${existingTests}\n\`\`\`\n\n`;
    prompt += `Survived Mutants:\n`;
    
    survivedMutants.slice(0, 10).forEach((mutant, index) => {
      prompt += `${index + 1}. ${mutant.mutatorName} at line ${mutant.location.start.line}: ${mutant.replacement}\n`;
    });

    if (survivedMutants.length > 10) {
      prompt += `... and ${survivedMutants.length - 10} more mutants\n`;
    }

    prompt += `\nGenerate additional or improved tests to kill these survived mutants. `;
    prompt += `Focus on the specific conditions and edge cases that would expose these mutations.\n`;
    prompt += `Provide only the additional test code without explanations.`;
    
    return prompt;
  }

  /**
   * Extract code from LLM response (remove markdown formatting)
   * @param {string} response - Raw response
   * @returns {string} Extracted code
   * @private
   */
  _extractCodeFromResponse(response) {
    // Remove markdown code blocks
    let code = response.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
    
    // Trim whitespace
    code = code.trim();
    
    return code;
  }
}

module.exports = AzureOpenAIAdapter;