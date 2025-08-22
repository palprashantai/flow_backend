// dto/create-ticket.dto.ts
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'

export interface StreetFolioCard {
  id: number
  name: string
  volatility: string
  serviceSlug: string
  serviceImage: string
  description: string
  riskTag: string
  return: {
    period: string
    value: number
  }
  minInvestment: number
  peopleInvestedLast30Days: number
  ctaText: string
  lastUpdated: Date
  getAccessPrice?: number
  subscriptionStatus: 'none' | 'active' | 'expired'
  isFree: boolean
}

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
export class FilterPortfolioDto {
  @ApiPropertyOptional({ description: 'Search by service name or description' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10

  @ApiPropertyOptional({ description: 'Subscription Type: All | Paid | Free', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  subscriptionType?: string[]

  @ApiPropertyOptional({ description: 'Investment Amount filter', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  investmentAmount?: string[]

  @ApiPropertyOptional({ description: 'Returns period', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  returns?: string[]

  @ApiPropertyOptional({ description: 'CAGR order: LowToHigh | HighToLow', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  cagr?: string[]

  @ApiPropertyOptional({ description: 'Volatility filter', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  volatility?: string[]

  @ApiPropertyOptional({
    description: 'Investment strategies as array of segment IDs',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @Type(() => Number)
  investmentStrategy?: number[]
}
