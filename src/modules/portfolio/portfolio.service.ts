// ticket-category.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import {
  getAllInsight,
  getAvailableDurationsForPortfolio,
  getAvailableFiltersForPortfolio,
  getFilteredPortfolios,
  getMarketToday,
  getStreetFolios,
  getUserType,
} from './portfolio.reposistory'
import { logger } from 'middlewares/logger.middleware'
import { FilterPortfolioDto } from './portfolio.dto'

import { getUserBy } from 'modules/auth/auth.repository'
import { PortfolioDetailReposistory } from './portfolio-detail.reposistory'

@Injectable()
export class PortfolioService {
  private readonly logger = logger

  constructor(private readonly portfolioDetailReposistory: PortfolioDetailReposistory) {}

  async getHomeData(userId: number): Promise<any> {
    try {
      const results = await Promise.allSettled([getMarketToday(), getUserType(userId), getStreetFolios(userId), getAllInsight()])

      // Extract results safely
      const [marketTodayResult, streetFoliosResult, allInsightResult] = results

      const marketToday = marketTodayResult.status === 'fulfilled' ? marketTodayResult.value : []
      const streetFolios = streetFoliosResult.status === 'fulfilled' ? streetFoliosResult.value : []
      const allInsights = allInsightResult.status === 'fulfilled' ? allInsightResult.value : []
      const userType = streetFoliosResult.status === 'fulfilled' ? streetFoliosResult.value : []

      return {
        marketToday,
        userType,
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

  async getServicePortfolio(slug: string, subscriberid: number): Promise<any> {
    if (!slug) throw new BadRequestException('Slug parameter is required')

    try {
      const service = await this.portfolioDetailReposistory.getServiceBySlug(slug)
      if (!service) throw new NotFoundException('No record found for the given slug')

      const subscriberDetails = await getUserBy({ id: subscriberid })

      if (!subscriberDetails) {
        throw new NotFoundException('Subscriber not found')
      }
      const serviceId = service.id

      const activeSubscription = await this.portfolioDetailReposistory.getActiveSubscription(subscriberDetails.id, serviceId)

      const isExpired = activeSubscription.is_expired
      const isSubscribed = activeSubscription.is_subscribed
      const subscriptionId = activeSubscription.subscriptionid ?? ''
      const availableDurations = await getAvailableDurationsForPortfolio(serviceId)

      const [
        portfolioData,
        planData,
        researchCreditsData,
        segmentsRaw,
        otherServices,
        rebalanceTimeline,
        portfolioMessages,
        // portfolioHistory,
      ] = await Promise.all([
        this.portfolioDetailReposistory.getPortfolioData(serviceId),
        this.portfolioDetailReposistory.getCheapestPlan(serviceId),
        this.portfolioDetailReposistory.getResearchCredits(serviceId),
        this.portfolioDetailReposistory.getSegmentDataRaw(serviceId),
        this.portfolioDetailReposistory.getOtherServices(serviceId),
        this.portfolioDetailReposistory.getRebalanceTimeline(serviceId),
        this.portfolioDetailReposistory.getPortfolioMessages(serviceId),
        // this.servicesReposistory.getPortfolioHistory(serviceId),
      ])

      const planDetail = planData.length
        ? `${planData[0].credits_price} / ${planData[0].credits} ${planData[0].credits === 1 ? 'Month' : 'Months'}`
        : 'Free'

      const methodology = this.portfolioDetailReposistory.buildMethodologyHTML(service.methodology)

      const WEB_URL = process.env.WEB_URL || 'https://webapp.streetgains.in/'

      const serviceDetails = {
        service_id: serviceId,
        service_name: service.service_name,
        service_image: `${service.service_image}`,
        current_nav: service.current_nav,
        cagr: service.cagr,
        cagr_period: '1 Year',
        duration: service.investment_period,
        volatility: service.volatility,
        short_description: service.service_description,
        long_description: service.description,
        factsheet_url: service.factsheet_url,
        methodology,
        stocks_etf_count: portfolioData.length,
        rebalance_frequency: service.rebalance_frequency,
        launch_date: service.launch_date,
        last_rebalance_date: service.last_rebalance_date,
        next_rebalance_date: service.next_rebalance_date,
        plan_detail: planDetail, // planId removed
        minimum_investment: service.min_investment,
        is_subscribed: isSubscribed,
        is_expired: isExpired,
        subscriptionid: subscriptionId,
        subscription_count: service.subscription_count,
        is_free: service.is_free,
        is_rebalance: 1,
        rebalance_timeline_report: service.rebalance_timeline_report || `${WEB_URL}uploads/${service.rebalance_timeline_report}`,
      }

      const serviceMetadata = {
        title: service.seo_title,
        description: service.seo_desc,
        meta_tags: service.meta_tags || '',
        schema_script_addition: service.schema_script_addition || '',
      }

      const researchCredits = (
        researchCreditsData as {
          id: number
          credits: number
          credits_price: number
          freepaid: number
          stype: number
          planId: string
        }[]
      ).map((plan) => ({
        id: plan.id,
        planId: plan.planId,
        title: plan.stype === 0 ? `${plan.credits} Credits` : `${plan.credits} ${plan.credits === 1 ? 'Month' : 'Months'}`,
        price: `₹${Number(plan.credits_price).toFixed(2)}`,
        freepaid: plan.freepaid ? 'Free' : 'Paid',
      }))

      function assignColorsByWeightage(portfolioData: any[]) {
        const baseColor = '#2367F4' // darkest color for max weightage
        const maxWeight = Math.max(...portfolioData.map((p) => p.weightage))

        return portfolioData.map((p, index) => {
          // factor: 0 (darkest) for max weight, closer to 1 for lighter colors
          const baseFactor = 1 - p.weightage / maxWeight
          const variation = (index * 0.1) % 0.3 // ensures uniqueness
          const factor = Math.min(1, baseFactor + variation)

          return {
            id: p.id,
            name: p.stocks,
            value: p.weightage,
            company: p.portfolio_segment,
            color: lightenColor(baseColor, factor),
          }
        })
      }

      function lightenColor(hex: string, factor: number) {
        const num = parseInt(hex.replace('#', ''), 16)
        let r = (num >> 16) + Math.round((255 - (num >> 16)) * factor)
        let g = ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * factor)
        let b = (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * factor)

        r = Math.min(255, r)
        g = Math.min(255, g)
        b = Math.min(255, b)

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      }

      const segmentComposition = assignColorsByWeightage(portfolioData)

      const asset_class = portfolioData.map((item) => item.asset_class).filter(Boolean)

      let holdingsDistribution: { name: any; value: number; color: string }[] = []
      let assetIdNameArray: { asset_id: number; asset_name: string }[] = []

      if (asset_class.length) {
        const raw = await this.portfolioDetailReposistory.getAssetClassWeightage(serviceId)
        assetIdNameArray = raw.map((item) => ({
          asset_id: item.asset_id,
          asset_name: item.name,
        }))

        const baseColor = '#2367F4'
        const maxValue = Math.max(...raw.map((r) => parseInt(r.value, 10)))

        holdingsDistribution = raw.map((item, index) => {
          const baseFactor = 1 - parseInt(item.value) / maxValue
          const variation = (index * 0.1) % 0.3
          const factor = Math.min(1, baseFactor + variation)
          return {
            name: item.name,
            value: parseInt(item.value, 10),
            color: lightenColor(baseColor, factor),
          }
        })
      }

      const aboutManager = [
        {
          image: `${WEB_URL}uploads/about_us/founder.png`,
          name: 'Santhosh Kumar V.',
          descriptions: `<p><b>Santhosh Kumar V</b>, the founder of Streetgains...`,
        },
      ]

      const segmentsData = this.portfolioDetailReposistory.buildSegmentData(segmentsRaw)

      const relatedServices = otherServices.map((row) => ({
        id: row.id,
        service_name: row.service_name,
        service_slug: row.service_slug,
        image: row.service_image,
        description: row.service_description,
        is_free: row.is_free,
        last_updated: row.last_rebalance_date,
        subscription_count: row.subscription_count,
        volatility: row.volatility,
        cagr: row.cagr,
        min_investment: row.min_investment,
        limited_slot: 1,
      }))

      const rebalanceTimelineArr = rebalanceTimeline.map((row) => ({
        datetime: row.datetime ? String(row.datetime) : '',
        add: row.new_add !== undefined && row.new_add !== null ? String(row.new_add) : '0',
        sub: row.new_sub !== undefined && row.new_sub !== null ? String(row.new_sub) : '0',
        description: row.description !== undefined && row.description !== null ? String(row.description) : '',
      }))

      const segmentCompositionNew = this.portfolioDetailReposistory.buildSegmentCompositionNew(portfolioData)

      return {
        status: 'success',
        data: {
          cagrInfo: 'Currently showing 1-year CAGR',
          service: serviceDetails,
          // portfolioHistory,
          Metadata: serviceMetadata,
          portfolioMessages,
          researchCredits,
          segmentComposition,
          holdingsDistribution,
          aboutManager,
          segmentsData,
          relatedServices,
          rebalanceTimeline: rebalanceTimelineArr,
          segmentCompositionNew,
          livePerformance: assetIdNameArray, // ✅ now added
          availableDurations,
        },
      }
    } catch (error) {
      logger.error('🔴 Error in getServicePortfolio:', error)
      throw new InternalServerErrorException(error.message || 'Internal Server Error')
    }
  }
}
