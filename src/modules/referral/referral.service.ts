import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { logger } from 'middlewares/logger.middleware'

// import NodeCache from 'node-cache'
import { getReferralByStatus, getReferralFaqs, getWalletBalanceBySubscriber, getWalletBySubscriber } from './referral.reposistory'
import { getUserBy } from 'modules/auth/auth.repository'
import { ReferralHomeResponseDto } from './referral.dto'

@Injectable()
export class ReferralService {
  private readonly logger = logger

  // constructor(@Inject('NODE_CACHE') private readonly cache: NodeCache) {}

  async getReferralHomeData(userId: number): Promise<ReferralHomeResponseDto> {
    try {
      // Validate userId
      if (!userId || userId <= 0) {
        throw new BadRequestException('Valid User ID is required')
      }

      // Execute all queries in parallel for better performance
      const [walletResult, user, faqs] = await Promise.all([
        getWalletBalanceBySubscriber(userId),
        getUserBy({ id: userId }, ['referralcode']),
        getReferralFaqs(96), // Replace with actual referral seoId
      ])

      // Calculate wallet balance (handles positive/negative amounts: -10 + 90 + (-80) = 0)
      const walletBalance = walletResult?.totalBalance ? Number(walletResult.totalBalance) : 0

      // Top card promotional text
      const topCardText = '₹100 for You. ₹100 for Your Friend.\nEarn While You Invest – Refer & Earn.'

      // User referral code
      const userReferralCode = user?.referralcode || ''

      // Format FAQs response
      const formattedFaqs = faqs.map((faq) => ({
        id: faq.id,
        title: faq.title,
        description: faq.description,
        faq_type: faq.faq_type,
      }))

      console.log(`Referral home data fetched successfully for user: ${userId}`)

      return {
        walletBalance,
        topCardText,
        userReferralCode,
        faqs: formattedFaqs,
      }
    } catch (error) {
      this.logger.error(`Error in getReferralHomeData for user ${userId}:`, error)

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException('Failed to fetch referral home data')
    }
  }

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
