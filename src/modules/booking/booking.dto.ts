import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { BookingStatus } from './booking.entity'

export class CreateBookingDto {
    @ApiProperty({ example: 'CUST-0001' })
    @IsString()
    @IsNotEmpty()
    customerId: string

    @ApiProperty({ example: 'ENQ-0001', required: false })
    @IsString()
    @IsOptional()
    enquiryId?: string

    @ApiProperty({ example: 'QUO-0001', required: false })
    @IsString()
    @IsOptional()
    quotationId?: string

    @ApiProperty({ example: 'Bali, Indonesia' })
    @IsString()
    @IsNotEmpty()
    destination: string

    @ApiProperty({ example: '2026-03-05' })
    @IsString()
    @IsNotEmpty()
    departureDate: string

    @ApiProperty({ example: '2026-03-12', required: false })
    @IsString()
    @IsOptional()
    returnDate?: string

    @ApiProperty({ example: 2 })
    @IsInt()
    @Min(1)
    pax: number

    @ApiProperty({ example: 124000 })
    @IsNumber()
    amount: number

    @ApiProperty({ example: 'INR', required: false })
    @IsString()
    @IsOptional()
    currency?: string

    @ApiProperty({ enum: BookingStatus, example: BookingStatus.Confirmed })
    @IsEnum(BookingStatus)
    status: BookingStatus

    @ApiProperty({ example: 'Window seat preferred', required: false })
    @IsString()
    @IsOptional()
    specialNotes?: string

    @ApiProperty({ example: 'Customer cancelled trip', required: false })
    @IsString()
    @IsOptional()
    cancellationReason?: string
}

export class UpdateBookingDto extends CreateBookingDto { }

export class CancelBookingDto {
    @ApiProperty({ example: 'Customer cancelled trip', required: false })
    @IsString()
    @IsOptional()
    reason?: string
}
