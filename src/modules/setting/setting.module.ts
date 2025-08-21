// setting.module.ts
import { Module } from '@nestjs/common'
import { SettingService } from './setting.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SettingController } from './setting.conttroller'
import { AppEventLog } from './setting.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AppEventLog])],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
