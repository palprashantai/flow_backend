import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from './common.service'
import { Configuration } from './common.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Configuration])],
  controllers: [],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
