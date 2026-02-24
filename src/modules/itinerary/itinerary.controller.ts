import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth  } from 'modules/auth/auth.guard'
import { CreateItineraryDto, UpdateItineraryDto } from './itinerary.dto'
import { ItineraryService } from './itinerary.service'

@ApiTags('CRM - Itinerary')
@Controller('appApi/crm/itineraries')
export class ItineraryController {
    constructor(private readonly itineraryService: ItineraryService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new itinerary' })
    @ApiResponse({ status: 201, description: 'Itinerary created successfully' })
    async create(@Body() dto: CreateItineraryDto) {
        const data = await this.itineraryService.create(dto)
        return { success: true, message: 'Itinerary created', data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all itineraries' })
    async findAll() {
        const data = await this.itineraryService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get itinerary by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.itineraryService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an itinerary' })
    async update(@Param('id') id: string, @Body() dto: UpdateItineraryDto) {
        const data = await this.itineraryService.update(id, dto)
        return { success: true, message: 'Itinerary updated', data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an itinerary' })
    async remove(@Param('id') id: string) {
        return this.itineraryService.remove(id)
    }
}
