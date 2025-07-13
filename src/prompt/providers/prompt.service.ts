import { Injectable } from '@nestjs/common';

// filepath: c:\Users\shukl\Desktop\projects\code-review-assistant\src\prompt\providers\prompt.service.ts
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
