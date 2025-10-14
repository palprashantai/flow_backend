import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { logger } from 'middlewares/logger.middleware'

@Injectable()
export class PortfolioDetailReposistory {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getServiceBySlug(slug: string) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select('s.*')
        .from('tbl_services', 's')
        .where('s.service_slug = :slug', { slug })
        .andWhere('s.isdelete = 0')
        .andWhere('s.service_type = 1')
        .getRawOne()
    } catch (error) {
      logger.error('Error fetching service by slug:', error)
      throw error
    }
  }

  async getActiveSubscription(subscriberId: number, serviceId: number) {
    try {
      // Try to get an Active subscription
      const [activeRow] = await this.dataSource.query(
        `
      SELECT 
        t1.id AS id,
        t1.subscriptionid,
        t1.status,
        t1.invest_status
      FROM tbl_subscription AS t1
      WHERE 
        t1.subscriberid = ? 
        AND t1.serviceid = ? 
        AND t1.isdelete = 0
        AND t1.status = 'Active'
      ORDER BY t1.id DESC 
      LIMIT 1
      `,
        [subscriberId, serviceId]
      )

      if (activeRow) {
        return {
          subscriptionid: activeRow.subscriptionid,
          is_subscribed: true,
          is_expired: false,
          invest_status: {
            code: activeRow.invest_status,
            message: this.getInvestMessage(activeRow.invest_status),
          },
        }
      }

      // If no Active subscription, check for Expired
      const [expiredRow] = await this.dataSource.query(
        `
      SELECT 
        t1.id AS id,
        t1.subscriptionid,
        t1.status,
        t1.invest_status
      FROM tbl_subscription AS t1
      WHERE 
        t1.subscriberid = ? 
        AND t1.serviceid = ? 
        AND t1.isdelete = 0
        AND t1.status = 'Expired'
      ORDER BY t1.id DESC 
      LIMIT 1
      `,
        [subscriberId, serviceId]
      )

      if (expiredRow) {
        return {
          subscriptionid: expiredRow.subscriptionid,
          is_subscribed: true,
          is_expired: true,
          invest_status: {
            code: expiredRow.invest_status,
            message: this.getInvestMessage(expiredRow.invest_status),
          },
        }
      }

      // No subscription found
      return { subscriptionid: null, is_subscribed: false, is_expired: false }
    } catch (error) {
      logger.error('Error fetching active subscription:', error)
      throw error
    }
  }

  private getInvestMessage(status: number): string {
    switch (status) {
      case 0:
        return 'Successfully Subscribed'
      case 1:
        return 'Successfully Invested'
      case 2:
        return 'Rebalance Required'
      case 3:
        return 'Rebalanced Successfully'
      default:
        return 'Unknown'
    }
  }

  async getPortfolioData(serviceId: number) {
    try {
      return await this.dataSource.query(
        `SELECT id, stocks, weightage, portfolio_segment, asset_class 
         FROM tbl_portfolio 
         WHERE serviceid = ? AND isdelete = 0`,
        [serviceId]
      )
    } catch (error) {
      logger.error('Error fetching portfolio data:', error)
      throw error
    }
  }
  async getCheapestPlan(serviceId: number) {
    try {
      return await this.dataSource.query(
        `SELECT id, credits, credits_price, access_price_monthly, freepaid, stype 
       FROM tbl_services_sub 
       WHERE sid = ? AND device_type = 0 AND isdelete = 0 
       ORDER BY access_price_monthly ASC 
       LIMIT 1`,
        [serviceId]
      )
    } catch (error) {
      logger.error('Error fetching cheapest plan:', error)
      throw error
    }
  }

  async getResearchCredits(serviceId: number): Promise<
    {
      id: number
      credits: number
      credits_price: number
      freepaid: number
      stype: number
      planId: number
      discount_code: string | null
      discount_price: number | null
      discount_price_monthly: number | null
    }[]
  > {
    try {
      return await this.dataSource.query(
        `SELECT id, credits, credits_price, freepaid, stype, productid AS planId,
              discount_code, discount_price, discount_price_monthly
       FROM tbl_services_sub
       WHERE sid = ? AND device_type = 0 AND isdelete = 0`,
        [serviceId]
      )
    } catch (error) {
      logger.error('Error fetching research credits:', error)
      throw error
    }
  }

  async getOtherServices(serviceId: number) {
    try {
      return await this.dataSource.query(
        `SELECT * FROM tbl_services
         WHERE isdelete = 0 AND service_type = 1 AND id != ?
         ORDER BY id
         LIMIT 2`,
        [serviceId]
      )
    } catch (error) {
      logger.error('Error fetching other services:', error)
      throw error
    }
  }

  async getPortfolioRebalance(userId: number, serviceid: number) {
    try {
      if (!serviceid) {
        return { success: false, message: 'Please Enter Service ID' }
      }

      // // 1️⃣ Fetch subscriber
      // const [subscriber] = await this.dataSource.query(
      //   `SELECT id, fullname, mobileno, email, subscriberid, language, address, state
      //  FROM tbl_subscriber
      //  WHERE isdelete = 0 AND id = ?`,
      //   [userId]
      // )

      // if (!subscriber) {
      //   return { success: false, message: 'Subscriber not found' }
      // }

      // 2️⃣ Check active subscription
      const [subscription] = await this.dataSource.query(
        `SELECT id, broker FROM tbl_subscription
       WHERE isdelete = 0 AND subscriberid = ? AND serviceid = ? AND status = 'Active'`,
        [userId, serviceid]
      )

      if (!subscription) {
        return { success: false, message: 'No Active Subscription Found' }
      }

      // 3️⃣ Fetch latest portfolio and subscriber holdings
      const [latestPortfolio, subscriberHoldings] = await Promise.all([
        this.dataSource.query(`SELECT * FROM tbl_portfolio WHERE serviceid = ?`, [serviceid]),
        this.dataSource.query(`SELECT * FROM tbl_subscriber_portfolio WHERE subscriberid = ? AND serviceid = ?`, [userId, serviceid]),
      ])

      // 4️⃣ Map subscriber holdings
      const holdingsMap = new Map()
      for (const h of subscriberHoldings) {
        holdingsMap.set(String(h.instrument_token).trim(), h)
      }

      const securities = []
      for (const row of latestPortfolio) {
        const token = String(row.instrument_token).trim()
        const holding = holdingsMap.get(token)

        if (row.isdelete === 1 && holding) {
          securities.push({
            ticker: row.stocks,
            weightage: parseFloat(row.weightage),
            quantity: parseInt(holding.quantity),
            price: parseFloat(row.price),
            type: 'SELL',
          })
        } else if (row.isdelete === 0 && !holding) {
          securities.push({
            ticker: row.stocks,
            weightage: parseFloat(row.weightage),
            quantity: parseInt(row.quantity),
            price: parseFloat(row.price),
            instrument_token: token,
            type: 'BUY',
          })
        }
      }

      return {
        success: true,
        message: 'Rebalance instructions generated',
        result: {
          securities,
          broker: subscription.broker,
          dos: ['Rebalance your portfolio as per updated strategy', 'Sell exited stocks to avoid underperformance'],
          donts: ['Avoid skipping rebalancing – it impacts performance'],
        },
      }
    } catch (error) {
      console.error('Error in getPortfolioRebalance:', error)
      return {
        success: false,
        message: 'Internal Server Error',
        error: error?.message || error,
      }
    }
  }

  async getRebalanceTimeline(serviceId: number) {
    try {
      const rebquery = `
        SELECT 
          DATE_FORMAT(datetime, '%Y-%m-%d %H:%i:%s') as datetime,
          new_add,
          new_sub,
          description
        FROM tbl_rebalance_timeline 
        WHERE serviceid = ?
        ORDER BY id DESC
      `
      return await this.dataSource.query(rebquery, [serviceId])
    } catch (error) {
      logger.error('Error fetching rebalance timeline:', error)
      throw error
    }
  }

  async getAssetClassWeightage(serviceId: number) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select('ac.asset_name', 'name')
        .addSelect('ac.id', 'asset_id')
        .addSelect('sum(p.weightage)', 'value')
        .from('tbl_portfolio', 'p')
        .leftJoin('tbl_asset_class', 'ac', 'p.asset_class = ac.id')
        .where('p.isdelete = :isdelete', { isdelete: 0 })
        .andWhere('p.serviceid = :serviceId', { serviceId })
        .groupBy('p.asset_class')
        .getRawMany()
    } catch (error) {
      logger.error('Error fetching asset class weightage:', error)
      throw error
    }
  }

  async getPortfolioMessages(serviceId: number) {
    try {
      return await this.dataSource
        .createQueryBuilder()
        .select('pm.id', 'id')
        .addSelect('pm.heading', 'heading')
        .addSelect('pm.message', 'message')
        .addSelect('pm.created_by', 'created_by')
        .addSelect('pm.file', 'file')
        .addSelect('pm.created_on', 'created_on')
        .from('tbl_portfolio_messages', 'pm')
        .where('pm.service_id = :serviceId', { serviceId })
        .andWhere('pm.isdelete = 0')
        .orderBy('pm.id', 'DESC')
        .getRawMany()
    } catch (error) {
      logger.error('Error fetching portfolio messages:', error)
      throw error
    }
  }

  // Helper methods
  async buildMethodologyHTML(json: string): Promise<string> {
    let html = ''
    try {
      const parsed = JSON.parse(json)
      const sections = [
        { key: 'defining_the_universe', title: 'Defining the Universe' },
        { key: 'research', title: 'Research' },
        { key: 'constituent_screening', title: 'Constituent Screening' },
        { key: 'weighting', title: 'Weighting' },
        { key: 'rebalance', title: 'Rebalance' },
        { key: 'asset_allocation', title: 'Asset Allocation' },
      ]
      for (const { key, title } of sections) {
        if (parsed[key]) {
          html += `<h4 style="font-size:1rem; font-weight:bold;">${title}</h4>${parsed[key]}`
        }
      }
    } catch (error) {
      logger.error('Error building methodology HTML:', error)
      html = ''
    }
    return html
  }

  async buildSegmentCompositionNew(portfolioData: any[]) {
    try {
      const baseColor = '#2367F4'

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

      // Group stocks by sector
      const sectorMap = new Map<string, { sector: string; value: number; stocks: { name: string; value: number }[] }>()

      for (const item of portfolioData) {
        const sector = item.portfolio_segment || 'Unknown'
        const stockName = item.stocks
        const weight = item.weightage || 0

        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, { sector, value: 0, stocks: [] })
        }

        const sectorData = sectorMap.get(sector)!
        sectorData.value += weight
        sectorData.stocks.push({ name: stockName, value: weight })
      }

      const sectors = Array.from(sectorMap.values())

      // Find max value for color calculation
      const maxValue = Math.max(...sectors.map((s) => s.value))

      // Assign colors with variation
      return sectors.map((sectorData, idx) => {
        const baseFactor = 1 - sectorData.value / maxValue
        const variation = (idx * 0.1) % 0.3
        const factor = Math.min(1, baseFactor + variation)

        return {
          sector: sectorData.sector,
          value: Math.round(sectorData.value * 100) / 100, // round to 2 decimals
          color: lightenColor(baseColor, factor),
          stocks: sectorData.stocks,
        }
      })
    } catch (error) {
      logger.error('Error building segment composition:', error)
      throw error
    }
  }
}
