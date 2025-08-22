import { Body, Controller, Get, Post } from '@nestjs/common'
import { SettingService } from './setting.service'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { CreateAppEventLogDto } from './setting.dto'
import { GetUserId } from 'modules/auth/auth.guard'
import { streetfoliosInfo } from './setting.reposistory'

@ApiTags('Setting')
@Controller('appApi/setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

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
}
