// setting.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PortfolioService } from './portfolio.service'
import { PortfolioController } from './portfolio.conttroller'
import { PortfolioDetailReposistory } from './portfolio-detail.reposistory'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioDetailReposistory],
  exports: [PortfolioService, PortfolioDetailReposistory],
})
export class PortfolioModule {}
