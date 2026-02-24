import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetCrmUserId } from 'modules/crm-auth/crm-auth.guard'
import { CreateTravelPackageDto, UpdateTravelPackageDto } from './travel-package.dto'
import { TravelPackageService } from './travel-package.service'

@ApiTags('CRM - Travel Package')
@Controller('appApi/crm/packages')
export class TravelPackageController {
    constructor(private readonly travelPackageService   : TravelPackageService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new travel package' })
    @ApiResponse({ status: 201, description: 'Package created successfully' })
    async create(@Body() dto: CreateTravelPackageDto, @GetCrmUserId('id') userId: string) {
        const data = await this.travelPackageService.create(dto, userId)
        return { success: true, message: 'Package created', data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all travel packages' })
    async findAll() {
        const data = await this.travelPackageService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get package by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.travelPackageService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a package' })
    async update(@Param('id') id: string, @Body() dto: UpdateTravelPackageDto) {
        const data = await this.travelPackageService.update(id, dto)
        return { success: true, message: 'Package updated', data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a package' })
    async remove(@Param('id') id: string) {
        return this.travelPackageService.remove(id)
    }
}
