import { Module } from '@nestjs/common'
import { CalendarEventController } from './calendar-event.controller'

@Module({
    controllers: [CalendarEventController],
    providers: [],
})
export class CalendarEventModule { }
