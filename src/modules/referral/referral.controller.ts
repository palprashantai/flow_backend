import { Controller, Get, InternalServerErrorException, Logger, HttpException } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ReferralService } from './referral.service'
import { Auth, GetUserId } from 'modules/auth/auth.guard'

@ApiTags('Referral')
@Controller('appApi/referral')
export class ReferralController {
  private readonly logger = new Logger(ReferralController.name)

  constructor(private readonly referralService: ReferralService) {}

  @Get('on-progress')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referrals with status 0 (On Progress)' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getOnProgress(@GetUserId('id') userId: number) {
    this.logger.log(`Fetching on-progress referrals for user ${userId}`)
    try {
      const result = await this.referralService.getReferralsByStatus(0, userId)
      this.logger.log(`Successfully retrieved ${result.length} on-progress referrals for user ${userId}`)
      return {
        success: true,
        message: 'On-progress referrals retrieved successfully',
        result,
      }
    } catch (error) {
      this.logger.error(`Error fetching on-progress referrals for user ${userId}`, error.stack)
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(error.message || 'Failed to fetch on-progress referrals')
    }
  }

  @Get('success')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referrals with status 1 (Success)' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getSuccess(@GetUserId('id') userId: number) {
    this.logger.log(`Fetching successful referrals for user ${userId}`)
    try {
      const result = await this.referralService.getReferralsByStatus(1, userId)
      this.logger.log(`Successfully retrieved ${result.length} successful referrals for user ${userId}`)
      return {
        success: true,
        message: 'Successful referrals retrieved successfully',
        result,
      }
    } catch (error) {
      this.logger.error(`Error fetching successful referrals for user ${userId}`, error.stack)
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(error.message || 'Failed to fetch successful referrals')
    }
  }

  @Get('past-transactions')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet folio records for logged-in user' })
  @ApiResponse({ status: 200, description: 'Wallet data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getWallet(@GetUserId('id') userId: number) {
    this.logger.log(`Fetching wallet folio for user ${userId}`)
    try {
      const result = await this.referralService.getWalletForUser(userId)
      this.logger.log(`Successfully retrieved ${result.length} wallet records for user ${userId}`)
      return {
        success: true,
        message: 'Wallet records retrieved successfully',
        result,
      }
    } catch (error) {
      this.logger.error(`Error fetching wallet folio for user ${userId}`, error.stack)
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException(error.message || 'Failed to fetch wallet records')
    }
  }
}
