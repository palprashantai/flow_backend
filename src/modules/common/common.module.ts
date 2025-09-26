import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from './common.service'
import { Configuration } from './common.entity'
import { WorkflowService } from './workflowphp.service'

@Module({
  imports: [TypeOrmModule.forFeature([Configuration])],
  controllers: [],
  providers: [CommonService, WorkflowService],
  exports: [CommonService, WorkflowService],
})
export class CommonModule {}
