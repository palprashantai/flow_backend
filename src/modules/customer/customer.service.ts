import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Customer } from './customer.entity'
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto'

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>
    ) { }

    async create(dto: CreateCustomerDto) {
        const id = await this.generateId()
        const customer = this.customerRepository.create({
            ...dto,
            id,
        })
        return this.customerRepository.save(customer)
    }

    async findAll() {
        return this.customerRepository.find({ relations: ['assignedAgent'] })
    }

    async findOne(id: string) {
        const customer = await this.customerRepository.findOne({
            where: { id },
            relations: ['assignedAgent'],
        })
        if (!customer) throw new NotFoundException(`Customer ${id} not found`)
        return customer
    }

    async update(id: string, dto: UpdateCustomerDto) {
        const customer = await this.findOne(id)
        Object.assign(customer, dto)
        return this.customerRepository.save(customer)
    }

    async remove(id: string) {
        const customer = await this.findOne(id)
        await this.customerRepository.remove(customer)
        return { success: true, id }
    }

    private async generateId(): Promise<string> {
        const prefix = 'CUST-'
        const count = await this.customerRepository.count()
        return `${prefix}${(count + 1).toString().padStart(4, '0')}`
    }
}
