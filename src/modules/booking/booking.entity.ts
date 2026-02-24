import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Customer } from '../customer/customer.entity'
import { Enquiry } from '../enquiry/enquiry.entity'
import { Quotation } from '../quotation/quotation.entity'
import { User } from '../user/user.entity'

export enum BookingStatus {
    Confirmed = 'Confirmed',
    AdvancePaid = 'Advance Paid',
    FullyPaid = 'Fully Paid',
    Cancelled = 'Cancelled',
    Refunded = 'Refunded',
}

@Entity('bookings')
export class Booking {
    @PrimaryColumn({ type: 'char', length: 12 })
    id: string

    @Column({ name: 'customer_id', type: 'char', length: 12 })
    @Index()
    customerId: string

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer

    @Column({ name: 'enquiry_id', type: 'char', length: 12, nullable: true })
    @Index()
    enquiryId: string

    @ManyToOne(() => Enquiry)
    @JoinColumn({ name: 'enquiry_id' })
    enquiry: Enquiry

    @Column({ name: 'quotation_id', type: 'char', length: 12, nullable: true })
    @Index()
    quotationId: string

    @ManyToOne(() => Quotation)
    @JoinColumn({ name: 'quotation_id' })
    quotation: Quotation

    @Column({ name: 'assigned_agent_id', type: 'char', length: 36, nullable: true })
    @Index()
    assignedAgentId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_agent_id' })
    assignedAgent: User

    @Column({ length: 200 })
    destination: string

    @Column({ name: 'departure_date', type: 'date' })
    @Index()
    departureDate: Date

    @Column({ name: 'return_date', type: 'date', nullable: true })
    returnDate: Date

    @Column({ type: 'smallint' })
    pax: number

    @Column({ type: 'decimal', precision: 14, scale: 2 })
    amount: number

    @Column({ type: 'char', length: 3, default: 'INR' })
    currency: string

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Confirmed })
    @Index()
    status: BookingStatus

    @Column({ name: 'special_notes', type: 'text', nullable: true })
    specialNotes: string

    @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
    confirmedAt: Date

    @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
    cancelledAt: Date

    @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
    cancellationReason: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
