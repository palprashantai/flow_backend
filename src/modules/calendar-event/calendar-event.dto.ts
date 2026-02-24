import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum EventType {
    Departure = 'departure',
    Meeting = 'meeting',
    Followup = 'followup',
    Payment = 'payment',
}

export class CreateCalendarEventDto {
    @ApiProperty({ example: 'Maldives Group Departure' })
    @IsString()
    @IsNotEmpty()
    title: string

    @ApiProperty({ example: '2026-02-25' })
    @IsString()
    @IsNotEmpty()
    date: string

    @ApiProperty({ enum: EventType, example: EventType.Departure })
    @IsEnum(EventType)
    type: EventType

    @ApiProperty({ example: 'Group of 10 people...', required: false })
    @IsString()
    @IsOptional()
    description?: string

    @ApiProperty({ example: '06:00 AM', required: false })
    @IsString()
    @IsOptional()
    time?: string
}

export class UpdateCalendarEventDto extends CreateCalendarEventDto { }
