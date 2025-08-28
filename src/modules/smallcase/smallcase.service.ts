import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import { createAuthToken } from './lib/auth.token'
import { DataSource } from 'typeorm'
import { logger } from 'middlewares/logger.middleware'
import { getUserBy } from 'modules/auth/auth.repository'
import { CreateTransactionDto } from './smallcase.dto'

@Injectable()
export class SmallcaseService {
  private readonly logger = logger
  private readonly gatewayName = process.env.SMALLCASE_GATEWAY_NAME
  private readonly gatewayApiSecret = process.env.SMALLCASE_API_SECRET

  constructor(private readonly dataSource: DataSource) {
    // Validate Smallcase config
    if (!this.gatewayName || !this.gatewayApiSecret) {
      this.logger.error('Missing Smallcase configuration', {
        hasGatewayName: !!this.gatewayName,
        hasGatewaySecret: !!this.gatewayApiSecret,
      })
    } else {
      console.log('Smallcase configuration validated successfully')
    }
  }

  async getLatestTransactionData(): Promise<any> {
    try {
      const record = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('tbl_smallcase_apilog', 'log')
        // .where('log.transactionid = :transactionid', { transactionid })
        .orderBy('log.id', 'DESC')
        .limit(1)
        .getRawOne()

      if (!record) {
        throw new NotFoundException('Transaction not found')
      }

      const webhookData = JSON.parse(record.message)
      return webhookData
    } catch (err) {
      this.logger.error('getTransactionData error:', err)
      throw new InternalServerErrorException('Failed to load transaction')
    }
  }

  async createTransaction(dto: CreateTransactionDto, subscriberid?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    const subscriberDetails = await getUserBy({ id: subscriberid })

    const { intent = 'TRANSACTION', orderConfig } = dto
    const authToken = createAuthToken(subscriberDetails?.authid) // creates guest token if no authId

    try {
      const response = await axios.post(
        `https://gatewayapi.smallcase.com/gateway/${process.env.SMALLCASE_GATEWAY_NAME}/transaction`,
        { intent, orderConfig },
        {
          headers: {
            'x-gateway-secret': process.env.SMALLCASE_API_SECRET as string,
            'x-gateway-authtoken': authToken,
          },
        }
      )
      const transactionId = response.data?.data?.transactionId // adjust to your API response structure
      const serviceId = dto?.serviceId
      const orderType = dto?.ordertype === 1 ? 1 : 0

      if (transactionId && serviceId) {
        await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('tbl_smallcase_order')
          .values({
            transactionid: transactionId,
            serviceid: serviceId,
            subscriberid: subscriberDetails.id || null,
            status: 0,
            broker: null,
            ordertype: orderType,
            created_on: () => 'NOW()',
          })
          .execute()
      }

      return { success: true, data: response.data?.data }
    } catch (error: any) {
      console.warn('Transaction API failed:', error.response?.data || error.message)
      return { success: false, error: error.response?.data || error.message }
    }
  }

  async getToken(userId?: number) {
    let subscriberDetails: any = null

    if (userId) {
      subscriberDetails = await getUserBy({ id: userId })
    }
    // Will create guest token if subscriberDetails?.authid is missing
    const token = createAuthToken(subscriberDetails?.authid)
    return { token }
  }
}
