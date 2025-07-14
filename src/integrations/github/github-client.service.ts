/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IPullRequestFile } from '../../utils/interfaces';
import { GITHUB_API_URLS } from '../../utils/constants';

@Injectable()
export class GithubClientService {
  private readonly logger: Logger = new Logger(GithubClientService.name);
  constructor() {}
  private readonly github = axios.create({
    baseURL: GITHUB_API_URLS.BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  /**
   *
   * @param owner name of the repo owner
   * @param repo name of the repo
   * @param prNumber pull request number
   * @returns the array of github files which has code differences
   */
  async getPullRequestFiles(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<IPullRequestFile[]> {
    try {
      this.logger.log(
        `calling the github api to get pr files for owner: ${owner}, repo: ${repo} and prNumber: ${prNumber}`,
      );
      const res = await this.github.get<IPullRequestFile[]>(
        `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      );
      return res.data;
    } catch (error) {
      this.logger.error(`Error while calling the github API: error: ${error}`);
      throw error;
    }
  }

  async createReviewComment(
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
    path: string,
    position: number,
    commitId: string, // Optional: if you want to target a specific commit
  ) {
    try {
      this.logger.log(
        `Posting review comment to PR #${pullNumber} on ${owner}/${repo} at ${path} (position ${position})`,
      );
      const res = await this.github.post(
        `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
        {
          body,
          commit_id: commitId, // Optional: set if you want to target a specific commit
          path,
          position,
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res.data;
    } catch (error) {
      this.logger.error(`Error posting review comment: ${error}`);
      throw error;
    }
  }
}
