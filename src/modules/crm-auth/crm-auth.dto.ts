import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from 'modules/user/crm-user.entity'

export class CrmLoginDto {
    @ApiProperty({ example: 'admin@tourflow.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({ example: 'SecurePass@123' })
    @IsString()
    @IsNotEmpty()
    password: string
}

export class CrmRegisterDto {
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
}

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPass@123' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string

    @ApiProperty({ example: 'NewPass@456', minLength: 8 })
    @IsString()
    @MinLength(8)
    newPassword: string
}
