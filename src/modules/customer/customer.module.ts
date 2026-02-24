import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CustomerController } from './customer.controller'
import { CustomerService } from './customer.service'
import { Customer } from './customer.entity'
import { CrmAuthModule } from '../crm-auth/crm-auth.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Customer]),
        CrmAuthModule,
    ],
    controllers: [CustomerController],
    providers: [CustomerService],
    exports: [CustomerService],
})
export class CustomerModule { }
