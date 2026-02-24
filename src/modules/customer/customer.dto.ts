import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { CustomerTier, LeadSource } from './customer.entity'

export { CustomerTier, LeadSource }

export class CreateCustomerDto {
    @ApiProperty({ example: 'Rohan Mehta' })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty({ example: 'rohan@email.com' })
    @IsEmail()
    email: string

    @ApiProperty({ example: '+91 98765 43210' })
    @IsString()
    phone: string

    @ApiProperty({ example: 'Mumbai' })
    @IsString()
    city: string

    @ApiProperty({ example: 'India' })
    @IsString()
    country: string

    @ApiProperty({ enum: LeadSource, example: LeadSource.WhatsApp })
    @IsEnum(LeadSource)
    source: LeadSource

    @ApiProperty({ example: ['Honeymoon', 'Luxury'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    tags: string[]

    @ApiProperty({ example: 'Looking for a luxury trip', required: false })
    @IsString()
    @IsOptional()
    notes?: string

    @ApiProperty({ enum: CustomerTier, example: CustomerTier.Gold, required: false })
    @IsEnum(CustomerTier)
    @IsOptional()
    tier?: CustomerTier

    @ApiProperty({ example: 'agent-uuid-here', required: false })
    @IsString()
    @IsOptional()
    assignedAgentId?: string
}

export class UpdateCustomerDto extends CreateCustomerDto { }
