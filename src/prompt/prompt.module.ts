import { Module } from '@nestjs/common';
import { PromptService } from './providers/prompt.service';

@Module({
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}
