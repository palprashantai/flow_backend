import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth } from 'modules/auth/auth.guard'
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto'
import { CustomerService } from './customer.service'

@ApiTags('CRM - Customer')
@Controller('appApi/crm/customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Post()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new customer' })
    @ApiResponse({ status: 201, description: 'Customer created successfully' })
    async create(@Body() dto: CreateCustomerDto) {
        const data = await this.customerService.create(dto)
        return { success: true, message: 'Customer created', data }
    }

    @Get()
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all customers' })
    async findAll() {
        const data = await this.customerService.findAll()
        return { success: true, data }
    }

    @Get(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get customer by ID' })
    async findOne(@Param('id') id: string) {
        const data = await this.customerService.findOne(id)
        return { success: true, data }
    }

    @Patch(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a customer' })
    async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
        const data = await this.customerService.update(id, dto)
        return { success: true, message: 'Customer updated', data }
    }

    @Delete(':id')
    @Auth()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a customer' })
    async remove(@Param('id') id: string) {
        return this.customerService.remove(id)
    }
}
