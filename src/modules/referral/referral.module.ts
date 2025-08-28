import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReferralService } from './referral.service'
import { ReferralController } from './referral.controller'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
