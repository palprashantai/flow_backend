import { Module } from '@nestjs/common'
import { CrmPaymentController } from './crm-payment.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CrmAuthModule } from '../crm-auth/crm-auth.module'

@Module({   
    imports: [
        TypeOrmModule.forFeature([]),
        CrmAuthModule,
    ],
    controllers: [CrmPaymentController],
    providers: [],
})
export class CrmPaymentModule { }
