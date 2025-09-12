import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserService } from './user.service'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { UpdateSubscriberBillingDetailsDto, UpdateSubscriberEmailDto } from './user.dto'
import { logger } from 'middlewares/logger.middleware'

@ApiTags('User')
@Controller('appApi/user')
export class UserController {
  private readonly logger = logger

  constructor(private readonly userService: UserService) {}

  @Post('getProfile')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Retrieve subscriber profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getProfile(@GetUserId('id') userId: number) {
    try {
      if (!userId) throw new UnauthorizedException('Invalid user token')
      return await this.userService.getProfile(userId)
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to retrieve profile')
    }
  }

  @Get('get-email')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Retrieve subscriber email by JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Email retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Email retrieved successfully',
        result: { emailid: 'john.doe@example.com' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscriber not found or email not found' })
  async getSubscriberEmail(@GetUserId('id') userId: number) {
    if (!userId) {
      throw new UnauthorizedException('Invalid user token')
    }

    return this.userService.getSubscriberEmailById(userId)
  }

  @Post('update-email')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Update user email by JWT token' })
  @ApiBody({ type: UpdateSubscriberEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email updated successfully',
    schema: { example: { success: true, message: 'Updated Successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Please Enter Token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'user not found' })
  async updateSubscriberEmail(@Body() dto: UpdateSubscriberEmailDto, @GetUserId('id') userId: number) {
    return this.userService.updateSubscriberEmail(dto, userId)
  }

  @Post('order-listing')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get order listing for a subscriber' })
  @ApiResponse({ status: 200, description: 'Returns a list of order summaries' })
  @ApiResponse({ status: 400, description: 'Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Subscriber or orders not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async orderListing(@GetUserId('id') userId: number, @Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      return await this.userService.getOrderListing(userId, Number(page), Number(limit))
    } catch (error) {
      this.logger.error('Error in orderListing:', error.message)
      return {
        status: 'error',
        message: error.message || 'Server error occurred',
      }
    }
  }

  @Post('registerReferral')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'NEW: Register Referral Code',
    description: `
  Generates and saves a referral code for the logged-in subscriber.
  - Requires Token
  - Updates subscriber record with a unique referral code
  `,
  })
  @ApiResponse({ status: 200, description: 'Referral code registered successfully' })
  async registerReferral(@GetUserId('id') userId: number) {
    if (!userId) throw new UnauthorizedException('Invalid user token')

    try {
      const result = await this.userService.registerReferral(userId)
      return {
        message: 'Referral code registered successfully',
        data: result,
      }
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to register referral code')
    }
  }

  @Get('my-subscriptions')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get subscriptions for a subscriber' })
  @ApiResponse({ status: 200, description: 'Returns a list of subscriptions and sales rep info' })
  @ApiResponse({ status: 400, description: 'Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'User or subscriptions not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async mySubscriptionListing(@GetUserId('id') userId: number, @Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      return await this.userService.getMySubscriptions(userId, Number(page), Number(limit))
    } catch (error) {
      this.logger.error('Error in mySubscriptionListing:', error.message)
      return {
        status: 'error',
        message: error.message || 'Server error occurred',
      }
    }
  }

  @Get('getSubscriptionDetails/:subscriptionId')
  @ApiBearerAuth()
  @Auth()
  @ApiParam({
    name: 'subscriptionId',
    description: 'ID of the subscription to retrieve details for',
    required: true,
  })
  @ApiOperation({ summary: 'Get subscription details by ID for a subscriber' })
  @ApiResponse({ status: 200, description: 'Returns subscription detail and sales rep info' })
  @ApiResponse({ status: 400, description: 'Invalid or missing token or subscription ID' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSubscriptionDetailsById(@GetUserId('id') userId: number, @Param('subscriptionId') subscriptionId: number) {
    try {
      this.logger.log('Fetching subscription details for subscriber:', userId)
      return await this.userService.getSubscriptionDetailsById(userId, subscriptionId)
    } catch (error) {
      this.logger.error('Error in getSubscriptionDetailsById:', error.message)
      return {
        status: 'error',
        message: error.message || 'Server error occurred',
      }
    }
  }

  @Post('get-billing-details')
  @ApiOperation({ summary: 'Retrieve subscriber billing details by JWT token' })
  @ApiBearerAuth()
  @Auth()
  @ApiResponse({
    status: 200,
    description: 'Billing details retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Billing details retrieved successfully',
        result: {
          pan: 'ABCDE1234F',
          mobileno: '9876543210',
          name_as_per_pan: 'John Doe',
          dob: '1990-01-01',
          state: 'Karnataka',
          statelist: [
            { id: 1, name: 'Karnataka' },
            { id: 2, name: 'Maharashtra' },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Please Enter Token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  async getSubscriberBillingDetails(@GetUserId('id') userId: number) {
    return this.userService.getSubscriberBillingDetails(userId)
  }

  @Post('update-billing-details')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Update subscriber billing details by JWT token' })
  @ApiBody({ type: UpdateSubscriberBillingDetailsDto })
  @ApiResponse({
    status: 200,
    description: 'Updated Successfully',
    schema: { example: { success: true, message: 'Updated Successfully' } },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async updateSubscriberBillingDetails(@Body() dto: UpdateSubscriberBillingDetailsDto, @GetUserId('id') userId: number) {
    return this.userService.updateSubscriberBillingDetails(dto, userId)
  }

  @Get('notifications-list')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get general notifications for a subscriber' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully.' })
  @ApiResponse({ status: 404, description: 'No Subscriber Found...' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getGeneralNotifications(@GetUserId('id') userId: number, @Query('page') page = 1, @Query('limit') limit = 10) {
    console.log('Fetching notifications for user:', userId, 'Page:', page, 'Limit:', limit)

    return this.userService.getGeneralNotifications(userId, Number(page), Number(limit))
  }
}
