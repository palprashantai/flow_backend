import { Body, Controller, Get, Post, Patch } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { CrmAuthService } from './crm-auth.service'
import { CrmLoginDto, CrmRegisterDto, ChangePasswordDto } from './crm-auth.dto'
import { Auth, GetCrmUserId } from './crm-auth.guard'

@ApiTags('CRM - Auth')
@Controller('appApi/crm/auth')
export class CrmAuthController {
    constructor(private readonly crmAuthService: CrmAuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login with email + password' })
    @ApiResponse({ status: 200, description: 'Returns JWT token and user profile' })
    async login(@Body() dto: CrmLoginDto) {
        const result = await this.crmAuthService.login(dto)
        return { success: true, ...result }
    }

    @Post('register')
    // @Auth()
    // @ApiBearerAuth()
    @ApiOperation({ summary: 'Register a new CRM user (Admin only)' })
    @ApiResponse({ status: 201, description: 'User created' })
    async register(@Body() dto: CrmRegisterDto) {
        const user = await this.crmAuthService.register(dto)
        return { success: true, user }
    }

    @Get('me')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@GetCrmUserId() userId: string) {
        console.log(userId)
        const user = await this.crmAuthService.getMe(userId)
        return { success: true, user }
    }

    @Patch('change-password')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change password' })
    async changePassword(@GetCrmUserId() userId: string, @Body() dto: ChangePasswordDto) {
        await this.crmAuthService.changePassword(userId, dto.oldPassword, dto.newPassword)
        return { success: true, message: 'Password changed successfully' }
    }
}
