import { Module } from '@nestjs/common'
import { CrmPaymentController } from './crm-payment.controller'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({   
    imports: [TypeOrmModule.forFeature([])],
    controllers: [CrmPaymentController],
    providers: [],
})
export class CrmPaymentModule { }
