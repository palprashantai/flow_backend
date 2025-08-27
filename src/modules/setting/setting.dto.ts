// dto/create-ticket.dto.ts
import { IsIn,  IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

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
export class UpdateNotificationDto {
  @ApiProperty({ description: 'Trade notifications: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  n_trade?: number

  @ApiProperty({ description: 'Rebalance notifications: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  n_rebalance?: number

  @ApiProperty({ description: 'Streetview notifications: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  n_streetview?: number

  @ApiProperty({ description: 'Reminders notifications: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  n_reminders?: number
}