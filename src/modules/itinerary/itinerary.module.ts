import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { Itinerary, ItineraryDay, ItineraryDayActivity } from './itinerary.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Itinerary, ItineraryDay, ItineraryDayActivity])],
    controllers: [ItineraryController],
    providers: [ItineraryService],
    exports: [ItineraryService],
})
export class ItineraryModule { }
