import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth } from 'modules/auth/auth.guard'
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './calendar-event.dto'

@ApiTags('CRM - Calendar Event')
@Controller('appApi/crm/events')
export class CalendarEventController {
    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    async create(@Body() dto: CreateCalendarEventDto) {
        return { success: true, message: 'Event created (Mock)', data: { ...dto, id: 'EVT-' + Date.now() } }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all events' })
    async findAll() {
        return { success: true, data: [] }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get event by ID' })
    async findOne(@Param('id') id: string) {
        return { success: true, data: { id } }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an event' })
    async update(@Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
        return { success: true, message: 'Event updated (Mock)', data: { id, ...dto } }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an event' })
    async remove(@Param('id') id: string) {
        return { success: true, message: 'Event deleted (Mock)', id }
    }
}
