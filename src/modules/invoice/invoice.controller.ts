import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'


import { InvoiceService } from './invoice.service'
import { CreateInvoiceDto, UpdateInvoiceDto, RecordPaymentDto } from './invoice.dto'
import { Auth, GetCrmUserId } from 'modules/crm-auth/crm-auth.guard'

@ApiTags('CRM - Invoice')
@Controller('appApi/crm/invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new invoice' })
    @ApiResponse({ status: 201, description: 'Invoice created' })
    async create(@Body() dto: CreateInvoiceDto, @GetCrmUserId('id') userId: string) {
        const data = await this.invoiceService.create(dto, userId)
        return { success: true, data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all invoices' })
    async findAll() {
        const data = await this.invoiceService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoice by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.invoiceService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an invoice' })
    async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
        const data = await this.invoiceService.update(id, dto)
        return { success: true, data }
    }

    @Post(':id/send')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark invoice as Sent' })
    async send(@Param('id') id: string) {
        const data = await this.invoiceService.send(id)
        return { success: true, data }
    }

    @Post(':id/payments')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Record a payment against an invoice' })
    async recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto, @GetCrmUserId('id') userId: string) {
        const data = await this.invoiceService.recordPayment(id, dto, userId)
        return { success: true, data }
    }

    @Get(':id/payments')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all payments for an invoice' })
    async getPayments(@Param('id') id: string) {
        const data = await this.invoiceService.getPayments(id)
        return { success: true, data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an invoice' })
    async remove(@Param('id') id: string) {
        return this.invoiceService.remove(id)
    }
}
