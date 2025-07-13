// src/github/github.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { OctokitService } from 'nestjs-octokit';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  constructor(private readonly octokitService: OctokitService) {}
  /**
   * Fetches the code difference (diff) for a specific pull request.
   * @param owner The repository owner.
   * @param repo The repository name.
   * @param pull_number The number of the pull request.
   * @returns A string containing the full diff.
   */
  async getPullRequestDiff(owner: string, repo: string, pull_number: number) {
    try {
      // The key is to add the 'Accept' header for the diff format.
      const { data: diff } = await this.octokitService.rest.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: {
          format: 'diff',
        },
      });

      // The 'data' property will be a string containing the diff.
      // Note: For some Octokit versions or configurations, you might need to cast the type.
      return diff as unknown as string;
    } catch (error) {
      this.logger.error(
        `Error fetching pull request diff for ${owner}/${repo}#${pull_number}: ${error}`,
      );
      throw error;
    }
  }
}
