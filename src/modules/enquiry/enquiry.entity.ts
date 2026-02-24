import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm'
import { Customer, LeadSource } from '../customer/customer.entity'
import { User } from '../user/user.entity'

export enum EnquiryStatus {
    New = 'New',
    Contacted = 'Contacted',
    Qualified = 'Qualified',
    ProposalSent = 'Proposal Sent',
    Won = 'Won',
    Lost = 'Lost',
    OnHold = 'On Hold',
}

@Entity('enquiries')
export class Enquiry {
    @PrimaryColumn({ type: 'char', length: 12 })
    id: string

    @Column({ name: 'customer_id', type: 'char', length: 12 })
    @Index()
    customerId: string

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer

    @Column({ length: 200 })
    destination: string

    @Column({ type: 'smallint' })
    pax: number

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    budget: number

    @Column({ name: 'budget_currency', type: 'char', length: 3, default: 'INR' })
    budgetCurrency: string

    @Column({ type: 'enum', enum: LeadSource, nullable: true })
    source: LeadSource

    @Column({ type: 'enum', enum: EnquiryStatus, default: EnquiryStatus.New })
    @Index()
    status: EnquiryStatus

    @Column({ name: 'assigned_agent_id', type: 'char', length: 36, nullable: true })
    @Index()
    assignedAgentId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_agent_id' })
    assignedAgent: User

    @Column({ name: 'travel_date_from', type: 'date', nullable: true })
    travelDateFrom: Date

    @Column({ name: 'travel_date_to', type: 'date', nullable: true })
    travelDateTo: Date

    @Column({ name: 'converted_at', type: 'datetime', nullable: true })
    convertedAt: Date

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date

    @OneToMany(() => EnquiryLog, (log) => log.enquiry)
    logs: EnquiryLog[]
}

@Entity('enquiry_logs')
export class EnquiryLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ name: 'enquiry_id', type: 'char', length: 12 })
    @Index()
    enquiryId: string

    @ManyToOne(() => Enquiry, (enquiry) => enquiry.logs)
    @JoinColumn({ name: 'enquiry_id' })
    enquiry: Enquiry

    @Column({ name: 'logged_by', type: 'char', length: 36, nullable: true })
    loggedById: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'logged_by' })
    loggedBy: User

    @Column({ name: 'log_type', length: 50 })
    logType: string

    @Column({ type: 'text', nullable: true })
    note: string

    @Column({ name: 'old_status', type: 'enum', enum: EnquiryStatus, nullable: true })
    oldStatus: EnquiryStatus

    @Column({ name: 'new_status', type: 'enum', enum: EnquiryStatus, nullable: true })
    newStatus: EnquiryStatus

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date
}
