import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CodeReviewModule } from './code-analyzer/code-review.module';
import { OctokitModule } from 'nestjs-octokit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OctokitModule.forRoot({
      isGlobal: true, // Makes OctokitService available globally
      octokitOptions: {
        auth: process.env.GITHUB_TOKEN, // Replace with your actual GitHub token
      },
    }),
    CodeReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
