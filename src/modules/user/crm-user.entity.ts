import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn  } from 'typeorm'

export enum UserRole {
    SuperAdmin = 'SuperAdmin',
    Admin = 'Admin',
    Agent = 'Agent',
}

@Entity('users')
export class User {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string

    @Column({ length: 120 })
    name: string

    @Column({ length: 255, unique: true })
    email: string

    @Column({ name: 'password_hash', type: 'text' })
    passwordHash: string

    @Column({ type: 'enum', enum: UserRole, default: UserRole.Agent })
    role: UserRole

    @Column({ name: 'is_active', default: 1 })
    isActive: number

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl: string

    @Column({ length: 30, nullable: true })
    phone: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
