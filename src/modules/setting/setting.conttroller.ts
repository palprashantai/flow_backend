import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { SettingService } from './setting.service'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import {
  ComplianceItemDto,
  CreateAppEventLogDto,
  CreateFolioTrackingDto,
  CreateSubscriberEventDto,
  UpdateNotificationDto,
} from './setting.dto'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { getFaqList, streetfoliosInfo } from './setting.reposistory'

@ApiTags('Setting')
@Controller('appApi/setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Post('getNotificationSettings')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Retrieve subscriber notification Settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getProfile(@GetUserId('id') userId?: number) {
    return this.settingService.getSubscriberNotificationSettings(userId)
  }

  @Post('notificationSettings')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({
    summary: 'Update subscriber notification preferences',
    description: `
  n_type mapping:
  1 → Subscription Alerts
  2 → Rebalance Alerts
  3 → Investment Push
  4 → Offers & Discounts
  5 → Market Updates
  6 → Renewal Reminders
  7 → WhatsApp Notifications
  `,
  })
  @ApiBody({ type: UpdateNotificationDto })
  async updateNotifications(@Body() dto: UpdateNotificationDto, @GetUserId('id') userId?: number) {
    return this.settingService.updateNotifications(dto, userId)
  }

  @Post('log')
  // @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log app event',
    description: 'Logs an app screen or action with optional subscriber token.',
  })
  @ApiBody({ type: CreateAppEventLogDto })
  @ApiResponse({
    status: 201,
    description: 'Event logged successfully',
    schema: {
      example: { status: 'success' },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or bad input' })
  async logAppEvent(@Body() dto: CreateAppEventLogDto, @GetUserId('id') userId: number): Promise<{ status: string }> {
    console.log('logAppEvent', dto, userId)
    await this.settingService.createEvent(dto, userId)
    return { status: 'success' }
  }

  @Get('about')
  @ApiOperation({
    summary: 'Get About Streetfolios',
    description: 'Provides static information about Streetfolios including features, who should invest, and the investment process.',
  })
  @ApiResponse({
    status: 200,
    description: 'About Streetfolios details',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getAbout() {
    return streetfoliosInfo
  }

  @Get('faq-list')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get FAQ list by SEO ID' })
  @ApiResponse({ status: 200, description: 'Returns a list of FAQs' })
  async getFaqList() {
    return await getFaqList(96)
  }

  @Post('get-support')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get Support Info for Subscriber' })
  async getSupport(@GetUserId('id') userId?: number) {
    return this.settingService.getSupport(userId)
  }

  @Get('compliance')
  @ApiBearerAuth()
  getComplianceItems(): ComplianceItemDto[] {
    return this.settingService.getComplianceItems()
  }

  @Get('getFinePrint')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get fine print page data by slug' })
  @ApiQuery({
    name: 'slug',
    type: String,
    required: true,
    description: 'Slug of the fine print page',
    example: 'client-acceptance',
  })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'No data found for the given slug.' })
  @ApiResponse({ status: 500, description: 'Error retrieving data.' })
  async getFinePrint(@Query('slug') slug: string) {
    return this.settingService.getFinePrint(slug)
  }

  @Post('subscriberEventlog')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({
    summary: 'Log subscriber event',
    description: 'Logs an event for the authenticated subscriber (like app activity or action).',
  })
  @ApiBody({ type: CreateSubscriberEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event logged successfully',
    schema: { example: { status: 'success' } },
  })
  @ApiResponse({ status: 400, description: 'Validation error or bad input' })
  async logSubscriberEvent(@Body() dto: CreateSubscriberEventDto, @GetUserId('id') userId: number): Promise<{ status: string }> {
    console.log('logSubscriberEvent', dto, userId)
    await this.settingService.createSubscriberEvent(dto, userId)
    return { status: 'success' }
  }

  @Post('insert-folio-tracking')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Insert Folio Tracking Data' })
  @ApiResponse({ status: 201, description: 'Folio tracking inserted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async insertFolioTracking(@Body() dto: CreateFolioTrackingDto, @GetUserId('id') userId: number) {
    console.log('insertFolioTracking', dto, userId)
    return this.settingService.insertFolioTracking(dto, userId)
  }
}
