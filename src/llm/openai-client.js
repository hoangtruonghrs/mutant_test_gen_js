const OpenAI = require('openai');

/**
 * OpenAI client for LLM-based test generation
 */
class OpenAIClient {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Generate unit tests for given source code
   * @param {string} sourceCode - The source code to generate tests for
   * @param {string} fileName - The name of the source file
   * @param {Object} context - Additional context (e.g., existing tests, mutants)
   * @returns {Promise<string>} - Generated test code
   */
  async generateTests(sourceCode, fileName, context = {}) {
    this.logger.info('Generating tests via LLM', { fileName });

    const prompt = this._buildPrompt(sourceCode, fileName, context);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software testing engineer specializing in writing comprehensive unit tests. Generate high-quality, thorough unit tests that achieve high code coverage and mutation score.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const generatedCode = response.choices[0].message.content;
      return this._extractCodeFromResponse(generatedCode);
    } catch (error) {
      this.logger.error('Error generating tests', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate improved tests based on mutation testing feedback
   * @param {string} sourceCode - The source code
   * @param {string} existingTests - Existing test code
   * @param {Array} survivedMutants - List of survived mutants
   * @returns {Promise<string>} - Improved test code
   */
  async improveTests(sourceCode, existingTests, survivedMutants) {
    this.logger.info('Improving tests based on mutation feedback', {
      survivedMutantsCount: survivedMutants.length,
    });

    const prompt = this._buildImprovementPrompt(sourceCode, existingTests, survivedMutants);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software testing engineer. Analyze the survived mutants and generate additional or improved tests to kill them. Focus on edge cases and boundary conditions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const generatedCode = response.choices[0].message.content;
      return this._extractCodeFromResponse(generatedCode);
    } catch (error) {
      this.logger.error('Error improving tests', { error: error.message });
      throw error;
    }
  }

  /**
   * Build initial test generation prompt
   */
  _buildPrompt(sourceCode, fileName, context) {
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
   */
  _extractCodeFromResponse(response) {
    // Remove markdown code blocks
    let code = response.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');
    
    // Trim whitespace
    code = code.trim();
    
    return code;
  }
}

module.exports = OpenAIClient;
