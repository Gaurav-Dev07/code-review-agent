/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PullRequestEvent } from '@octokit/webhooks-types';
import { isWithinTokenLimit } from 'gpt-tokenizer';
import { GithubClientService } from 'src/integrations/github/github-client.service';
import { OpenAIService } from 'src/integrations/open-api/providers/open-api.service';
import { PromptService } from 'src/prompt/providers/prompt.service';
import {
  ICodeReviewComment,
  ICodeReviewResponse,
  IPullRequestFile,
} from 'src/utils';
import { PROMPT_TOKEN_LIMIT } from 'src/utils/constants/constants';

@Injectable()
export class CodeRevieService {
  private readonly logger: Logger = new Logger(CodeRevieService.name);

  constructor(
    private readonly githubClientService: GithubClientService,
    private readonly promptService: PromptService,
    private readonly openAIService: OpenAIService,
  ) {}
  async reviewPullRequestCode(prData: PullRequestEvent) {
    this.logger.log(
      `starting code review for pullRequest: ${prData.pull_request.number}`,
    );
    if (prData.action === 'opened' || prData.action === 'reopened') {
      const { pull_request, repository } = prData;
      const owner = repository.owner.login;
      const repoName = repository.name;
      const pullRequestNo = pull_request.number;
      const commitId = pull_request.head.sha;

      this.logger.log(`starting code review for pullRequest: ${pullRequestNo}`);
      try {
        this.logger.log(
          `calling the github client service to get the files from pullrequest`,
        );
        const codeDiff = await this.githubClientService.getPullRequestFiles(
          owner,
          repoName,
          pullRequestNo,
        );

        const prompt = this.promptService.generateCodeReviewPrompt();
        const validCodeDiffs = this.getValidPrDiffs(prompt, codeDiff);
        await this.reviewCodeDiffsWithOpenAI(
          prompt,
          validCodeDiffs,
          owner,
          repoName,
          pullRequestNo,
          commitId
        );

        this.logger.log(
          `Successfully reviewed pull request #${pullRequestNo} in ${owner}/${repoName}`,
        );
      } catch (error) {
        this.logger.error(
          `Error while reviewing the pull request code : ${error}`,
        );
        throw error;
      }
    } else {
      return 'OK';
    }
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async reviewCodeDiffsWithOpenAI(
    prompt: string,
    validCodeDiffs: IPullRequestFile[],
    owner: string,
    repoName: string,
    pullRequestNo: number,
    commitId: string
  ): Promise<void> {

    for (const validCodeDiff of validCodeDiffs) {
      // Wait for 30 seconds before each request
      this.logger.log(
        `Waiting 30 seconds before reviewing file ${validCodeDiff.filename}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await this.sleep(30000);

      const reviewResponse = await this.openAIService.reviewCode(
        prompt,
        validCodeDiff,
      );

      let reviewObj: ICodeReviewResponse;
      if (typeof reviewResponse === 'string') {
        try {
          reviewObj = JSON.parse(reviewResponse);
        } catch (e) {
          this.logger.warn(
            'Failed to parse review response continuing to next file',
            e,
          );
          throw e;
        }
      } else {
        reviewObj = reviewResponse;
      }

      const comments = reviewObj.comments;

      if (!comments || comments.length === 0) {
        this.logger.warn(
          `No review comments generated for file #${validCodeDiff.filename} on pull request #${pullRequestNo} in ${owner}/${repoName}`,
        );
        continue;
      }

      await this.addReviewComments(
        owner,
        repoName,
        pullRequestNo,
        comments,
        commitId,
        validCodeDiffs,
      );
    }
  }

  private async addReviewComments(
    owner: string,
    repoName: string,
    pullRequestNo: number,
    comments: ICodeReviewComment[],
    commitId: string,
    prFiles: IPullRequestFile[],
  ) {
    const reviewCommentPromises = comments.map(
      async (comment: ICodeReviewComment) => {
        if (comment && comment.file && comment.lineNo) {
          const fileDiff = prFiles.find((f) => f.filename === comment.file);
          if (!fileDiff) return;

          const position = this.getDiffPosition(fileDiff.patch, comment.lineNo);

          if (!position) {
            this.logger.warn(
              `Could not find position for comment in file ${comment.file} at line ${comment.lineNo}`,
            );
            return;
          }
          if (position) {
            try {
              await this.githubClientService.createReviewComment(
                owner,
                repoName,
                pullRequestNo,
                comment.comment,
                comment.file,
                position,
                commitId,
              );
            } catch (error) {
              this.logger.error(
                `Error posting review comment for file ${comment.file} at line ${comment.lineNo}: ${error}`,
              );
            }
          }
        }
      },
    );
    await Promise.all(reviewCommentPromises);
    this.logger.log(
      `Successfully posted review comments for pull request #${pullRequestNo} in ${owner}/${repoName}`,
    );
  }

  private checkIfPromptWIthInTokenLimit(prompt: string, input: string) {
    const tokenLimit = process.env.PROMPT_TOKEN_LIMIT ?? PROMPT_TOKEN_LIMIT;
    const promptText = prompt + input;
    return isWithinTokenLimit(promptText, Number(tokenLimit));
  }

  private getValidPrDiffs(
    prompt: string,
    prDiffs: IPullRequestFile[],
  ): IPullRequestFile[] {
    return prDiffs
      .map((file: IPullRequestFile) => {
        const prDiffInput = `\n---\n### File: ${file.filename}\n\`\`\`diff\n${file.patch}\n\`\`\``;
        return this.checkIfPromptWIthInTokenLimit(prompt, prDiffInput)
          ? file
          : null;
      })
      .filter((file: IPullRequestFile | null) => file !== null);
  }

  private getDiffPosition(patch: string, targetNewLineNumber: number) {
    const lines = patch.split('\n');
    let position = 0;
    let newLineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('@@')) {
        // Match hunk header: @@ -a,b +c,d @@
        const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          newLineNumber = parseInt(match[1], 10);
          position = 0; // reset position at new hunk
        }
        continue;
      }

      if (line.startsWith('-')) {
        // Deleted line from old file — doesn't increment new line number
        position++;
        continue;
      }

      if (line.startsWith('+')) {
        // Added line in new file
        if (newLineNumber === targetNewLineNumber) {
          return position;
        }
        newLineNumber++;
        position++;
        continue;
      }

      // Context line — present in both old and new files
      if (newLineNumber === targetNewLineNumber) {
        return position;
      }

      newLineNumber++;
      position++;
    }

    return -1; // Not found
  }
}
