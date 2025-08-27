import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { SettingService } from './setting.service'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { CreateAppEventLogDto, UpdateNotificationDto } from './setting.dto'
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
  1 → Trade
  2 → Rebalance
  3 → Streetview
  4 → Reminders
  `,
  })
  @ApiBody({ type: UpdateNotificationDto })
  async updateNotifications(@Body() dto: UpdateNotificationDto, @GetUserId('id') userId?: number) {
    return this.settingService.updateNotifications(dto, userId)
  }

  @Post('log')
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
}
