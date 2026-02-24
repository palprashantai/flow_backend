import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BookingController } from './booking.controller'
import { BookingService } from './booking.service'
import { Booking } from './booking.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Booking])],
    controllers: [BookingController],
    providers: [BookingService],
    exports: [BookingService],
})
export class BookingModule { }
