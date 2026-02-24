import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { CreateEnquiryDto, UpdateEnquiryDto } from './enquiry.dto'
import { EnquiryService } from './enquiry.service'

@ApiTags('CRM - Enquiry')
@Controller('appApi/crm/enquiries')
export class EnquiryController {
    constructor(private readonly enquiryService: EnquiryService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new enquiry' })
    @ApiResponse({ status: 201, description: 'Enquiry created successfully' })
    async create(@Body() dto: CreateEnquiryDto, @GetUserId('id') userId: string) {
        const data = await this.enquiryService.create(dto, userId)
        return { success: true, message: 'Enquiry created', data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all enquiries' })
    async findAll() {
        const data = await this.enquiryService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get enquiry by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.enquiryService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an enquiry' })
    async update(@Param('id') id: string, @Body() dto: UpdateEnquiryDto, @GetUserId('id') userId: string) {
        const data = await this.enquiryService.update(id, dto, userId)
        return { success: true, message: 'Enquiry updated', data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an enquiry' })
    async remove(@Param('id') id: string) {
        return this.enquiryService.remove(id)
    }

    @Post(':id/logs')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a log to an enquiry' })
    async addLog(@Param('id') id: string, @Body() log: { type: string; text: string }, @GetUserId('id') userId: string) {
        const data = await this.enquiryService.addLog(id, log, userId)
        return { success: true, message: 'Log added', data }
    }
}
