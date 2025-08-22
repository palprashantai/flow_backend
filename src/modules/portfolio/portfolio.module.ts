// setting.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PortfolioService } from './portfolio.service'
import { PortfolioController } from './portfolio.conttroller'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
