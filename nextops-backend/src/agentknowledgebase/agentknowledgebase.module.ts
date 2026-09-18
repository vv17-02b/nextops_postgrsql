import { Module } from '@nestjs/common';
import { AgentKnowledgeBaseService } from './agentknowledgebase.service';
import { AgentKnowledgeBaseController } from './agentknowledgebase.controller';

@Module({
  controllers: [AgentKnowledgeBaseController],
  providers: [AgentKnowledgeBaseService],
  exports: [AgentKnowledgeBaseService]
})
export class AgentKnowledgeBaseModule {}
