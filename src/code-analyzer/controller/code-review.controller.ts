import { Body, Controller, Logger, Post, Req, Version } from '@nestjs/common';
import {
  CODE_REVIEW_CONTROLLER_BASE_ROUTE,
  GITHUB_CODE_REVIEW_ROUTE,
} from '../../utils/constants';
import { CodeRevieService } from '../providers/code-review.service';
import { PullRequestEvent } from '@octokit/webhooks-types';

@Controller(CODE_REVIEW_CONTROLLER_BASE_ROUTE)
export class GithubCodeReviewController {
  private readonly logger: Logger = new Logger(GithubCodeReviewController.name);
  constructor(private readonly codeReviewService: CodeRevieService) {}
  @Post(GITHUB_CODE_REVIEW_ROUTE)
  @Version('1')
  async reviewPullRequest(@Body() payload: PullRequestEvent) {
    await this.codeReviewService.reviewPullRequestCode(payload);
    return;
  }
}
