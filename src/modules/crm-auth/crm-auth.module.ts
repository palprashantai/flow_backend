import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CrmAuthController } from './crm-auth.controller'
import { CrmAuthService } from './crm-auth.service'
import { CrmAuthGuard } from './crm-auth.guard'
import { User } from 'modules/user/crm-user.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
                signOptions: { expiresIn: config.get('JWT_EXPIRATION') || '8h' },
            }),
        }),
    ],
    controllers: [CrmAuthController],
    providers: [CrmAuthService, CrmAuthGuard],
    exports: [CrmAuthService, CrmAuthGuard],
})
export class CrmAuthModule { }
