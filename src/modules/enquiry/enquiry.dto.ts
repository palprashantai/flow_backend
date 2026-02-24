import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { LeadSource } from '../customer/customer.entity'
import { EnquiryStatus } from './enquiry.entity'

export { EnquiryStatus }

export class CreateEnquiryDto {
    @ApiProperty({ example: 'CUST-0001', description: 'Customer ID (FK)' })
    @IsString()
    @IsNotEmpty()
    customerId: string

    @ApiProperty({ example: 'Bali, Indonesia' })
    @IsString()
    @IsNotEmpty()
    destination: string

    @ApiProperty({ example: 2 })
    @IsInt()
    pax: number

    @ApiProperty({ example: 150000, description: 'Budget in base currency units', required: false })
    @IsNumber()
    @IsOptional()
    budget?: number

    @ApiProperty({ example: 'INR', required: false })
    @IsString()
    @IsOptional()
    budgetCurrency?: string

    @ApiProperty({ enum: LeadSource, example: LeadSource.WhatsApp, required: false })
    @IsEnum(LeadSource)
    @IsOptional()
    source?: LeadSource

    @ApiProperty({ enum: EnquiryStatus, example: EnquiryStatus.New })
    @IsEnum(EnquiryStatus)
    status: EnquiryStatus

    @ApiProperty({ example: 'agent-uuid-here', required: false })
    @IsString()
    @IsOptional()
    assignedAgentId?: string

    @ApiProperty({ example: '2025-12-01', required: false })
    @IsString()
    @IsOptional()
    travelDateFrom?: string

    @ApiProperty({ example: '2025-12-10', required: false })
    @IsString()
    @IsOptional()
    travelDateTo?: string

    @ApiProperty({ example: 'Looking for a budget stay', required: false })
    @IsString()
    @IsOptional()
    notes?: string
}

export class UpdateEnquiryDto extends CreateEnquiryDto { }
