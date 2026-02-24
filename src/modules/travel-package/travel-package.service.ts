import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TravelPackage } from './travel-package.entity'
import { CreateTravelPackageDto, UpdateTravelPackageDto } from './travel-package.dto'

@Injectable()
export class TravelPackageService {
    constructor(
        @InjectRepository(TravelPackage)
        private readonly packageRepository: Repository<TravelPackage>
    ) { }

    async create(dto: CreateTravelPackageDto, userId?: string) {
        const id = await this.generateId()
        const pkg = this.packageRepository.create({
            ...dto,
            id,
            createdById: userId,
        })
        return this.packageRepository.save(pkg)
    }

    async findAll() {
        return this.packageRepository.find({ relations: ['createdBy'] })
    }

    async findOne(id: string) {
        const pkg = await this.packageRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        })
        if (!pkg) throw new NotFoundException(`Package ${id} not found`)
        return pkg
    }

    async update(id: string, dto: UpdateTravelPackageDto) {
        const pkg = await this.findOne(id)
        Object.assign(pkg, dto)
        return this.packageRepository.save(pkg)
    }

    async remove(id: string) {
        const pkg = await this.findOne(id)
        await this.packageRepository.remove(pkg)
        return { success: true, id }
    }

    private async generateId(): Promise<string> {
        const prefix = 'PKG-'
        const count = await this.packageRepository.count()
        return `${prefix}${(count + 1).toString().padStart(4, '0')}`
    }
}
