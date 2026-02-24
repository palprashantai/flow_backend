import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, PrimaryGeneratedColumn } from 'typeorm'
import { Booking } from '../booking/booking.entity'
import { Customer } from '../customer/customer.entity'
import { User } from 'modules/user/crm-user.entity'

export enum InvoiceStatus {
    Draft = 'Draft',
    Sent = 'Sent',
    Partial = 'Partial',
    Paid = 'Paid',
    Overdue = 'Overdue',
    Cancelled = 'Cancelled',
}

@Entity('invoices')
export class Invoice {
    @PrimaryColumn({ type: 'char', length: 12 })
    id: string

    @Column({ name: 'booking_id', type: 'char', length: 12 })
    @Index()
    bookingId: string

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'booking_id' })
    booking: Booking

    @Column({ name: 'customer_id', type: 'char', length: 12 })
    @Index()
    customerId: string

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer

    @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
    createdById: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User

    @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.Draft })
    @Index()
    status: InvoiceStatus

    @Column({ name: 'sub_total', type: 'decimal', precision: 14, scale: 2 })
    subTotal: number

    @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    taxAmount: number

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    discount: number

    @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2 })
    totalAmount: number

    @Column({ name: 'amount_paid', type: 'decimal', precision: 14, scale: 2, default: 0 })
    amountPaid: number

    @Column({ type: 'char', length: 3, default: 'INR' })
    currency: string

    @Column({ name: 'due_date', type: 'date', nullable: true })
    dueDate: Date

    @Column({ name: 'sent_at', type: 'datetime', nullable: true })
    sentAt: Date

    @Column({ name: 'paid_at', type: 'datetime', nullable: true })
    paidAt: Date

    @Column({ type: 'text', nullable: true })
    notes: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date

    @OneToMany(() => InvoicePayment, (payment) => payment.invoice)
    payments: InvoicePayment[]
}

@Entity('invoice_payments')
export class InvoicePayment {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ name: 'invoice_id', type: 'char', length: 12 })
    @Index()
    invoiceId: string

    @ManyToOne(() => Invoice, (inv) => inv.payments)
    @JoinColumn({ name: 'invoice_id' })
    invoice: Invoice

    @Column({ type: 'decimal', precision: 14, scale: 2 })
    amount: number

    @Column({ name: 'payment_mode', length: 60, nullable: true })
    paymentMode: string

    @Column({ name: 'reference_no', length: 120, nullable: true })
    referenceNo: string

    @Column({ name: 'paid_on', type: 'date' })
    paidOn: Date

    @Column({ name: 'recorded_by', type: 'char', length: 36, nullable: true })
    recordedById: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'recorded_by' })
    recordedBy: User

    @Column({ type: 'text', nullable: true })
    notes: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date
}
