import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TravelPackageController } from './travel-package.controller'
import { TravelPackageService } from './travel-package.service'
import { TravelPackage } from './travel-package.entity'

@Module({
    imports: [TypeOrmModule.forFeature([TravelPackage])],
    controllers: [TravelPackageController],
    providers: [TravelPackageService],
    exports: [TravelPackageService],
})
export class TravelPackageModule { }
