import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnquiryController } from './enquiry.controller'
import { EnquiryService } from './enquiry.service'
import { Enquiry, EnquiryLog } from './enquiry.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Enquiry, EnquiryLog])],
    controllers: [EnquiryController],
    providers: [EnquiryService],
    exports: [EnquiryService],
})
export class EnquiryModule { }
