import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class SecurityDto {
  @ApiProperty({ example: 'IDEA' })
  @IsString()
  ticker: string

  @ApiProperty({ example: 'NSE' })
  @IsString()
  exchange: string

  @ApiProperty({ example: 4 })
  @IsInt()
  quantity: number

  @ApiProperty({ example: 'BUY', enum: ['BUY', 'SELL'] })
  @IsIn(['BUY', 'SELL'])
  type: 'BUY' | 'SELL'
}

export class OrderMetaDto {
  @ApiProperty({ example: 'SG Street Portfolio' })
  @IsString()
  @IsOptional()
  orderName?: string

  @ApiProperty({ example: 'https://webapp.streetgains.in/uploads/Group_41166.png' })
  @IsString()
  @IsOptional()
  orderLogo?: string
}

export class OrderConfigDto {
  @ApiProperty({ example: 'SECURITIES', enum: ['SECURITIES', 'SMALLCASE'] })
  @IsString()
  type: string

  @ApiProperty({ type: [SecurityDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityDto)
  @IsOptional()
  securities?: SecurityDto[]

  @ApiProperty({ type: OrderMetaDto, required: false })
  @ValidateNested()
  @Type(() => OrderMetaDto)
  @IsOptional()
  meta?: OrderMetaDto
}

//
// ========== Subscription DTO
//

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'plan_L9v22Uabc123' })
  @IsString()
  @IsNotEmpty()
  planid: string

  @ApiProperty({ example: 101, description: 'ID of the tbl_services_sub record to update' })
  @IsNumber()
  serviceSubId: number
}

//
// ========== Plan DTO (Razorpay)
//

export class PlanItemDto {
  @ApiProperty({ example: 'Premium Plan' })
  @IsString()
  name: string

  @ApiProperty({ example: 10000, description: 'Amount in paise (e.g., ₹100 = 10000)' })
  @IsInt()
  amount: number

  @ApiProperty({ example: 'INR' })
  @IsString()
  currency: string

  @ApiProperty({ example: 'Monthly premium plan' })
  @IsString()
  description: string
}

export class CreatePlanDto {
  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'

  @ApiProperty({ example: 1, description: 'Interval in number (e.g., 1 = every 1 month)' })
  @IsInt()
  interval: number

  @ApiProperty({ type: PlanItemDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PlanItemDto)
  item: PlanItemDto
}

export class CreateOrderDto {
  @ApiProperty({ example: 1000, description: 'Amount in smallest currency unit (e.g., paise)' })
  @IsNumber()
  amount: number

  @ApiProperty({ example: 'INR', description: 'Three-letter ISO currency code' })
  @IsString()
  currency: string
}

export class CreatePortfolioOrderDto {
  @ApiProperty({ description: 'Unique transaction ID generated after payment success' })
  @IsString()
  transactionId: string

  @ApiProperty({ description: 'Razorpay subscription ID returned by Razorpay' })
  @IsString()
  razorpaySubscriptionId: string

  @ApiProperty({ description: 'ID of the service being purchased' })
  @IsNumber()
  serviceId: number

  @ApiProperty({ description: 'ID of the specific sub-service or plan' })
  @IsNumber()
  serviceSubId: number

  @IsOptional()
  @IsString()
  couponcode?: string

  @IsOptional()
  use_balance?: boolean
}
