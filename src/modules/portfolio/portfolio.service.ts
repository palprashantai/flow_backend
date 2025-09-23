// ticket-category.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import {
  buildPortfolioHistoryQuery,
  fetchPlansByServiceIdPortfolio,
  // fetchServiceOffers,
  fetchStocksByServiceIdPortfolio,
  getAllInsight,
  getAvailableDurationsForPortfolio,
  getAvailableFiltersForPortfolio,
  getFilteredPortfolios,
  getMarketToday,
  getSegmentNameByServiceId,
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
      const [marketToday = [], userType = null, allInsights = []] = await Promise.all([
        getMarketToday().catch(() => []),
        getUserType(userId).catch(() => null),
        getAllInsight().catch(() => []),
      ])

      return { marketToday, userType, allInsights }
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

      const { portfolios, pagination, userType } =
        portfoliosResult.status === 'fulfilled' ? portfoliosResult.value : { portfolios: [], pagination: {}, userType: null }

      const availableFilters = filtersResult.status === 'fulfilled' ? filtersResult.value : {}

      return { portfolios, userType, availableFilters, pagination }
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
        otherServices,
        rebalanceTimeline,
        portfolioMessages,
        // portfolioHistory,
      ] = await Promise.all([
        this.portfolioDetailReposistory.getPortfolioData(serviceId),
        this.portfolioDetailReposistory.getCheapestPlan(serviceId),
        this.portfolioDetailReposistory.getResearchCredits(serviceId),
        this.portfolioDetailReposistory.getOtherServices(serviceId),
        this.portfolioDetailReposistory.getRebalanceTimeline(serviceId),
        this.portfolioDetailReposistory.getPortfolioMessages(serviceId),
        // this.servicesReposistory.getPortfolioHistory(serviceId),
      ])

      function formatIndianNumber(value: number): string {
        return value.toLocaleString('en-IN')
      }

      const planDetail = planData.length
        ? `${formatIndianNumber(Math.round(planData[0].credits_price / planData[0].credits))} / Month`
        : 'Free'

      const methodology = await this.portfolioDetailReposistory.buildMethodologyHTML(service.methodology)

      const WEB_URL = process.env.WEB_URL || 'https://webapp.streetgains.in/'
      const segmentRow = await getSegmentNameByServiceId(serviceId)
      const segmentName = segmentRow?.segmentName || ''
      const serviceDetails = {
        service_id: serviceId,
        service_name: service.service_name,
        service_image: `${service.service_image}`,
        segment_name: segmentName, // 🔹 added here
        cagr: parseFloat(service.cagr).toFixed(2),
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
        is_rebalance: rebalanceTimeline.length > 0,
        rebalance_timeline_report: service.rebalance_timeline_report || `${WEB_URL}uploads/${service.rebalance_timeline_report}`,
      }

      const researchCredits = (
        researchCreditsData as {
          id: number
          credits: number
          credits_price: number
          freepaid: number
          stype: number
          planId: number
          discount_code: string | null
          discount_price: number | null
        }[]
      ).map((plan) => ({
        id: plan.id,
        planId: plan.planId.toString(),
        title: plan.stype === 0 ? `${plan.credits} Credits` : `${plan.credits} ${plan.credits === 1 ? 'Month' : 'Months'}`,
        price: `₹${Number(plan.credits_price).toFixed(2)}`,
        freepaid: plan.freepaid ? 'Free' : 'Paid',
        discount_code: plan.discount_code ?? null,
        discount_price: plan.discount_price ? `₹${Number(plan.discount_price).toFixed(2)}` : null,
      }))

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

      const relatedServices = await Promise.all(
        otherServices.map(async (row) => {
          // 🔹 Check subscriber subscription status
          const subscriptionStatus = await this.portfolioDetailReposistory.getActiveSubscription(subscriberid, row.id)

          return {
            id: row.id,
            name: row.service_name,
            volatility: row.volatility || '',
            serviceSlug: row.service_slug,
            serviceImage: row.service_image ? `${process.env.WEB_URL || 'https://webapp.streetgains.in/'}uploads/${row.service_image}` : '',
            description: row.service_description || '',
            riskTag: row.risk_tag || '', // requires `risk_tag` field in DB, else empty
            return: {
              period: '1Y CAGR',
              value: row.cagr ? Number(row.cagr) : 0,
            },
            minInvestment: row.min_investment ? Number(row.min_investment) : 0,
            peopleInvestedLast30Days: row.subscription_count ? Number(row.subscription_count) : 0,
            lastUpdated: row.last_rebalance_date,
            getAccessPrice: row.access_price,
            isFree: Boolean(row.is_free),
            subscriptionActive: subscriptionStatus.is_subscribed && !subscriptionStatus.is_expired,
            subscriptionExpired: subscriptionStatus.is_subscribed && subscriptionStatus.is_expired,
          }
        })
      )

      const launchDateEntry = {
        datetime: serviceDetails.launch_date, // or whatever field holds the launch date
        add: '0',
        sub: '0',
        description: 'Portfolio went Live',
      }

      // Build the final timeline array
      const rebalanceTimelineArr = [
        launchDateEntry,
        ...rebalanceTimeline.map((row) => ({
          datetime: row.datetime ? String(row.datetime) : '',
          add: row.new_add !== undefined && row.new_add !== null ? String(row.new_add) : '0',
          sub: row.new_sub !== undefined && row.new_sub !== null ? String(row.new_sub) : '0',
          description: row.description !== undefined && row.description !== null ? String(row.description) : '',
        })),
      ]

      const segmentComposition = await this.portfolioDetailReposistory.buildSegmentCompositionNew(portfolioData)

      const data = {
        cagrInfo: 'Currently showing 1-year CAGR',
        service: serviceDetails,
        portfolioMessages,
        researchCredits,
        segmentComposition,
        holdingsDistribution,
        relatedServices,
        livePerformance: assetIdNameArray,
        availableDurations,
      } as {
        cagrInfo: string
        service: any
        portfolioMessages: any
        researchCredits: any
        segmentComposition: any
        holdingsDistribution: any
        relatedServices: any
        livePerformance: any
        availableDurations: any
        rebalanceTimeline?: any[]
      }

      if (serviceDetails.is_rebalance) {
        data.rebalanceTimeline = rebalanceTimelineArr
      }

      return {
        status: 'success',
        data,
      }
    } catch (error) {
      logger.error('🔴 Error in getServicePortfolio:', error)
      throw new InternalServerErrorException(error.message || 'Internal Server Error')
    }
  }

  async getPortfolioHistoryMerged(serviceId: number, options: { page?: number; limit?: number; duration?: string; assetId?: number }) {
    let { page = 1, limit = 10, duration, assetId } = options
    const offset = (page - 1) * limit

    // ✅ Get query from helper
    const { rows, total } = await buildPortfolioHistoryQuery(serviceId, {
      duration,
      assetId,
      limit,
      offset,
    })

    const items = rows.map((row: any) => ({
      sdate: row.sdate,
      portfolio_amount: parseFloat(row.portfolio_amount || 0),
      asset_amount: parseFloat(row.asset_amount || 0),
      asset_id: row.assetid || null,
    }))

    return {
      items,
      total: parseInt(total),
      page,
      limit,
      totalPages: Math.ceil(parseInt(total) / limit),
      filters: {
        serviceId,
        assetId: assetId || null,
        duration: duration || null,
      },
    }
  }

  async getPortfolioPlans(service_id: number) {
    if (!service_id) throw new BadRequestException('Service ID is required.')

    try {
      const plans = await fetchPlansByServiceIdPortfolio(service_id)

      // Fetch service-wide offers only
      // const serviceOffers = await fetchServiceOffers(service_id)

      // No plan-specific offers anymore
      const formattedPlans = plans.map((p: any) => {
        const months = p.credits > 0 ? p.credits : 1
        const price = Number(p.credits_price) || 0
        const discountPrice = Number(p.discount_price) || 0

        return {
          id: p.id,
          planid: p.productid,
          title: `${months} Month${months > 1 ? 's' : ''}`,
          price: price,
          discount_code: p.discount_code ?? null,
          price_per_month: Math.floor(price / months),
          discount_price: discountPrice,
          discount_price_per_month: discountPrice > 0 ? Math.floor(discountPrice / months) : 0,
          offers: [], // ✅ empty since planOffers removed
        }
      })

      return {
        success: true,
        message: 'Plans retrieved successfully',
        result: {
          plans: formattedPlans,
          // service_offers: serviceOffers, // separate service-wide offers
          dos: ['Seamlessly place orders in 1 click', 'Get regular re-balance updates'],
          donts: ['Easily start SIPs for disciplined investing'],
        },
      }
    } catch (err) {
      console.error('Error fetching portfolio plans:', err)
      throw new InternalServerErrorException('Internal Server Error')
    }
  }

  async getPortfolioStocks(service_id: number) {
    if (!service_id) throw new BadRequestException('Service ID is required.')

    try {
      const portfolio = await fetchStocksByServiceIdPortfolio(service_id)

      if (!portfolio.length) {
        throw new NotFoundException('Portfolio not found')
      }

      const formattedPortfolio = portfolio.map((stock) => ({
        name: stock.stocks,
        weight: stock.weightage !== null ? parseFloat(stock.weightage) : null,
        price: stock.price !== null ? parseFloat(stock.price) : null,
        quantity: stock.quantity,
      }))

      const dos = ['Seamlessly place orders in 1 click', 'Get regular re-balance updates']
      const donts = ['Easily start SIPs for disciplined investing']

      return {
        success: true,
        message: 'Portfolio retrieved successfully',
        result: { portfolio: formattedPortfolio, dos, donts },
      }
    } catch (error) {
      console.error('Error fetching portfolio stocks:', error)
      throw new InternalServerErrorException(error.message || 'Internal Server Error')
    }
  }
}
