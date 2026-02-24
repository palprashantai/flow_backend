import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { PackageStatus } from './travel-package.entity'

export class CreateTravelPackageDto {
    @ApiProperty({ example: 'Bali Honeymoon Bliss' })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty({ example: 'Beautiful beach villa...', required: false })
    @IsString()
    @IsOptional()
    description?: string

    @ApiProperty({ example: 'Bali, Indonesia' })
    @IsString()
    @IsNotEmpty()
    destination: string

    @ApiProperty({ example: 7 })
    @IsInt()
    durationDays: number

    @ApiProperty({ example: 89000 })
    @IsNumber()
    price: number

    @ApiProperty({ example: 62000 })
    @IsNumber()
    cost: number

    @ApiProperty({ example: 'INR' })
    @IsString()
    @IsOptional()
    currency?: string

    @ApiProperty({ enum: PackageStatus, example: PackageStatus.Active })
    @IsEnum(PackageStatus)
    status: PackageStatus

    @ApiProperty({ example: ['Beach', 'Luxury'], type: [String], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    inclusions?: string[]

    @ApiProperty({ example: ['Airfare'], type: [String], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    exclusions?: string[]
}

export class UpdateTravelPackageDto extends CreateTravelPackageDto { }
