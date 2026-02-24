import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'
import { CrmUserService } from './crm-user.service'
import { CrmUserController } from './crm-user.controller'
import { CrmAuthModule } from '../crm-auth/crm-auth.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        CrmAuthModule, // for CrmAuthGuard
    ],
    controllers: [CrmUserController],
    providers: [CrmUserService],
    exports: [CrmUserService],
})
export class CrmUserModule { }
