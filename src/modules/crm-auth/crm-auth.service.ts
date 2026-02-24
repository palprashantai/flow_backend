import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { CrmLoginDto, CrmRegisterDto } from './crm-auth.dto'
import { User, UserRole } from 'modules/user/crm-user.entity'

@Injectable()
export class CrmAuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Register a new CRM user (Admin creates agents).
     */
    async register(dto: CrmRegisterDto): Promise<Omit<User, 'passwordHash'>> {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } })
        if (existing) throw new ConflictException('A user with this email already exists')

        const passwordHash = await bcrypt.hash(dto.password, 12)
        const newUser = this.userRepository.create({
            id: this.generateUUID(),
            name: dto.name,
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            role: dto.role ?? UserRole.Agent,
            phone: dto.phone,
            isActive: 1,
        })

        const saved = await this.userRepository.save(newUser)
        const { passwordHash: _, ...safeUser } = saved
        return safeUser
    }

    /**
     * Login with email + password, returns JWT.
     */
    async login(dto: CrmLoginDto): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
        const user = await this.userRepository.findOne({ where: { email: dto.email.toLowerCase().trim() } })

        if (!user) throw new UnauthorizedException('Invalid email or password')
        if (!user.isActive) throw new UnauthorizedException('Account is deactivated. Contact your administrator.')

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)
        if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password')

        const token = this.jwtService.sign(
            { id: user.id, role: user.role },
            {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION') || '8h',
            },
        )

        const { passwordHash: _, ...safeUser } = user
        return { token, user: safeUser }
    }

    /**
     * Get user by ID (for guard validation).
     */
    async getUserById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id, isActive: 1 } })
    }

    /**
     * Change password for authenticated user.
     */
    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundException('User not found')

        const isValid = await bcrypt.compare(oldPassword, user.passwordHash)
        if (!isValid) throw new BadRequestException('Current password is incorrect')

        user.passwordHash = await bcrypt.hash(newPassword, 12)
        await this.userRepository.save(user)
    }

    /**
     * Get the profile of the currently logged-in user.
     */
    async getMe(userId: string): Promise<Omit<User, 'passwordHash'>> {
        const user = await this.userRepository.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundException('User not found')
        const { passwordHash: _, ...safeUser } = user
        return safeUser
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
        })
    }
}
