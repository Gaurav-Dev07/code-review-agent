import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubClientService } from './github-client.service';

@Module({
  providers: [GithubService, GithubClientService],
  exports: [GithubService, GithubClientService],
})
export class GithubModule {}
