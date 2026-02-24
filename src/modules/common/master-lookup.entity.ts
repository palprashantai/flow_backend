import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, Unique } from 'typeorm'

@Entity('master_lookup')
@Unique(['type', 'code'])
export class MasterLookup {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    @Index()
    type: string

    @Column({ length: 50 })
    code: string

    @Column({ length: 100 })
    label: string

    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number

    @Column({ name: 'is_active', default: 1 })
    isActive: number

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date
}
