import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, UnauthorizedException } from '@nestjs/common'
import axios from 'axios'
import * as jwt from 'jsonwebtoken'
import { createAuthToken } from './lib/auth.token'
import { DataSource } from 'typeorm'
import { logger } from 'middlewares/logger.middleware'
import { getUserBy } from 'modules/auth/auth.repository'
import {
  ConnectTransactionDto,
  CreateTransactionDto,
  DeleteAuthResponseDto,
  GetAuthResponseDto,
  MapSmallcaseAuthDto,
  MapSmallcaseAuthResponseDto,
} from './smallcase.dto'
import {
  deleteSubscriberAuthId,
  getSmallcaseOrderByTransaction,
  updateSmallcaseOrderBroker,
  updateSubscriberAuthId,
} from './smallcase.reposistory'

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
      this.logger.info('Smallcase configuration validated successfully')
    }
  }

  async getUserAuthId(userId: number): Promise<GetAuthResponseDto> {
    try {
      if (!userId || userId <= 0) {
        throw new BadRequestException('Valid User ID is required')
      }

      // 🔹 Fetch authid, broker (slug), brokerName, and icon_url
      const subscriber = await this.dataSource
        .createQueryBuilder()
        .select('s.authid', 'authid')
        .addSelect('s.broker', 'broker') // slug stored in tbl_subscriber
        .addSelect('b.name', 'brokerName') // full broker name from tbl_broker
        .addSelect('b.icon_url', 'brokerIcon') // logo
        .from('tbl_subscriber', 's')
        .leftJoin('tbl_broker', 'b', 's.broker = b.slug')
        .where('s.id = :id', { id: userId })
        .getRawOne()

      if (!subscriber?.authid || !subscriber?.broker) {
        throw new NotFoundException('No Auth ID or Broker found for this user')
      }

      this.logger.info(`Auth ID and Broker retrieved for user: ${userId}`)

      return {
        statusCode: 200,
        success: true,
        authId: subscriber.authid,
        broker: subscriber.broker, // slug (e.g., groww, kite)
        brokerName: subscriber.brokerName, // full name (e.g., Groww, Zerodha)
        brokerIcon: subscriber.brokerIcon,
        message: 'Auth ID and Broker retrieved successfully',
      }
    } catch (error) {
      this.logger.error(`Error in getUserAuthId for user ${userId}:`, error)

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }

      throw new InternalServerErrorException('Failed to retrieve Auth ID and Broker')
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

  async connect(dto: ConnectTransactionDto, subscriberid?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    const subscriberDetails = await getUserBy({ id: subscriberid })

    const { intent = 'CONNECT' } = dto
    const authToken = createAuthToken(subscriberDetails?.authid) // creates guest token if no authId

    try {
      const response = await axios.post(
        `https://gatewayapi.smallcase.com/gateway/${process.env.SMALLCASE_GATEWAY_NAME}/transaction`,
        { intent },
        {
          headers: {
            'x-gateway-secret': process.env.SMALLCASE_API_SECRET as string,
            'x-gateway-authtoken': authToken,
          },
        }
      )
      const transactionId = response.data?.data?.transactionId // adjust to your API response structure

      if (transactionId) {
        await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('tbl_smallcase_order')
          .values({
            transactionid: transactionId,
            // serviceid: serviceId,
            subscriberid: subscriberDetails.id || null,
            status: 0,
            broker: null,
            // ordertype: orderType,
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

  async mapSmallcaseAuthToken(dto: MapSmallcaseAuthDto, userId: number): Promise<MapSmallcaseAuthResponseDto> {
    try {
      // Validate input
      if (!dto.transactionId || !dto.smallcaseAuthToken || !dto.broker) {
        throw new BadRequestException('Transaction ID, Auth Token and Broker are required')
      }

      // Decode the JWT token to get smallcaseAuthId
      let decodedToken: any
      try {
        decodedToken = jwt.decode(dto.smallcaseAuthToken)
        if (!decodedToken || !decodedToken.smallcaseAuthId) {
          throw new BadRequestException('Invalid Smallcase Auth Token - missing smallcaseAuthId')
        }
      } catch (error) {
        this.logger.error('JWT decode error:', error)
        throw new BadRequestException('Invalid or malformed Smallcase Auth Token')
      }

      const smallcaseAuthId = decodedToken.smallcaseAuthId

      // Verify transaction exists for this user
      const existingOrder = await getSmallcaseOrderByTransaction(dto.transactionId, userId)
      if (!existingOrder) {
        throw new NotFoundException('Transaction not found for this user')
      }

      // Execute updates in parallel
      await Promise.all([
        // Update subscriber with smallcaseAuthId
        updateSubscriberAuthId(userId, smallcaseAuthId, dto.broker),
        // Update order with broker and mark as completed
        updateSmallcaseOrderBroker(dto.transactionId, dto.broker, userId),
      ])

      this.logger.info(`Smallcase auth mapped successfully for user: ${userId}, authId: ${smallcaseAuthId}`)

      return {
        success: true,
        message: 'Smallcase account mapped successfully',
        data: {
          smallcaseAuthId,
          transactionId: dto.transactionId,
          broker: dto.broker,
        },
      }
    } catch (error) {
      this.logger.error(`Error in mapSmallcaseAuthToken for user ${userId}:`, error)

      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error
      }

      throw new InternalServerErrorException('Failed to map Smallcase authentication')
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

  async deleteUserAuthId(userId: number): Promise<DeleteAuthResponseDto> {
    try {
      if (!userId || userId <= 0) {
        throw new BadRequestException('Valid User ID is required')
      }

      // Check if user exists first
      const subscriber = await getUserBy({ id: userId }, ['authid'])

      if (!subscriber) {
        throw new NotFoundException('User not found')
      }

      // Delete the authId (set to null)
      const updateResult = await deleteSubscriberAuthId(userId)

      if (updateResult.affected === 0) {
        throw new NotFoundException('User not found or Auth ID already removed')
      }

      this.logger.info(`Auth ID deleted for user: ${userId}`)

      return {
        success: true,
        message: 'Auth ID deleted successfully',
      }
    } catch (error) {
      this.logger.error(`Error in deleteUserAuthId for user ${userId}:`, error)

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }

      throw new InternalServerErrorException('Failed to delete Auth ID')
    }
  }
}
