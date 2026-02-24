import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BookingController } from './booking.controller'
import { BookingService } from './booking.service'
import { Booking } from './booking.entity'
import { CrmAuthModule } from '../crm-auth/crm-auth.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking]),
        CrmAuthModule,
    ],
    controllers: [BookingController],
    providers: [BookingService],
    exports: [BookingService],
})
export class BookingModule { }
