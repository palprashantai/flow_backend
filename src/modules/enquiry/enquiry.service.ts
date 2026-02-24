import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Enquiry, EnquiryLog, EnquiryStatus } from './enquiry.entity'
import { CreateEnquiryDto, UpdateEnquiryDto } from './enquiry.dto'

@Injectable()
export class EnquiryService {
    constructor(
        @InjectRepository(Enquiry)
        private readonly enquiryRepository: Repository<Enquiry>,
        @InjectRepository(EnquiryLog)
        private readonly enquiryLogRepository: Repository<EnquiryLog>
    ) { }

    async create(dto: CreateEnquiryDto, userId?: string) {
        const id = await this.generateId()
        const enquiry = this.enquiryRepository.create({
            ...dto,
            id,
        })
        const savedEnquiry = await this.enquiryRepository.save(enquiry)

        // Initial log
        await this.logChange(id, userId, 'Creation', 'New enquiry created', null, dto.status)

        return savedEnquiry
    }

    async findAll() {
        return this.enquiryRepository.find({ relations: ['customer', 'assignedAgent'] })
    }

    async findOne(id: string) {
        const enquiry = await this.enquiryRepository.findOne({
            where: { id },
            relations: ['customer', 'assignedAgent', 'logs', 'logs.loggedBy'],
        })
        if (!enquiry) throw new NotFoundException(`Enquiry ${id} not found`)
        return enquiry
    }

    async update(id: string, dto: UpdateEnquiryDto, userId?: string) {
        const enquiry = await this.findOne(id)
        const oldStatus = enquiry.status

        Object.assign(enquiry, dto)
        const updatedEnquiry = await this.enquiryRepository.save(enquiry)

        if (dto.status && dto.status !== oldStatus) {
            await this.logChange(id, userId, 'Status Change', `Status updated from ${oldStatus} to ${dto.status}`, oldStatus, dto.status)
        }

        return updatedEnquiry
    }

    async addLog(id: string, logDto: { type: string; text: string }, userId?: string) {
        return this.logChange(id, userId, logDto.type, logDto.text)
    }

    async remove(id: string) {
        const enquiry = await this.findOne(id)
        await this.enquiryRepository.remove(enquiry)
        return { success: true, id }
    }

    private async logChange(enquiryId: string, userId: string, type: string, note: string, oldStatus?: EnquiryStatus, newStatus?: EnquiryStatus) {
        const log = this.enquiryLogRepository.create({
            enquiryId,
            loggedById: userId,
            logType: type,
            note,
            oldStatus,
            newStatus,
        })
        return this.enquiryLogRepository.save(log)
    }

    private async generateId(): Promise<string> {
        const prefix = 'ENQ-'
        const count = await this.enquiryRepository.count()
        return `${prefix}${(count + 1).toString().padStart(4, '0')}`
    }
}
