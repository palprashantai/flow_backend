import { Module } from '@nestjs/common'
import { CrmPaymentController } from './crm-payment.controller'

@Module({
    controllers: [CrmPaymentController],
    providers: [],
})
export class CrmPaymentModule { }
