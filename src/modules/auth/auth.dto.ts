import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class GetOtpNewDto {
  @ApiProperty({ example: '9876543210', description: 'User mobile number (10 digits)' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 10)
  mobileno: string

  @ApiProperty({ example: 'device123', description: 'Unique device ID' })
  @IsString()
  deviceid: string
}

export class OtpVerificationDto {
  @ApiProperty({ example: '9876543210', description: 'User mobile number' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 10)
  mobileno: string

  @ApiProperty({ example: 'device123', description: 'Unique device ID' })
  @IsString()
  deviceid: string

  @ApiProperty({ example: '1234', description: '4 digit OTP' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4)
  otp: string

  @ApiProperty({ example: 'fcm-token-123', description: 'FCM token' })
  @IsString()
  fcmtoken: string
}

export class RegisterDto {
  @ApiProperty({ description: 'Full name of the subscriber', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Email ID of the subscriber', example: 'john.doe@gmail.com' })
  @IsEmail()
  email: string
}

export class VerifyOtpDto {
  @ApiProperty({ example: '123456', description: 'OTP received by the user' })
  @IsNotEmpty()
  @IsString()
  otp: string
}

export class GetJWTDto {
  @ApiProperty({ example: '9876543210', description: 'Mobile number of the user' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 10)
  usermobile: string

  @ApiProperty({ example: '123456', description: 'OTP received by the user' })
  @IsNotEmpty()
  @IsString()
  otp: string
}