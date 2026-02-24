import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TravelPackageController } from './travel-package.controller'
import { TravelPackageService } from './travel-package.service'
import { TravelPackage } from './travel-package.entity'
import { CrmAuthModule } from '../crm-auth/crm-auth.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([TravelPackage]),
        CrmAuthModule,
    ],
    controllers: [TravelPackageController],
    providers: [TravelPackageService],
    exports: [TravelPackageService],
})
export class TravelPackageModule { }
