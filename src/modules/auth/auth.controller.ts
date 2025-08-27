import { BadRequestException, Body, Controller, InternalServerErrorException, Post, UnauthorizedException } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { GetOtpNewDto, OtpVerificationDto, RegisterDto } from './auth.dto'
import { Auth, GetUserId } from './auth.guard'

@Controller('appApi/auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('getotp')
  @ApiOperation({ summary: 'NEW: Generate and send OTP (New)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Mobile number is required or invalid' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getOtpNew(@Body() dto: GetOtpNewDto) {
    if (!dto.mobileno) {
      throw new BadRequestException('Mobile number is required')
    }
    try {
      await this.authService.getOtpNew(dto.mobileno, dto.deviceid)
      return {
        success: true,
        message: 'OTP sent successfully',
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  @Post('otp-verification')
  @ApiOperation({
    summary: 'NEW: Verify OTP and login/register subscriber',
    description: 'Verifies the OTP and logs in the subscriber. `usertype = 0` means old user, `usertype = 1` means new user.',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async otpVerification(@Body() dto: OtpVerificationDto) {
    try {
      const result = await this.authService.otpVerification(dto.mobileno, dto.deviceid, dto.otp, dto.fcmtoken)

      return {
        success: true,
        message: 'OTP verified successfully',
        data: result,
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  @Post('register')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'NEW: Register Subscriber',
    description: `
    API for user registration (Registration Screen).
    - Requires Token, Name, Email ID
    - Updates subscriber info
    - Success response after update
    - Provider: GOOGLE
    `,
  })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async register(@Body() dto: RegisterDto, @GetUserId('id') userId: number) {
    try {
      const result = await this.authService.register(dto, userId)

      return {
        success: true,
        message: 'Registration successful',
        data: result,
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  @Post('userAcceptance')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'NEW: Save userAcceptance',
    description: `
  Stores user acceptance as "Consent Given" with timestamp.
  - Requires Token
  - Updates subscriber record
  `,
  })
  @ApiResponse({ status: 200, description: 'userAcceptance saved successfully' })
  async userAcceptance(@GetUserId('id') userId: number) {
    const result = await this.authService.userAcceptance(userId)
    return result
  }

  @Post('registerReferral')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'NEW: Register Referral Code',
    description: `
  Generates and saves a referral code for the logged-in subscriber.
  - Requires Token
  - Updates subscriber record with a unique referral code
  `,
  })
  @ApiResponse({ status: 200, description: 'Referral code registered successfully' })
  async registerReferral(@GetUserId('id') userId: number) {
    if (!userId) throw new UnauthorizedException('Invalid user token')

    try {
      const result = await this.authService.registerReferral(userId)
      return {
        message: 'Referral code registered successfully',
        data: result,
      }
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to register referral code')
    }
  }
}
