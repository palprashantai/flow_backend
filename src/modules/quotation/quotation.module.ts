import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuotationController } from './quotation.controller'
import { QuotationService } from './quotation.service'
import { Quotation, QuotationItem, QuotationItineraryDay } from './quotation.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Quotation, QuotationItem, QuotationItineraryDay])],
    controllers: [QuotationController],
    providers: [QuotationService],
    exports: [QuotationService],
})
export class QuotationModule { }
