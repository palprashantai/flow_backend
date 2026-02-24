import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum PaymentStatus {
    Settled = 'Settled',
    Partial = 'Partial',
    Advance = 'Advance',
    Overdue = 'Overdue',
}

export class CreateCrmPaymentDto {
    @ApiProperty({ example: 'Rohan Mehta' })
    @IsString()
    @IsNotEmpty()
    customer: string

    @ApiProperty({ example: 'TF-2847' })
    @IsString()
    @IsNotEmpty()
    booking: string

    @ApiProperty({ example: '₹1,24,000' })
    @IsString()
    @IsNotEmpty()
    amount: string

    @ApiProperty({ example: '₹1,24,000' })
    @IsString()
    @IsNotEmpty()
    received: string

    @ApiProperty({ example: '₹0' })
    @IsString()
    @IsNotEmpty()
    outstanding: string

    @ApiProperty({ example: 'UPI' })
    @IsString()
    @IsNotEmpty()
    mode: string

    @ApiProperty({ example: 'Feb 18, 2026' })
    @IsString()
    @IsNotEmpty()
    date: string

    @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.Settled })
    @IsEnum(PaymentStatus)
    status: PaymentStatus
}

export class UpdateCrmPaymentDto extends CreateCrmPaymentDto { }
