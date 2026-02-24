import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { User } from '../user/user.entity'

export enum LeadSource {
    WhatsApp = 'WhatsApp',
    Website = 'Website',
    Referral = 'Referral',
    WalkIn = 'Walk-in',
    Social = 'Social',
    Other = 'Other',
}

export enum CustomerTier {
    Platinum = 'Platinum',
    Gold = 'Gold',
    Silver = 'Silver',
    Bronze = 'Bronze',
}

@Entity('customers')
export class Customer {
    @PrimaryColumn({ type: 'char', length: 12 })
    id: string

    @Column({ length: 180 })
    name: string

    @Column({ length: 255, unique: true, nullable: true })
    email: string

    @Column({ length: 30, nullable: true })
    phone: string

    @Column({ length: 100, nullable: true })
    city: string

    @Column({ length: 100, nullable: true })
    country: string

    @Column({ type: 'enum', enum: LeadSource, default: LeadSource.Other })
    @Index()
    source: LeadSource

    @Column({ type: 'enum', enum: CustomerTier, default: CustomerTier.Bronze })
    @Index()
    tier: CustomerTier

    @Column({ type: 'json', nullable: true })
    tags: string[]

    @Column({ type: 'text', nullable: true })
    notes: string

    @Column({ name: 'assigned_agent_id', type: 'char', length: 36, nullable: true })
    @Index()
    assignedAgentId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_agent_id' })
    assignedAgent: User

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
