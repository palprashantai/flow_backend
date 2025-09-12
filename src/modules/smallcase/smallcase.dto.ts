import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
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

export class ConnectTransactionDto {
  // @ApiProperty({ example: 1 })
  // @IsNumber()
  // @IsNotEmpty()
  // serviceId: number

  // @ApiProperty({
  //   example: 0,
  //   enum: [0, 1],
  //   description: 'Order type: 0 = investnow, 1 = rebalance',
  // })
  // @IsIn([0, 1])
  // @IsNumber()
  // @IsNotEmpty()
  // ordertype: number

  @ApiProperty({ example: 'CONNECT' })
  @IsString()
  @IsNotEmpty()
  intent: string

  //   @ApiProperty({ type: OrderConfigDto })
  //   @ValidateNested()
  //   @Type(() => OrderConfigDto)
  //   @IsNotEmpty()
  //   orderConfig: OrderConfigDto
}

export class MapSmallcaseAuthDto {
  @ApiProperty({
    example: 'TRX_a2f301e3ab6b4e48a68cc0a52a6abab2',
    description: 'Transaction ID from Smallcase',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzbWFsbGNhc2VBdXRoSWQiOiI2N2I4MzQ4OTc5YjdiNmQwNWFkNjNmMWQiLCJpYXQiOjE3NTU1MjI2MTAsImV4cCI6MTc1NTUyNjIxMH0.OyVVB6GJWmVlK9HJ6hJMrnzx9m0E8GQc3d6D9hGwqVQ',
    description: 'Smallcase Auth Token to decode',
  })
  @IsString()
  @IsNotEmpty()
  smallcaseAuthToken: string

  @ApiProperty({
    example: 'groww',
    description: 'Broker name',
  })
  @IsString()
  @IsNotEmpty()
  broker: string
}

export class MapSmallcaseAuthResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ example: 'Smallcase account mapped successfully' })
  message: string

  @ApiProperty({
    example: {
      smallcaseAuthId: '67b834897b7b6d05ad63f1d',
      transactionId: 'TRX_a2f301e3ab6b4e48a68cc0a52a6abab2',
      broker: 'groww',
    },
  })
  data?: any
}

export class GetAuthResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: 200

  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ example: '67b834897b7b6d05ad63f1d' })
  authId: string

  @ApiProperty({ example: 'Groww' })
  broker: string

  @ApiProperty({ example: 'Groww' })
  brokerName: string

  @ApiProperty({ example: 'Groww' })
  brokerIcon: string

  @ApiProperty({ example: 'Auth ID retrieved successfully' })
  message: string
}

export class DeleteAuthResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ example: 'Auth ID deleted successfully' })
  message: string
}
