import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CrmUserService } from './crm-user.service'
import { CreateCrmUserDto, UpdateCrmUserDto } from './crm-user.dto'
import { Auth, GetCrmUserId } from '../crm-auth/crm-auth.guard'

@ApiTags('CRM - Users')
@Controller('appApi/crm/users')
export class CrmUserController {
    constructor(private readonly crmUserService: CrmUserService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new CRM user (Admin only)' })
    async create(@Body() dto: CreateCrmUserDto) {
        const user = await this.crmUserService.create(dto)
        return { success: true, user }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all CRM users' })
    async findAll() {
        const data = await this.crmUserService.findAll()
        return { success: true, data }
    }

    @Get('me')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@GetCrmUserId() userId: string) {
        const user = await this.crmUserService.findOne(userId)
        return { success: true, user }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get CRM user by ID' })
    async findOne(@Param('id') id: string) {
        const user = await this.crmUserService.findOne(id)
        return { success: true, user }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a CRM user' })
    async update(@Param('id') id: string, @Body() dto: UpdateCrmUserDto) {
        const user = await this.crmUserService.update(id, dto)
        return { success: true, user }
    }

    @Post(':id/toggle-active')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle user active/inactive' })
    async toggleActive(@Param('id') id: string) {
        const result = await this.crmUserService.toggleActive(id)
        return { success: true, ...result }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a CRM user' })
    async remove(@Param('id') id: string) {
        return this.crmUserService.remove(id)
    }
}
