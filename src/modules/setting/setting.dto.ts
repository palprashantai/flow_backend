// dto/create-ticket.dto.ts
import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAppEventLogDto {
  @ApiPropertyOptional({
    description: 'Name of the screen where the event occurred',
    example: 'HomeScreen',
  })
  @IsOptional()
  @IsString()
  screen_name?: string

  @ApiPropertyOptional({
    description: 'Type of event triggered by user (e.g., view, click)',
    example: 'click',
  })
  @IsOptional()
  @IsString()
  event_type?: string

  @ApiPropertyOptional({
    description: 'Optional device ID used to identify the subscriber',
    example: 'f3e7c2a1-1b23-4567-890a-bcdef1234567',
  })
  @IsOptional()
  @IsString()
  device_id?: string

  @ApiPropertyOptional({
    description: 'Additional Payload or context for the event',
    example: 'User clicked the start button or payload JSON',
  })
  @IsOptional()
  @IsString()
  payload?: string
}
