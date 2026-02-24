import { User } from 'modules/user/crm-user.entity'
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn  } from 'typeorm'

export enum PackageStatus {
    Active = 'Active',
    Inactive = 'Inactive',
    Archived = 'Archived',
}

@Entity('travel_packages')
export class TravelPackage {
    @PrimaryColumn({ type: 'char', length: 12 })
    id: string

    @Column({ length: 255, unique: true })
    name: string

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ length: 200, nullable: true })
    destination: string

    @Column({ name: 'duration_days', type: 'smallint', nullable: true })
    durationDays: number

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cost: number

    @Column({ type: 'char', length: 3, default: 'INR' })
    currency: string

    @Column({ type: 'enum', enum: PackageStatus, default: PackageStatus.Active })
    status: PackageStatus

    @Column({ type: 'json', nullable: true })
    inclusions: string[]

    @Column({ type: 'json', nullable: true })
    exclusions: string[]

    @Column({ name: 'created_by', type: 'char', length: 36, nullable: true })
    createdById: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
