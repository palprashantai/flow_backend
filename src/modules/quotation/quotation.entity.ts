import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, PrimaryGeneratedColumn } from 'typeorm'
import { Customer } from '../customer/customer.entity'
import { Enquiry } from '../enquiry/enquiry.entity'
import { TravelPackage } from '../travel-package/travel-package.entity'
import { User } from '../user/user.entity'

export enum QuotationStatus {
    Draft = 'Draft',
    Sent = 'Sent',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Expired = 'Expired',
}

@Entity('quotations')
export class Quotation {
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

    @Column({ name: 'package_id', type: 'char', length: 12, nullable: true })
    @Index()
    packageId: string

    @ManyToOne(() => TravelPackage)
    @JoinColumn({ name: 'package_id' })
    package: TravelPackage

    @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
    createdById: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User

    @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.Draft })
    status: QuotationStatus

    @Column({ name: 'valid_until', type: 'date', nullable: true })
    validUntil: Date

    @Column({ name: 'sub_total', type: 'decimal', precision: 14, scale: 2, default: 0 })
    subTotal: number

    @Column({ name: 'discount_pct', type: 'decimal', precision: 5, scale: 2, default: 0 })
    discountPct: number

    @Column({ name: 'discount_flat', type: 'decimal', precision: 12, scale: 2, default: 0 })
    discountFlat: number

    @Column({ name: 'tax_pct', type: 'decimal', precision: 5, scale: 2, default: 0 })
    taxPct: number

    @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalAmount: number

    @Column({ type: 'char', length: 3, default: 'INR' })
    currency: string

    @Column({ type: 'text', nullable: true })
    notes: string

    @Column({ name: 'sent_at', type: 'datetime', nullable: true })
    sentAt: Date

    @Column({ name: 'approved_at', type: 'datetime', nullable: true })
    approvedAt: Date

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date

    @OneToMany(() => QuotationItem, (item) => item.quotation)
    items: QuotationItem[]

    @OneToMany(() => QuotationItineraryDay, (day) => day.quotation)
    itineraryDays: QuotationItineraryDay[]
}

@Entity('quotation_items')
export class QuotationItem {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ name: 'quotation_id', type: 'char', length: 12 })
    @Index()
    quotationId: string

    @ManyToOne(() => Quotation, (q) => q.items)
    @JoinColumn({ name: 'quotation_id' })
    quotation: Quotation

    @Column({ name: 'sort_order', type: 'smallint', default: 0 })
    sortOrder: number

    @Column({ length: 500 })
    description: string

    @Column({ length: 100, nullable: true })
    category: string

    @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
    unitPrice: number

    @Column({ type: 'smallint', default: 1 })
    quantity: number

    @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, insert: false, update: false })
    totalPrice: number
}

@Entity('quotation_itinerary_days')
export class QuotationItineraryDay {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ name: 'quotation_id', type: 'char', length: 12 })
    @Index()
    quotationId: string

    @ManyToOne(() => Quotation, (q) => q.itineraryDays)
    @JoinColumn({ name: 'quotation_id' })
    quotation: Quotation

    @Column({ name: 'day_number', type: 'smallint' })
    dayNumber: number

    @Column({ length: 255, nullable: true })
    title: string

    @Column({ type: 'text', nullable: true })
    description: string
}
