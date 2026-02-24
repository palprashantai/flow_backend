import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Quotation, QuotationItem, QuotationItineraryDay, QuotationStatus } from './quotation.entity'
import { CreateQuotationDto, UpdateQuotationDto } from './quotation.dto'

@Injectable()
export class QuotationService {
    constructor(
        @InjectRepository(Quotation)
        private readonly quotationRepository: Repository<Quotation>,
        // @InjectRepository(QuotationItem)
        // private readonly itemRepository: Repository<QuotationItem>,
        // @InjectRepository(QuotationItineraryDay)
        // private readonly itinDayRepository: Repository<QuotationItineraryDay>,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateQuotationDto, createdById?: string): Promise<Quotation> {
        const id = await this.generateId()

        return this.dataSource.transaction(async (manager) => {
            // Calculate totals if not provided
            const subTotal = dto.subTotal ?? this.computeSubTotal(dto.items)
            const discountFlat = dto.discountFlat ?? 0
            const discountPct = dto.discountPct ?? 0
            const taxPct = dto.taxPct ?? 0
            const discounted = subTotal - discountFlat - (subTotal * discountPct) / 100
            const totalAmount = dto.totalAmount ?? discounted + (discounted * taxPct) / 100

            const quotation = manager.create(Quotation, {
                id,
                customerId: dto.customerId,
                enquiryId: dto.enquiryId,
                packageId: dto.packageId,
                createdById,
                status: dto.status ?? QuotationStatus.Draft,
                validUntil: dto.validUntil,
                subTotal,
                discountPct,
                discountFlat,
                taxPct,
                totalAmount,
                currency: dto.currency ?? 'INR',
                notes: dto.notes,
            })
            await manager.save(quotation)

            // Save line items
            if (dto.items?.length) {
                let sortOrder = 0
                for (const item of dto.items) {
                    const qi = manager.create(QuotationItem, {
                        quotationId: id,
                        sortOrder: sortOrder++,
                        description: item.description,
                        category: item.category,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity ?? 1,
                    })
                    await manager.save(qi)
                }
            }

            // Save itinerary days
            if (dto.itineraryDays?.length) {
                for (const day of dto.itineraryDays) {
                    const qd = manager.create(QuotationItineraryDay, {
                        quotationId: id,
                        dayNumber: day.dayNumber,
                        title: day.title,
                        description: day.description,
                    })
                    await manager.save(qd)
                }
            }

            return this.findOne(id)
        })
    }

    async findAll(): Promise<Quotation[]> {
        return this.quotationRepository.find({
            relations: ['customer', 'enquiry', 'package', 'createdBy', 'items', 'itineraryDays'],
            order: { createdAt: 'DESC' },
        })
    }

    async findOne(id: string): Promise<Quotation> {
        const q = await this.quotationRepository.findOne({
            where: { id },
            relations: ['customer', 'enquiry', 'package', 'createdBy', 'items', 'itineraryDays'],
        })
        if (!q) throw new NotFoundException(`Quotation ${id} not found`)
        return q
    }

    async findByCustomer(customerId: string): Promise<Quotation[]> {
        return this.quotationRepository.find({
            where: { customerId },
            relations: ['customer', 'items'],
            order: { createdAt: 'DESC' },
        })
    }

    async update(id: string, dto: UpdateQuotationDto): Promise<Quotation> {
        const quotation = await this.findOne(id)

        return this.dataSource.transaction(async (manager) => {
            const subTotal = dto.subTotal ?? Number(quotation.subTotal)
            const discountFlat = dto.discountFlat ?? Number(quotation.discountFlat)
            const discountPct = dto.discountPct ?? Number(quotation.discountPct)
            const taxPct = dto.taxPct ?? Number(quotation.taxPct)
            const discounted = subTotal - discountFlat - (subTotal * discountPct) / 100
            const totalAmount = dto.totalAmount ?? discounted + (discounted * taxPct) / 100

            await manager.update(Quotation, id, {
                customerId: dto.customerId ?? quotation.customerId,
                enquiryId: dto.enquiryId ?? quotation.enquiryId,
                packageId: dto.packageId ?? quotation.packageId,
                status: dto.status ?? quotation.status,
                validUntil: dto.validUntil ?? quotation.validUntil,
                subTotal,
                discountPct,
                discountFlat,
                taxPct,
                totalAmount,
                currency: dto.currency ?? quotation.currency,
                notes: dto.notes ?? quotation.notes,
                sentAt: dto.status === QuotationStatus.Sent && !quotation.sentAt ? new Date() : quotation.sentAt,
                approvedAt: dto.status === QuotationStatus.Approved && !quotation.approvedAt ? new Date() : quotation.approvedAt,
            })

            // Replace items if provided
            if (dto.items !== undefined) {
                await manager.delete(QuotationItem, { quotationId: id })
                let sortOrder = 0
                for (const item of dto.items) {
                    const qi = manager.create(QuotationItem, {
                        quotationId: id,
                        sortOrder: sortOrder++,
                        description: item.description,
                        category: item.category,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity ?? 1,
                    })
                    await manager.save(qi)
                }
            }

            // Replace itinerary days if provided
            if (dto.itineraryDays !== undefined) {
                await manager.delete(QuotationItineraryDay, { quotationId: id })
                for (const day of dto.itineraryDays) {
                    const qd = manager.create(QuotationItineraryDay, {
                        quotationId: id,
                        dayNumber: day.dayNumber,
                        title: day.title,
                        description: day.description,
                    })
                    await manager.save(qd)
                }
            }

            return this.findOne(id)
        })
    }

    async send(id: string): Promise<Quotation> {
        const q = await this.findOne(id)
        if (q.status !== QuotationStatus.Draft) {
            throw new BadRequestException(`Can only send a Draft quotation (currently ${q.status})`)
        }
        q.status = QuotationStatus.Sent
        q.sentAt = new Date()
        return this.quotationRepository.save(q)
    }

    async approve(id: string): Promise<Quotation> {
        const q = await this.findOne(id)
        if (q.status !== QuotationStatus.Sent) {
            throw new BadRequestException(`Can only approve a Sent quotation (currently ${q.status})`)
        }
        q.status = QuotationStatus.Approved
        q.approvedAt = new Date()
        return this.quotationRepository.save(q)
    }

    async remove(id: string): Promise<{ success: boolean; message: string }> {
        const q = await this.findOne(id)
        if (q.status === QuotationStatus.Approved) {
            throw new BadRequestException('Cannot delete an approved quotation')
        }
        await this.quotationRepository.remove(q)
        return { success: true, message: `Quotation ${id} deleted` }
    }

    private computeSubTotal(items?: { unitPrice: number; quantity?: number }[]): number {
        if (!items?.length) return 0
        return items.reduce((sum, i) => sum + i.unitPrice * (i.quantity ?? 1), 0)
    }

    private async generateId(): Promise<string> {
        const last = await this.quotationRepository.find({ order: { createdAt: 'DESC' }, take: 1 })
        if (last.length === 0) return 'QUO-0001'
        const match = last[0].id.match(/\d+$/)
        const num = match ? parseInt(match[0]) + 1 : 1
        return `QUO-${num.toString().padStart(4, '0')}`
    }
}
