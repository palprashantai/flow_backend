import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber,  IsOptional, IsString, ValidateNested } from 'class-validator'
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

export class CreateTransactionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  serviceId: number

  @ApiProperty({
    example: 0,
    enum: [0, 1],
    description: 'Order type: 0 = investnow, 1 = rebalance',
  })
  @IsIn([0, 1])
  @IsNumber()
  @IsNotEmpty()
  ordertype: number

  @ApiProperty({ example: 'TRANSACTION' })
  @IsString()
  @IsNotEmpty()
  intent: string

  @ApiProperty({ type: OrderConfigDto })
  @ValidateNested()
  @Type(() => OrderConfigDto)
  @IsNotEmpty()
  orderConfig: OrderConfigDto
}







