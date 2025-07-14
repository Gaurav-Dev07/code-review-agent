import { Module } from '@nestjs/common';
import { GithubCodeReviewController } from './controller/code-review.controller';
import { CodeRevieService } from './providers/code-review.service';
import { GithubModule } from 'src/integrations/github/github.module';
import { PromptModule } from 'src/prompt/prompt.module';
import { OpenAPIModule } from 'src/integrations/open-api/open-api.module';

@Module({
  imports: [GithubModule, PromptModule, OpenAPIModule],
  providers: [CodeRevieService],
  controllers: [GithubCodeReviewController],
})
export class CodeReviewModule {}
