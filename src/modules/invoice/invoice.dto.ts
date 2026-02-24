import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { InvoiceStatus } from './invoice.entity'

export class CreateInvoiceDto {
    @ApiProperty({ example: 'BK-0001' })
    @IsString()
    @IsNotEmpty()
    bookingId: string

    @ApiProperty({ example: 'CUST-0001' })
    @IsString()
    @IsNotEmpty()
    customerId: string

    @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.Draft })
    @IsEnum(InvoiceStatus)
    @IsOptional()
    status?: InvoiceStatus

    @ApiProperty({ example: 120000 })
    @IsNumber()
    subTotal: number

    @ApiProperty({ example: 6000, required: false })
    @IsNumber()
    @IsOptional()
    taxAmount?: number

    @ApiProperty({ example: 0, required: false })
    @IsNumber()
    @IsOptional()
    discount?: number

    @ApiProperty({ example: 126000 })
    @IsNumber()
    totalAmount: number

    @ApiProperty({ example: 'INR', required: false })
    @IsString()
    @IsOptional()
    currency?: string

    @ApiProperty({ example: '2026-03-15', required: false })
    @IsString()
    @IsOptional()
    dueDate?: string

    @ApiProperty({ example: 'Payment due within 7 days', required: false })
    @IsString()
    @IsOptional()
    notes?: string
}

export class UpdateInvoiceDto extends CreateInvoiceDto { }

export class RecordPaymentDto {
    @ApiProperty({ example: 50000 })
    @IsNumber()
    amount: number

    @ApiProperty({ example: 'UPI', required: false })
    @IsString()
    @IsOptional()
    paymentMode?: string

    @ApiProperty({ example: 'UPI-REF-1234', required: false })
    @IsString()
    @IsOptional()
    referenceNo?: string

    @ApiProperty({ example: '2026-02-24', required: false })
    @IsString()
    @IsOptional()
    paidOn?: string

    @ApiProperty({ example: 'Advance payment received', required: false })
    @IsString()
    @IsOptional()
    notes?: string
}
