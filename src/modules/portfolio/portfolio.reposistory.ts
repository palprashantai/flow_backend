import { InternalServerErrorException } from '@nestjs/common'
import { dataSource } from 'databases/data-source'
import { logger } from 'middlewares/logger.middleware'
import { FilterPortfolioDto, StreetFolioCard } from './portfolio.dto'

import dayjs from 'dayjs'

// 🔹 Small helper for description cleanup
function sanitizeDescription(text: string | null): string {
  if (!text) return ''
  return text.replace(/<\/?[^>]+(>|$)/g, '').trim() // strip HTML if needed
}

export async function getUserType(userId?: number) {
  try {
    if (!userId) {
      return {
        userType: 'first_time',
        hasActiveSubscription: false,
        hasExpiredSubscription: false,
      }
    }

    const ds = await dataSource

    const subscriptions = await ds
      .createQueryBuilder()
      .select([
        'COUNT(CASE WHEN expiry_date > NOW() THEN 1 END) AS activeCount',
        'COUNT(CASE WHEN expiry_date <= NOW() THEN 1 END) AS expiredCount',
      ])
      .from('tbl_subscription', 'us')
      .where('us.subscriberid = :userId', { userId })
      .getRawOne()

    const hasActiveSubscription = parseInt(subscriptions.activeCount) > 0
    const hasExpiredSubscription = parseInt(subscriptions.expiredCount) > 0

    let userType: 'first_time' | 'subscriber' | 'expired'
    if (hasActiveSubscription) {
      userType = 'subscriber'
    } else if (hasExpiredSubscription) {
      userType = 'expired'
    } else {
      userType = 'first_time'
    }

    return {
      userType,
      hasActiveSubscription,
      hasExpiredSubscription,
    }
  } catch (error) {
    logger.error('🔴 Error in getUserStatus:', error)
    throw new InternalServerErrorException('Failed to fetch user status')
  }
}

// 🔹 Market data
export async function getMarketToday() {
  try {
    const ds = await dataSource

    const rows = await ds
      .createQueryBuilder()
      .select(['i.symbol AS instrument', 'i.price AS value', 'i.diff_amt AS priceChange', 'i.diff_per AS changePercent'])
      .from('tbl_indices', 'i')
      .where('i.symbol = :symbol', { symbol: 'NIFTY 50' })
      .orderBy('i.id', 'ASC')
      .getRawMany()

    return rows.map((row) => {
      const value = parseFloat(row.value)
      const change = parseFloat(row.priceChange)
      const changePercent = parseFloat(row.changePercent)

      let marketMode: 'Bullish' | 'Bearish' | 'Neutral'
      if (change > 0) {
        marketMode = 'Bullish'
      } else if (change < 0) {
        marketMode = 'Bearish'
      } else {
        marketMode = 'Neutral'
      }

      return {
        instrument: row.instrument,
        value,
        change,
        changePercent,
        marketMode,
      }
    })
  } catch (error) {
    logger.error('🔴 Error in getMarketToday:', error)
    throw new InternalServerErrorException('Failed to fetch market data')
  }
}

export async function getStreetFolios(userId?: number) {
  try {
    const ds = await dataSource

    // Base select
    const baseSelect = [
      's.id AS id',
      's.service_name AS name',
      's.volatility AS volatility',
      's.service_slug AS service_slug',
      's.service_image AS service_image',
      's.description AS description',
      's.traderisk AS riskTag',
      's.cagr AS returnValue',
      's.min_investment AS minInvestment',
      's.subscription_count AS peopleInvestedLast30Days',
      's.updated_on AS lastUpdated',
      's.access_price AS getAccessPrice',
      's.is_free AS isFree',
    ]

    if (userId) {
      baseSelect.push(
        `CASE 
           WHEN us.id IS NOT NULL AND us.expiry_date > NOW() THEN 'active'
           WHEN us.id IS NOT NULL AND us.expiry_date <= NOW() THEN 'expired'
           ELSE 'none' 
         END AS subscriptionStatus`
      )
    }

    const baseQuery = ds
      .createQueryBuilder()
      .select(baseSelect)
      .from('tbl_services', 's')
      .where('s.isdelete = 0 AND s.service_type = 1 AND s.activate = 1')

    if (userId) {
      baseQuery.leftJoin('tbl_subscription', 'us', 'us.serviceid = s.id AND us.subscriberid = :userId', { userId })
    }

    // === Query builders ===
    const buildTrendingQuery = () => baseQuery.clone().orderBy('s.subscription_count', 'DESC').limit(3).getRawMany()

    const buildFreeQuery = () => baseQuery.clone().andWhere('s.is_free = 1').orderBy('s.created_on', 'DESC').limit(5).getRawMany()

    const buildUserStreetFoliosQuery = () =>
      baseQuery
        .clone()
        .andWhere('us.subscriberid = :userId', { userId })
        .andWhere('us.expiry_date > NOW()')
        .orderBy('us.created_on', 'DESC')
        .getRawMany()

    const buildExpiredStreetFoliosQuery = () =>
      baseQuery
        .clone()
        .andWhere('us.subscriberid = :userId', { userId })
        .andWhere('us.expiry_date <= NOW()')
        .orderBy('us.expiry_date', 'DESC')
        .limit(10)
        .getRawMany()

    const buildLatestRebalanceQuery = () =>
      baseQuery.clone().andWhere('s.last_rebalance_date IS NOT NULL').orderBy('s.last_rebalance_date', 'DESC').limit(5).getRawMany()

    // === Step 1: detect user type ===
    let yourStreetFolios: any[] = []
    let expiredStreetFolios: any[] = []

    if (userId) {
      yourStreetFolios = await buildUserStreetFoliosQuery()
      expiredStreetFolios = await buildExpiredStreetFoliosQuery()
    }

    const userType = determineUserType(yourStreetFolios, expiredStreetFolios)

    // === Step 2: fetch only needed sections ===
    let trending: any[] = []
    let freeToInvest: any[] = []
    let latestRebalance: any[] = []

    if (userType === 'first_time') {
      trending = await buildTrendingQuery()
      freeToInvest = await buildFreeQuery()
    } else if (userType === 'subscriber' || userType === 'expired') {
      latestRebalance = await buildLatestRebalanceQuery()
    }

    // === Transformer ===
    const transform = (item: any, userId?: number): StreetFolioCard => ({
      id: item.id,
      name: item.name,
      volatility: item.volatility,
      serviceSlug: item.service_slug,
      serviceImage: item.service_image,
      description: sanitizeDescription(item.description),
      riskTag: item.riskTag,
      return: { period: '1Y CAGR', value: parseFloat(item.returnValue || 0) },
      minInvestment: parseInt(item.minInvestment || 0),
      peopleInvestedLast30Days: parseInt(item.peopleInvestedLast30Days || 0),
      lastUpdated: new Date(item.lastUpdated),
      getAccessPrice: item.getAccessPrice ? parseFloat(item.getAccessPrice) : undefined,
      isFree: Boolean(item.isFree),
      subscriptionStatus: item.subscriptionStatus as 'none' | 'active' | 'expired',
      ctaText: getCTAText(item, userId),
    })

    // === Step 3: return only required response ===
    switch (userType) {
      case 'first_time':
        return {
          userType,
          trending: trending.map((i) => transform(i, userId)),
          freeToInvest: freeToInvest.map((i) => transform(i, userId)),
        }
      case 'subscriber':
        return {
          userType,
          yourStreetFolios: yourStreetFolios.map((i) => transform(i, userId)),
          latestRebalance: latestRebalance.map((i) => transform(i, userId)),
        }
      case 'expired':
        return {
          userType,
          expiredStreetFolios: expiredStreetFolios.map((i) => transform(i, userId)),
          latestRebalance: latestRebalance.map((i) => transform(i, userId)),
        }
    }
  } catch (error) {
    logger.error('🔴 Error in getStreetFolios:', error)
    throw new InternalServerErrorException('Failed to fetch streetfolios')
  }
}

// --- Helpers ---
function determineUserType(
  yourStreetFolios: StreetFolioCard[],
  expiredStreetFolios: StreetFolioCard[]
): 'first_time' | 'subscriber' | 'expired' {
  if (yourStreetFolios.length > 0) return 'subscriber'
  if (expiredStreetFolios.length > 0) return 'expired'
  return 'first_time'
}

function getCTAText(item: any, userId?: number): string {
  if (userId && item.subscriptionActive) return 'Invested'
  if (userId && item.subscriptionExpired) return 'Renew'
  if (item.isFree) return 'Start Free'
  return 'Subscribe'
}

export async function getAllInsight(): Promise<any[]> {
  try {
    const ds = await dataSource
    return await ds.createQueryBuilder().select('*').from('tbl_insights', 'insight').orderBy('insight.insightId', 'DESC').getRawMany()
  } catch (error) {
    logger.error('🔴 Error in getAllInsight:', error)
    throw new InternalServerErrorException('Failed to fetch insights')
  }
}

/**
 * Fetches portfolios based on various filters.
 *
 * @param {FilterPortfolioDto} filterDto - DTO containing filter criteria.
 * @param {number} [userId] - Optional user ID for personalized data.
 * @returns {Promise<any[]>} A list of filtered portfolios.
 * @throws {InternalServerErrorException} If the query fails.
 */
// export async function getFilteredPortfolios(filterDto: FilterPortfolioDto, userId?: number) {
//   try {
//     const ds = await dataSource

//     const { search, page = 1, limit = 10, subscriptionType, investmentAmount, returns, cagr, volatility, investmentStrategy } = filterDto

//     const baseSelect = [
//       's.id AS id',
//       's.service_name AS name',
//       's.volatility AS volatility',
//       's.service_slug AS serviceSlug',
//       's.service_image AS serviceImage',
//       's.description AS description',
//       's.traderisk AS riskTag',
//       's.cagr AS returnValue',
//       's.min_investment AS minInvestment',
//       's.subscription_count AS peopleInvestedLast30Days',
//       's.updated_on AS lastUpdated',
//       's.access_price AS getAccessPrice',
//       's.is_free AS isFree',
//     ]

//     if (userId) {
//       baseSelect.push(
//         `CASE WHEN us.id IS NOT NULL AND us.expiry_date > NOW() THEN 1 ELSE 0 END AS subscriptionActive`,
//         `CASE WHEN us.id IS NOT NULL AND us.expiry_date <= NOW() THEN 1 ELSE 0 END AS subscriptionExpired`
//       )
//     }

//     let query = ds
//       .createQueryBuilder()
//       .select(baseSelect)
//       .from('tbl_services', 's')
//       .where('s.isdelete = 0 AND s.service_type = 1 AND s.activate = 1')

//     if (userId) {
//       query.leftJoin('tbl_subscription', 'us', 'us.serviceid = s.id AND us.subscriberid = :userId', { userId })
//     }

//     // === Filters ===
//     if (search) {
//       query.andWhere('(s.service_name LIKE :search OR s.description LIKE :search)', {
//         search: `%${search}%`,
//       })
//     }

//     if (subscriptionType?.length) {
//       if (subscriptionType.includes('Free')) query.andWhere('s.is_free = 1')
//       if (subscriptionType.includes('Paid')) query.andWhere('s.is_free = 0')
//     }

//     if (volatility?.length) {
//       query.andWhere('s.volatility IN (:...volatility)', { volatility })
//     }

//     if (investmentStrategy?.length) {
//       query.innerJoin('tbl_service_segment', 'ss', 'ss.serviceid = s.id')
//       query.andWhere('ss.segmentid IN (:...investmentStrategy)', { investmentStrategy })
//     }

//     if (returns?.length) {
//       query.andWhere('s.investment_period IN (:...returns)', { returns })
//     }

//     // Sorting filters
//     if (cagr?.includes('HighToLow')) query.orderBy('s.cagr', 'DESC')
//     else if (cagr?.includes('LowToHigh')) query.orderBy('s.cagr', 'ASC')

//     if (investmentAmount?.includes('LowToHigh')) query.orderBy('s.min_investment', 'ASC')
//     else if (investmentAmount?.includes('HighToLow')) query.orderBy('s.min_investment', 'DESC')

//     // Pagination
//     query.skip((page - 1) * limit).take(limit)

//     const rows = await query.getRawMany()

//     // === Transformer ===
//     return rows.map((item: any) => ({
//       id: item.id,
//       name: item.name,
//       volatility: item.volatility,
//       serviceSlug: item.serviceSlug,
//       serviceImage: item.serviceImage,
//       description: item.description,
//       riskTag: item.riskTag,
//       return: { period: '1Y CAGR', value: parseFloat(item.returnValue || 0) },
//       minInvestment: parseInt(item.minInvestment || 0),
//       peopleInvestedLast30Days: parseInt(item.peopleInvestedLast30Days || 0),
//       lastUpdated: new Date(item.lastUpdated),
//       getAccessPrice: item.getAccessPrice ? parseFloat(item.getAccessPrice) : undefined,
//       isFree: Boolean(item.isFree),
//       subscriptionActive: Boolean(item.subscriptionActive),
//       subscriptionExpired: Boolean(item.subscriptionExpired),
//     }))
//   } catch (error) {
//     logger.error('🔴 Error in getFilteredPortfolios:', error)
//     throw new InternalServerErrorException('Failed to fetch portfolios')
//   }
// }

export async function getFilteredPortfolios(filterDto: FilterPortfolioDto, userId?: number) {
  try {
    const ds = await dataSource
    const {
      search,
      page = 1,
      limit = 10,
      subscriptionType,
      investmentAmount,
      returns,
      cagr,
      volatility,
      investmentStrategy,
      userType,
      latest_rebalance,
    } = filterDto

    const baseSelect = [
      's.id AS id',
      's.service_name AS name',
      's.volatility AS volatility',
      's.service_slug AS serviceSlug',
      's.service_image AS serviceImage',
      's.description AS description',
      's.traderisk AS riskTag',
      's.cagr AS returnValue',
      's.min_investment AS minInvestment',
      's.subscription_count AS peopleInvestedLast30Days',
      's.updated_on AS lastUpdated',
      's.access_price AS getAccessPrice',
      's.is_free AS isFree',
    ]

    // ✅ Declare query FIRST
    let query = ds
      .createQueryBuilder()
      .select(baseSelect)
      .from('tbl_services', 's')
      .where('s.isdelete = 0 AND s.service_type = 1 AND s.activate = 1')

    // ✅ Add JOIN and subscription fields conditionally
    if (userId && userType && userType !== 'first_time') {
      query.leftJoin('tbl_subscription', 'us', 'us.serviceid = s.id AND us.subscriberid = :userId', { userId })

      baseSelect.push(
        `CASE WHEN us.id IS NOT NULL AND us.expiry_date > NOW() THEN 1 ELSE 0 END AS subscriptionActive`,
        `CASE WHEN us.id IS NOT NULL AND us.expiry_date <= NOW() THEN 1 ELSE 0 END AS subscriptionExpired`
      )
    }

    // === UserType filters
    if (userId && userType) {
      switch (userType) {
        case 'subscriber':
          query.andWhere('us.expiry_date > NOW()')
          break
        case 'expired':
          query.andWhere('us.expiry_date <= NOW() AND us.id IS NOT NULL')
          break
        case 'first_time':
          query.orderBy('s.subscription_count', 'DESC').limit(5)
          break
      }
    }

    // === Search
    if (search) {
      query.andWhere('(s.service_name LIKE :search OR s.description LIKE :search)', {
        search: `%${search}%`,
      })
    }

    // === Latest Rebalance
    if (latest_rebalance) {
      query.andWhere('s.last_rebalance_date IS NOT NULL')
      query.orderBy('s.last_rebalance_date', 'DESC').limit(5)
    }

    // === Subscription Type
    if (subscriptionType?.length) {
      const subs = []
      if (subscriptionType.includes('Free')) subs.push('s.is_free = 1')
      if (subscriptionType.includes('Paid')) subs.push('s.is_free = 0')
      if (subs.length) query.andWhere(`(${subs.join(' OR ')})`)
    }

    // === Volatility
    if (volatility?.length) query.andWhere('s.volatility IN (:...volatility)', { volatility })

    // === Investment Strategy
    if (investmentStrategy?.length) {
      query.innerJoin('tbl_service_segment', 'ss', 'ss.serviceid = s.id')
      query.andWhere('ss.segmentid IN (:...investmentStrategy)', { investmentStrategy })
    }

    // === Returns
    if (returns?.length) query.andWhere('s.investment_period IN (:...returns)', { returns })

    // === Sorting
    if (!latest_rebalance && !userType?.includes('first_time')) {
      if (cagr?.includes('HighToLow')) query.addOrderBy('s.cagr', 'DESC')
      else if (cagr?.includes('LowToHigh')) query.addOrderBy('s.cagr', 'ASC')

      if (investmentAmount?.includes('LowToHigh')) query.addOrderBy('s.min_investment', 'ASC')
      else if (investmentAmount?.includes('HighToLow')) query.addOrderBy('s.min_investment', 'DESC')

      if (!cagr?.length && !investmentAmount?.length) query.addOrderBy('s.updated_on', 'DESC')
    }

    // === Pagination
    query.skip((page - 1) * limit).take(limit)

    const rows = await query.getRawMany()

    // === Count Query
    const countQuery = ds
      .createQueryBuilder()
      .from('tbl_services', 's')
      .select('COUNT(DISTINCT s.id)', 'total')
      .where('s.isdelete = 0 AND s.service_type = 1 AND s.activate = 1')

    if (search) {
      countQuery.andWhere('(s.service_name LIKE :search OR s.description LIKE :search)', {
        search: `%${search}%`,
      })
    }
    if (volatility?.length) countQuery.andWhere('s.volatility IN (:...volatility)', { volatility })
    if (investmentStrategy?.length) {
      countQuery.innerJoin('tbl_service_segment', 'ss', 'ss.serviceid = s.id')
      countQuery.andWhere('ss.segmentid IN (:...investmentStrategy)', { investmentStrategy })
    }
    if (returns?.length) countQuery.andWhere('s.investment_period IN (:...returns)', { returns })
    if (subscriptionType?.length) {
      const subs = []
      if (subscriptionType.includes('Free')) subs.push('s.is_free = 1')
      if (subscriptionType.includes('Paid')) subs.push('s.is_free = 0')
      if (subs.length) countQuery.andWhere(`(${subs.join(' OR ')})`)
    }

    const totalResult = await countQuery.getRawOne()
    const total = parseInt(totalResult?.total || 0, 10)

    // === Transform
    const portfolios = rows.map((item: any) => ({
      id: item.id,
      name: item.name,
      volatility: item.volatility,
      serviceSlug: item.serviceSlug,
      serviceImage: item.serviceImage,
      description: item.description,
      riskTag: item.riskTag,
      return: { period: '1Y CAGR', value: parseFloat(item.returnValue || 0) },
      minInvestment: parseInt(item.minInvestment || 0),
      peopleInvestedLast30Days: parseInt(item.peopleInvestedLast30Days || 0),
      lastUpdated: new Date(item.lastUpdated),
      getAccessPrice: item.getAccessPrice ? parseFloat(item.getAccessPrice) : undefined,
      isFree: item.isFree === 1,
      subscriptionActive: item.subscriptionActive === 1,
      subscriptionExpired: item.subscriptionExpired === 1,
    }))

    return {
      portfolios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      userType: userType || (userId ? 'first_time' : null),
    }
  } catch (error) {
    logger.error('🔴 Error in getFilteredPortfolios:', error)
    throw new InternalServerErrorException('Failed to fetch portfolios')
  }
}

export async function getAvailableFiltersForPortfolio(): Promise<Record<string, any[]>> {
  try {
    const ds = await dataSource

    // === Queries ===
    const volatilityRows = await ds
      .createQueryBuilder()
      .select('DISTINCT s.volatility', 'volatility')
      .from('tbl_services', 's')
      .where('s.volatility IS NOT NULL AND s.volatility != ""')
      .getRawMany()

    const strategyRows = await ds
      .createQueryBuilder()
      .select(['seg.id AS id', 'seg.segment_name AS name'])
      .from('tbl_segment', 'seg')
      .where('seg.segment_name IS NOT NULL AND seg.segment_name != ""')
      .getRawMany()

    const returnsRows = await ds
      .createQueryBuilder()
      .select('DISTINCT s.investment_period', 'investmentPeriod')
      .from('tbl_services', 's')
      .where('s.investment_period IS NOT NULL AND s.investment_period != ""')
      .getRawMany()

    // === Transform ===
    const availableFilters: Record<string, any[]> = {
      volatility: volatilityRows.map((row) => row.volatility).filter((v) => !!v),

      investmentStrategy: strategyRows.filter((row) => row.id && row.name).map((row) => ({ id: row.id, name: row.name })),

      returns: returnsRows.map((row) => row.investmentPeriod).filter((v) => !!v),

      subscriptionType: ['Free', 'Paid'],
      investmentAmount: ['Under ₹ 5,000', 'Under ₹ 25,000', 'Under ₹ 50,000', 'Minimum Amount'],
      cagr: ['HighToLow', 'LowToHigh'],
    }

    return availableFilters
  } catch (error) {
    logger.error('🔴 Error in getAvailableFiltersForPortfolio:', error)
    throw new InternalServerErrorException('Failed to fetch available filters')
  }
}

export async function getAvailableDurationsForPortfolio(serviceId: number): Promise<Record<string, any[]>> {
  try {
    const ds = await dataSource

    // === Query oldest date from history ===
    const result = await ds.query(
      `
      SELECT MIN(sdate) AS oldest_date
      FROM tbl_portfolio_history
      WHERE serviceid = ?
      `,
      [serviceId]
    )

    const durations = [
      { key: '1M', label: '1 Month' },
      { key: '3M', label: '3 Months' },
      { key: '6M', label: '6 Months' },
      { key: '1Y', label: '1 Year' },
      { key: '3Y', label: '3 Years' },
      { key: '5Y', label: '5 Years' },
    ]

    // If no history, only 1M is available
    if (!result[0]?.oldest_date) {
      return { durations: durations.filter((d) => d.key === '1M') }
    }

    const oldestDate = dayjs(result[0].oldest_date)
    const now = dayjs()
    const monthsDiff = now.diff(oldestDate, 'month', true)

    // Mapping keys → months
    const keyToMonths: Record<string, number> = {
      '1M': 1,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
      '3Y': 36,
      '5Y': 60,
    }

    let available = durations.filter((d) => monthsDiff >= keyToMonths[d.key])

    // Always ensure 1M exists
    if (!available.some((d) => d.key === '1M')) {
      available.unshift(durations.find((d) => d.key === '1M')!)
    }

    // Keep original ordering
    available = durations.filter((d) => available.some((a) => a.key === d.key))

    // === Transform ===
    const availableFilters: Record<string, any[]> = {
      durations: available,
    }

    return availableFilters
  } catch (error) {
    logger.error('🔴 Error in getAvailableDurationsForPortfolio:', error)
    throw new InternalServerErrorException('Failed to fetch available durations')
  }
}
