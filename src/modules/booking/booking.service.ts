import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Booking, BookingStatus } from './booking.entity'
import { CreateBookingDto, UpdateBookingDto } from './booking.dto'

@Injectable()
export class BookingService {
    constructor(
        @InjectRepository(Booking)
        private readonly bookingRepository: Repository<Booking>,
    ) { }

    async create(dto: CreateBookingDto, createdById?: string): Promise<Booking> {
        const id = await this.generateId()
        const booking = this.bookingRepository.create({
            id,
            customerId: dto.customerId,
            enquiryId: dto.enquiryId,
            quotationId: dto.quotationId,
            assignedAgentId: createdById,
            destination: dto.destination,
            departureDate: dto.departureDate,
            returnDate: dto.returnDate,
            pax: dto.pax,
            amount: dto.amount,
            currency: dto.currency ?? 'INR',
            status: dto.status ?? BookingStatus.Confirmed,
            specialNotes: dto.specialNotes,
            confirmedAt: dto.status === BookingStatus.Confirmed ? new Date() : null,
        })
        return this.bookingRepository.save(booking)
    }

    async findAll(): Promise<Booking[]> {
        return this.bookingRepository.find({
            relations: ['customer', 'enquiry', 'quotation', 'assignedAgent'],
            order: { createdAt: 'DESC' },
        })
    }

    async findOne(id: string): Promise<Booking> {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: ['customer', 'enquiry', 'quotation', 'assignedAgent'],
        })
        if (!booking) throw new NotFoundException(`Booking ${id} not found`)
        return booking
    }

    async findByCustomer(customerId: string): Promise<Booking[]> {
        return this.bookingRepository.find({
            where: { customerId },
            relations: ['customer', 'enquiry', 'quotation'],
            order: { createdAt: 'DESC' },
        })
    }

    async update(id: string, dto: UpdateBookingDto): Promise<Booking> {
        const booking = await this.findOne(id)
        const oldStatus = booking.status

        Object.assign(booking, {
            customerId: dto.customerId ?? booking.customerId,
            enquiryId: dto.enquiryId ?? booking.enquiryId,
            quotationId: dto.quotationId ?? booking.quotationId,
            destination: dto.destination ?? booking.destination,
            departureDate: dto.departureDate ?? booking.departureDate,
            returnDate: dto.returnDate ?? booking.returnDate,
            pax: dto.pax ?? booking.pax,
            amount: dto.amount ?? booking.amount,
            currency: dto.currency ?? booking.currency,
            status: dto.status ?? booking.status,
            specialNotes: dto.specialNotes ?? booking.specialNotes,
        })

        // Track status transition timestamps
        if (dto.status && dto.status !== oldStatus) {
            if (dto.status === BookingStatus.Confirmed && !booking.confirmedAt) {
                booking.confirmedAt = new Date()
            }
            if (dto.status === BookingStatus.Cancelled) {
                booking.cancelledAt = new Date()
                if (dto.cancellationReason) booking.cancellationReason = dto.cancellationReason
            }
        }

        return this.bookingRepository.save(booking)
    }

    async cancel(id: string, reason?: string): Promise<Booking> {
        const booking = await this.findOne(id)
        if (booking.status === BookingStatus.Cancelled) {
            throw new BadRequestException('Booking is already cancelled')
        }
        booking.status = BookingStatus.Cancelled
        booking.cancelledAt = new Date()
        booking.cancellationReason = reason
        return this.bookingRepository.save(booking)
    }

    async remove(id: string): Promise<{ success: boolean; message: string }> {
        const booking = await this.findOne(id)
        await this.bookingRepository.remove(booking)
        return { success: true, message: `Booking ${id} deleted` }
    }

    private async generateId(): Promise<string> {
        const last = await this.bookingRepository.find({ order: { createdAt: 'DESC' }, take: 1 })
        if (last.length === 0) return 'BK-0001'
        // Extract numeric part safely
        const match = last[0].id.match(/\d+$/)
        const num = match ? parseInt(match[0]) + 1 : 1
        return `BK-${num.toString().padStart(4, '0')}`
    }
}
