import { IsArray,  IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class ItineraryDayDto {
    @ApiProperty({ example: 1 })
    day: number

    @ApiProperty({ example: 'Arrival & Transfer' })
    title: string

    @ApiProperty({ example: 'Airport pickup and hotel transfer', required: false })
    @IsString()
    @IsOptional()
    description?: string

    @ApiProperty({ example: ['Breakfast', 'Dinner'], type: [String], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    meals?: string[]

    @ApiProperty({ example: 'Luxury Resort', required: false })
    @IsString()
    @IsOptional()
    accommodation?: string

    @ApiProperty({ example: ['Airport Pickup', 'Check-in'], type: [String] })
    activities: string[]
}

export class CreateItineraryDto {
    @ApiProperty({ example: 'Bali Honeymoon Special' })
    @IsString()
    @IsNotEmpty()
    title: string

    @ApiProperty({ example: 'PKG-0001' })
    @IsString()
    @IsNotEmpty()
    packageId: string

    @ApiProperty({ type: [ItineraryDayDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItineraryDayDto)
    days: ItineraryDayDto[]
}

export class UpdateItineraryDto extends CreateItineraryDto { }
