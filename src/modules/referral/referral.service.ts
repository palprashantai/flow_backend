import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { logger } from 'middlewares/logger.middleware'

// import NodeCache from 'node-cache'
import { getReferralByStatus, getWalletBySubscriber } from './referral.reposistory'
import { getUserBy } from 'modules/auth/auth.repository'

@Injectable()
export class ReferralService {
  private readonly logger = logger

  // constructor(@Inject('NODE_CACHE') private readonly cache: NodeCache) {}

  async getReferralsByStatus(status: number, referral_id: number): Promise<any[]> {
    try {
      const referrals = await getReferralByStatus(status, referral_id)

      if (!referrals.length) {
        this.logger.warn(`No referrals found with status=${status} for referral_id=${referral_id}`)
        throw new NotFoundException(`No referrals found with status ${status}`)
      }

      return await Promise.all(
        referrals.map(async (referral) => {
          const user = await getUserBy({ id: referral.sub_id }, ['fullname'])

          return {
            id: referral.id,
            referral_id: referral.referral_id,
            referral_code: referral.referral_code,
            sub_id: referral.sub_id,
            subscriber_fullname: user?.fullname || null,
            amount: referral.amount,
            status: referral.status,
            updated_on: referral.updated_on,
            datetime: referral.datetime,
          }
        })
      )
    } catch (error) {
      this.logger.error(`Failed to fetch referrals with status=${status} for referral_id=${referral_id}`, error.stack)
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(error.message || 'Unable to fetch referrals')
    }
  }

  async getWalletForUser(userId: number): Promise<any[]> {
    try {
      const walletRecords = await getWalletBySubscriber(userId)

      if (!walletRecords.length) {
        this.logger.warn(`No wallet records found for subscriberId=${userId}`)
        throw new NotFoundException(`No wallet records found for subscriberId ${userId}`)
      }

      return walletRecords.map((record) => ({
        id: record.id,
        subscriberid: record.subscriberid,
        referid: record.referid,
        amount: record.amount,
        type: record.type === 0 ? 'Credit' : 'Debit',
        created_on: record.created_on,
      }))
    } catch (error) {
      this.logger.error(`Failed to fetch wallet records for subscriberId=${userId}`, error.stack)
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(error.message || 'Unable to fetch wallet records')
    }
  }
}
