import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { QuotationService } from './quotation.service'
import { CreateQuotationDto, UpdateQuotationDto } from './quotation.dto'

@ApiTags('CRM - Quotation')
@Controller('appApi/crm/quotations')
export class QuotationController {
    constructor(private readonly quotationService: QuotationService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new quotation' })
    @ApiResponse({ status: 201, description: 'Quotation created' })
    async create(@Body() dto: CreateQuotationDto, @GetUserId('id') userId: string) {
        const data = await this.quotationService.create(dto, userId)
        return { success: true, data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all quotations' })
    async findAll() {
        const data = await this.quotationService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get quotation by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.quotationService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a quotation' })
    async update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
        const data = await this.quotationService.update(id, dto)
        return { success: true, data }
    }

    @Post(':id/send')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark quotation as Sent' })
    async send(@Param('id') id: string) {
        const data = await this.quotationService.send(id)
        return { success: true, data }
    }

    @Post(':id/approve')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Approve a quotation' })
    async approve(@Param('id') id: string) {
        const data = await this.quotationService.approve(id)
        return { success: true, data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a quotation' })
    async remove(@Param('id') id: string) {
        return this.quotationService.remove(id)
    }
}
