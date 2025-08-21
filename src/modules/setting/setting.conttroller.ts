import { Body, Controller, Post } from '@nestjs/common'
import { SettingService } from './setting.service'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { CreateAppEventLogDto } from './setting.dto'
import { GetUserId } from 'modules/auth/auth.guard'

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
    await this.settingService.createEvent(dto, userId)
    return { status: 'success' }
  }
}
