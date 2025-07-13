import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { IPullRequestFile } from 'src/utils';

@Injectable()
export class OpenAIService {
  private readonly logger: Logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    });
  }

  async reviewCode(prompt: string, codeDiff: IPullRequestFile): Promise<any> {
    try {
      this.logger.log(
        `calling open ai for generating code review for input: ${codeDiff.patch}`,
      );
      // Format the input for better context to the model
      const formattedInput = `
  --- 
  ### File: ${codeDiff.filename}
  \`\`\`diff
  ${codeDiff.patch}
  \`\`\`
  `;
      const response = await this.openai.responses.create({
        model: 'gpt-4o-mini',
        instructions: prompt,
        input: formattedInput,
      });
      return response.output_text;
    } catch (error) {
      this.logger.error(
        `error while communicating using openAI, error: ${error}`,
      );
      throw error;
    }
  }
}

@Injectable()
export class PromptService {
  generateCodeReviewPrompt(): string {
    return `
You are a world-class senior software engineer.
Review the following GitHub pull request diff with a critical eye, focusing on:
- Code readability
- Performance
- Bug risks
- Security concerns
- Adherence to best practices
- Maintainability and design
- Only allow logs with logger

Respond ONLY with a valid JSON object in this format (do not include any markdown or explanation):

{
  "comments": [
    {
      "file": "<filename in the code diff which is file path>",
      "comment": "<comment>",
      "lineNo": <lineNo as a number>
    }
  ]
}
`;
  }
}
