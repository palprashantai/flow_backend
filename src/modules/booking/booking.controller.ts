import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { BookingService } from './booking.service'
import { CreateBookingDto, UpdateBookingDto, CancelBookingDto } from './booking.dto'

@ApiTags('CRM - Booking')
@Controller('appApi/crm/bookings')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new booking' })
    @ApiResponse({ status: 201, description: 'Booking created' })
    async create(@Body() dto: CreateBookingDto, @GetUserId('id') userId: string) {
        const data = await this.bookingService.create(dto, userId)
        return { success: true, data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all bookings' })
    async findAll() {
        const data = await this.bookingService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get booking by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.bookingService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a booking' })
    async update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
        const data = await this.bookingService.update(id, dto)
        return { success: true, data }
    }

    @Post(':id/cancel')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel a booking' })
    async cancel(@Param('id') id: string, @Body() dto: CancelBookingDto) {
        const data = await this.bookingService.cancel(id, dto.reason)
        return { success: true, data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a booking' })
    async remove(@Param('id') id: string) {
        return this.bookingService.remove(id)
    }
}
