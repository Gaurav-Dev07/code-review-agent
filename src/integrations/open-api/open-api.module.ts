import { Module } from '@nestjs/common';
import { OpenAIService } from './providers/open-api.service';

@Module({
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAPIModule {}
