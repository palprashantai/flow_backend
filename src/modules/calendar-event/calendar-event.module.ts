import { Module } from '@nestjs/common'
import { CalendarEventController } from './calendar-event.controller'
import { CrmAuthModule } from '../crm-auth/crm-auth.module'

@Module({
    imports: [CrmAuthModule],
    controllers: [CalendarEventController],
    providers: [],
})
export class CalendarEventModule { }
