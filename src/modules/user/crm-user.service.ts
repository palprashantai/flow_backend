import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User, UserRole } from './user.entity'
import { CreateCrmUserDto, UpdateCrmUserDto } from './crm-user.dto'

@Injectable()
export class CrmUserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(dto: CreateCrmUserDto): Promise<Omit<User, 'passwordHash'>> {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } })
        if (existing) throw new ConflictException('A user with this email already exists')

        const passwordHash = await bcrypt.hash(dto.password, 12)
        const user = this.userRepository.create({
            id: this.generateUUID(),
            name: dto.name,
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            role: dto.role ?? UserRole.Agent,
            phone: dto.phone,
            avatarUrl: dto.avatarUrl,
            isActive: 1,
        })

        const saved = await this.userRepository.save(user)
        const { passwordHash: _, ...safeUser } = saved
        return safeUser
    }

    async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
        const users = await this.userRepository.find({ order: { createdAt: 'DESC' } })
        return users.map(({ passwordHash, ...u }) => u)
    }

    async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
        const user = await this.userRepository.findOne({ where: { id } })
        if (!user) throw new NotFoundException(`User ${id} not found`)
        const { passwordHash: _, ...safeUser } = user
        return safeUser
    }

    async update(id: string, dto: UpdateCrmUserDto): Promise<Omit<User, 'passwordHash'>> {
        const user = await this.userRepository.findOne({ where: { id } })
        if (!user) throw new NotFoundException(`User ${id} not found`)

        if (dto.email && dto.email !== user.email) {
            const existing = await this.userRepository.findOne({ where: { email: dto.email } })
            if (existing) throw new ConflictException('Email already in use')
            user.email = dto.email.toLowerCase().trim()
        }

        if (dto.name) user.name = dto.name
        if (dto.role) user.role = dto.role
        if (dto.phone !== undefined) user.phone = dto.phone
        if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl
        if (dto.isActive !== undefined) user.isActive = dto.isActive

        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, 12)
        }

        const saved = await this.userRepository.save(user)
        const { passwordHash: _, ...safeUser } = saved
        return safeUser
    }

    async toggleActive(id: string): Promise<{ id: string; isActive: number }> {
        const user = await this.userRepository.findOne({ where: { id } })
        if (!user) throw new NotFoundException(`User ${id} not found`)
        user.isActive = user.isActive === 1 ? 0 : 1
        await this.userRepository.save(user)
        return { id, isActive: user.isActive }
    }

    async remove(id: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userRepository.findOne({ where: { id } })
        if (!user) throw new NotFoundException(`User ${id} not found`)
        await this.userRepository.remove(user)
        return { success: true, message: `User ${id} deleted` }
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
        })
    }
}
