import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Invoice, InvoicePayment, InvoiceStatus } from './invoice.entity'
import { CreateInvoiceDto, UpdateInvoiceDto, RecordPaymentDto } from './invoice.dto'

@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(InvoicePayment)
        private readonly paymentRepository: Repository<InvoicePayment>,
        private readonly dataSource: DataSource,
    ) { }

    async create(dto: CreateInvoiceDto, createdById?: string): Promise<Invoice> {
        const id = await this.generateId()
        const invoice = this.invoiceRepository.create({
            id,
            bookingId: dto.bookingId,
            customerId: dto.customerId,
            createdById,
            status: dto.status ?? InvoiceStatus.Draft,
            subTotal: dto.subTotal,
            taxAmount: dto.taxAmount ?? 0,
            discount: dto.discount ?? 0,
            totalAmount: dto.totalAmount,
            amountPaid: 0,
            currency: dto.currency ?? 'INR',
            dueDate: dto.dueDate,
            notes: dto.notes,
        })
        return this.invoiceRepository.save(invoice)
    }

    async findAll(): Promise<Invoice[]> {
        return this.invoiceRepository.find({
            relations: ['booking', 'customer', 'createdBy', 'payments'],
            order: { createdAt: 'DESC' },
        })
    }

    async findOne(id: string): Promise<Invoice> {
        const invoice = await this.invoiceRepository.findOne({
            where: { id },
            relations: ['booking', 'customer', 'createdBy', 'payments', 'payments.recordedBy'],
        })
        if (!invoice) throw new NotFoundException(`Invoice ${id} not found`)
        return invoice
    }

    async findByBooking(bookingId: string): Promise<Invoice[]> {
        return this.invoiceRepository.find({
            where: { bookingId },
            relations: ['payments'],
        })
    }

    async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
        const invoice = await this.findOne(id)
        if (invoice.status === InvoiceStatus.Paid) {
            throw new BadRequestException('Cannot edit a fully paid invoice')
        }
        Object.assign(invoice, {
            status: dto.status ?? invoice.status,
            subTotal: dto.subTotal ?? invoice.subTotal,
            taxAmount: dto.taxAmount ?? invoice.taxAmount,
            discount: dto.discount ?? invoice.discount,
            totalAmount: dto.totalAmount ?? invoice.totalAmount,
            currency: dto.currency ?? invoice.currency,
            dueDate: dto.dueDate ?? invoice.dueDate,
            notes: dto.notes ?? invoice.notes,
        })
        return this.invoiceRepository.save(invoice)
    }

    async send(id: string): Promise<Invoice> {
        const invoice = await this.findOne(id)
        if (invoice.status !== InvoiceStatus.Draft) {
            throw new BadRequestException(`Invoice must be in Draft status to send (currently ${invoice.status})`)
        }
        invoice.status = InvoiceStatus.Sent
        invoice.sentAt = new Date()
        return this.invoiceRepository.save(invoice)
    }

    /**
     * Record a payment against an invoice.
     * Mirrors the SQL trigger logic: recalculates amountPaid and auto-updates status.
     */
    async recordPayment(invoiceId: string, dto: RecordPaymentDto, recordedById?: string): Promise<Invoice> {
        const invoice = await this.findOne(invoiceId)

        if (invoice.status === InvoiceStatus.Cancelled) {
            throw new BadRequestException('Cannot record payment on a cancelled invoice')
        }

        return this.dataSource.transaction(async (manager) => {
            const payment = manager.create(InvoicePayment, {
                invoiceId,
                amount: dto.amount,
                paymentMode: dto.paymentMode,
                referenceNo: dto.referenceNo,
                paidOn: dto.paidOn ?? new Date().toISOString().split('T')[0],
                recordedById,
                notes: dto.notes,
            })
            await manager.save(payment)

            // Re-aggregate total payments (mirrors SQL trigger)
            const allPayments = await manager.find(InvoicePayment, { where: { invoiceId } })
            const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

            let newStatus: InvoiceStatus = invoice.status
            if (totalPaid >= Number(invoice.totalAmount)) {
                newStatus = InvoiceStatus.Paid
                invoice.paidAt = new Date()
            } else if (totalPaid > 0) {
                newStatus = InvoiceStatus.Partial
            }

            await manager.update(Invoice, invoiceId, {
                amountPaid: totalPaid,
                status: newStatus,
                paidAt: newStatus === InvoiceStatus.Paid ? invoice.paidAt : undefined,
            })

            return this.findOne(invoiceId)
        })
    }

    async getPayments(invoiceId: string): Promise<InvoicePayment[]> {
        await this.findOne(invoiceId) // ensure exists
        return this.paymentRepository.find({
            where: { invoiceId },
            relations: ['recordedBy'],
            order: { createdAt: 'DESC' },
        })
    }

    async remove(id: string): Promise<{ success: boolean; message: string }> {
        const invoice = await this.findOne(id)
        if (invoice.status === InvoiceStatus.Paid) {
            throw new BadRequestException('Cannot delete a paid invoice')
        }
        await this.invoiceRepository.remove(invoice)
        return { success: true, message: `Invoice ${id} deleted` }
    }

    private async generateId(): Promise<string> {
        const last = await this.invoiceRepository.find({ order: { createdAt: 'DESC' }, take: 1 })
        if (last.length === 0) return 'INV-0001'
        const match = last[0].id.match(/\d+$/)
        const num = match ? parseInt(match[0]) + 1 : 1
        return `INV-${num.toString().padStart(4, '0')}`
    }
}
