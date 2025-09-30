// dto/create-ticket.dto.ts
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
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
  @ApiProperty({ description: 'Subscription Alerts: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  subscription_alerts?: number

  @ApiProperty({ description: 'Rebalance Alerts: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  rebalance_alerts?: number

  @ApiProperty({ description: 'Investment Push: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  investment_push?: number

  @ApiProperty({ description: 'Offers & Discounts Push: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  offers_discounts_push?: number

  @ApiProperty({ description: 'Market Updates: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  market_updates?: number

  @ApiProperty({ description: 'Renewal Reminders: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  renewal_reminders?: number

  @ApiProperty({ description: 'WhatsApp Notifications: 0 = off, 1 = on', required: false })
  @IsOptional()
  @IsIn([0, 1])
  whatsapp_notifications?: number
}

export class CreateSubscriberEventDto {
  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  @IsNumber()
  serviceid: number

  @ApiProperty({ example: 0, required: false })
  @IsOptional()       // <--- Must use IsOptional()
  @IsNumber()
  planid?: number

  @ApiProperty({ example: 'login', required: false })
  @IsOptional()
  event_type?: string
}


export class ComplianceItemDto {
  name: string
  value: string // URL
}
