import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { CreateCrmPaymentDto, UpdateCrmPaymentDto } from './crm-payment.dto'
import { Auth } from 'modules/crm-auth/crm-auth.guard'

@ApiTags('CRM - Payment')
@Controller('appApi/crm/payments')
export class CrmPaymentController {
    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    async create(@Body() dto: CreateCrmPaymentDto) {
        return { success: true, message: 'Payment created (Mock)', data: { ...dto, id: 'PAY-' + Date.now() } }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all payments' })
    async findAll() {
        return { success: true, data: [] }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment by ID' })
    async findOne(@Param('id') id: string) {
        return { success: true, data: { id } }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a payment' })
    async update(@Param('id') id: string, @Body() dto: UpdateCrmPaymentDto) {
        return { success: true, message: 'Payment updated (Mock)', data: { id, ...dto } }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a payment' })
    async remove(@Param('id') id: string) {
        return { success: true, message: 'Payment deleted (Mock)', id }
    }
}
