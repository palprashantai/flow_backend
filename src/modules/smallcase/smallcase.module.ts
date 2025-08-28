import { Module } from '@nestjs/common'
import { SmallcaseService } from './smallcase.service'
import { SmallcaseController } from './smallcase.controller'

@Module({
  controllers: [SmallcaseController],
  providers: [SmallcaseService],
  exports: [SmallcaseService],
})
export class SmallcaseModule {}
