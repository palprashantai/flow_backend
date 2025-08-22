// ticket-category.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common'

import {
  getAllInsight,
  getAvailableFiltersForPortfolio,
  getFilteredPortfolios,
  getMarketToday,
  getStreetFolios,
} from './portfolio.reposistory'
import { logger } from 'middlewares/logger.middleware'
import { FilterPortfolioDto } from './portfolio.dto'

@Injectable()
export class PortfolioService {
  private readonly logger = logger

  constructor() {}

  async getHomeData(userId: number): Promise<any> {
    try {
      const results = await Promise.allSettled([
        getMarketToday(),
        getStreetFolios(userId),
        getAllInsight(),

        // you can add more parallel calls here later
      ])

      // Extract results safely
      const [marketTodayResult, streetFoliosResult, allInsightResult] = results

      const marketToday = marketTodayResult.status === 'fulfilled' ? marketTodayResult.value : []
      const streetFolios = streetFoliosResult.status === 'fulfilled' ? streetFoliosResult.value : []
      const allInsights = allInsightResult.status === 'fulfilled' ? allInsightResult.value : []

      return {
        marketToday,
        streetFolios,
        allInsights,
        // add other results here when you add more calls
      }
    } catch (error) {
      this.logger.error('Home data fetch error:', error)
      throw new InternalServerErrorException('Failed to fetch home data')
    }
  }

  async getFilteredPortfolios(filterDto: FilterPortfolioDto, userId?: number) {
    try {
      const [portfoliosResult, filtersResult] = await Promise.allSettled([
        getFilteredPortfolios(filterDto, userId),
        getAvailableFiltersForPortfolio(),
      ])

      const portfolios = portfoliosResult.status === 'fulfilled' ? portfoliosResult.value : []
      const availableFilters = filtersResult.status === 'fulfilled' ? filtersResult.value : {}

      return { portfolios, availableFilters }
    } catch (error) {
      logger.error('🔴 Error in getFilteredPortfolios:', error)
      throw new InternalServerErrorException('Failed to fetch portfolios')
    }
  }
}
