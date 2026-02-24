import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from './crm-user.entity'

export class CreateCrmUserDto {
    @ApiProperty({ example: 'Priya Sharma' })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty({ example: 'priya@tourflow.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({ example: 'SecurePass@123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string

    @ApiProperty({ enum: UserRole, example: UserRole.Agent, required: false })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole

    @ApiProperty({ example: '+91 98765 43210', required: false })
    @IsString()
    @IsOptional()
    phone?: string

    @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
    @IsString()
    @IsOptional()
    avatarUrl?: string
}

export class UpdateCrmUserDto {
    @ApiProperty({ example: 'Priya Sharma', required: false })
    @IsString()
    @IsOptional()
    name?: string

    @ApiProperty({ example: 'priya@tourflow.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string

    @ApiProperty({ example: 'NewPass@123', required: false })
    @IsString()
    @MinLength(8)
    @IsOptional()
    password?: string

    @ApiProperty({ enum: UserRole, required: false })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole

    @ApiProperty({ example: '+91 98765 43210', required: false })
    @IsString()
    @IsOptional()
    phone?: string

    @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
    @IsString()
    @IsOptional()
    avatarUrl?: string

    @ApiProperty({ example: 1, required: false })
    @IsInt()
    @Min(0)
    @IsOptional()
    isActive?: number
}
