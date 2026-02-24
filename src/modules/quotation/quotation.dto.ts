import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { QuotationStatus } from './quotation.entity'

export class QuotationItineraryDayDto {
    @ApiProperty({ example: 1 })
    dayNumber: number

    @ApiProperty({ example: 'Arrival & Villa Check-in' })
    title: string

    @ApiProperty({ example: 'Airport pickup and private villa check-in', required: false })
    @IsString()
    @IsOptional()
    description?: string
}

export class QuotationItemDto {
    @ApiProperty({ example: 'Base Package Cost' })
    @IsString()
    @IsNotEmpty()
    description: string

    @ApiProperty({ example: 'Hotel', required: false })
    @IsString()
    @IsOptional()
    category?: string

    @ApiProperty({ example: 80000 })
    @IsNumber()
    unitPrice: number

    @ApiProperty({ example: 2 })
    @IsNumber()
    @IsOptional()
    quantity?: number
}

export class CreateQuotationDto {
    @ApiProperty({ example: 'CUST-0001' })
    @IsString()
    @IsNotEmpty()
    customerId: string

    @ApiProperty({ example: 'ENQ-0001', required: false })
    @IsString()
    @IsOptional()
    enquiryId?: string

    @ApiProperty({ example: 'PKG-0001', required: false })
    @IsString()
    @IsOptional()
    packageId?: string

    @ApiProperty({ example: 160000, required: false, description: 'Auto-computed from items if not provided' })
    @IsNumber()
    @IsOptional()
    subTotal?: number

    @ApiProperty({ example: 5, required: false })
    @IsNumber()
    @IsOptional()
    discountPct?: number

    @ApiProperty({ example: 0, required: false })
    @IsNumber()
    @IsOptional()
    discountFlat?: number

    @ApiProperty({ example: 5, required: false })
    @IsNumber()
    @IsOptional()
    taxPct?: number

    @ApiProperty({ example: 155000, required: false, description: 'Auto-computed if not provided' })
    @IsNumber()
    @IsOptional()
    totalAmount?: number

    @ApiProperty({ example: 'INR', required: false })
    @IsString()
    @IsOptional()
    currency?: string

    @ApiProperty({ enum: QuotationStatus, example: QuotationStatus.Draft, required: false })
    @IsEnum(QuotationStatus)
    @IsOptional()
    status?: QuotationStatus

    @ApiProperty({ example: '2026-12-31', required: false })
    @IsString()
    @IsOptional()
    validUntil?: string

    @ApiProperty({ type: [QuotationItineraryDayDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuotationItineraryDayDto)
    @IsOptional()
    itineraryDays?: QuotationItineraryDayDto[]

    @ApiProperty({ type: [QuotationItemDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuotationItemDto)
    @IsOptional()
    items?: QuotationItemDto[]

    @ApiProperty({ example: 'Rates are subject to availability.', required: false })
    @IsString()
    @IsOptional()
    notes?: string
}

export class UpdateQuotationDto extends CreateQuotationDto { }
