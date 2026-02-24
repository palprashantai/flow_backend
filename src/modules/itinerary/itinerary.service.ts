import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Itinerary, ItineraryDay, ItineraryDayActivity } from './itinerary.entity'
import { CreateItineraryDto, UpdateItineraryDto } from './itinerary.dto'

@Injectable()
export class ItineraryService {
    constructor(
        @InjectRepository(Itinerary)
        private readonly itineraryRepository: Repository<Itinerary>,
        @InjectRepository(ItineraryDay)
        private readonly dayRepository: Repository<ItineraryDay>,
        @InjectRepository(ItineraryDayActivity)
        private readonly activityRepository: Repository<ItineraryDayActivity>,
        private readonly dataSource: DataSource
    ) { }

    async create(dto: CreateItineraryDto) {
        const id = await this.generateId()

        return await this.dataSource.transaction(async (manager) => {
            const itinerary = manager.create(Itinerary, {
                id,
                title: dto.title,
                packageId: dto.packageId,
            })
            await manager.save(itinerary)

            for (const dayDto of dto.days) {
                const day = manager.create(ItineraryDay, {
                    itineraryId: id,
                    dayNumber: dayDto.day,
                    title: dayDto.title,
                    description: dayDto.description,
                    meals: dayDto.meals,
                    accommodation: dayDto.accommodation,
                })
                const savedDay = await manager.save(day)

                for (const [index, activityText] of dayDto.activities.entries()) {
                    const activity = manager.create(ItineraryDayActivity, {
                        dayId: savedDay.id,
                        activity: activityText,
                        sortOrder: index,
                    })
                    await manager.save(activity)
                }
            }

            return this.findOne(id)
        })
    }

    async findAll() {
        return this.itineraryRepository.find({ relations: ['package', 'days', 'days.activities'] })
    }

    async findOne(id: string) {
        const itinerary = await this.itineraryRepository.findOne({
            where: { id },
            relations: ['package', 'days', 'days.activities'],
        })
        if (!itinerary) throw new NotFoundException(`Itinerary ${id} not found`)
        return itinerary
    }

    async update(id: string, dto: UpdateItineraryDto) {
        await this.findOne(id)

        return await this.dataSource.transaction(async (manager) => {
            await manager.update(Itinerary, id, {
                title: dto.title,
                packageId: dto.packageId,
            })

            // Replace days and activities
            const existingDays = await manager.find(ItineraryDay, { where: { itineraryId: id } })
            for (const day of existingDays) {
                await manager.delete(ItineraryDayActivity, { dayId: day.id })
            }
            await manager.delete(ItineraryDay, { itineraryId: id })

            for (const dayDto of dto.days) {
                const day = manager.create(ItineraryDay, {
                    itineraryId: id,
                    dayNumber: dayDto.day,
                    title: dayDto.title,
                    description: dayDto.description,
                    meals: dayDto.meals,
                    accommodation: dayDto.accommodation,
                })
                const savedDay = await manager.save(day)

                for (const [index, activityText] of dayDto.activities.entries()) {
                    const activity = manager.create(ItineraryDayActivity, {
                        dayId: savedDay.id,
                        activity: activityText,
                        sortOrder: index,
                    })
                    await manager.save(activity)
                }
            }

            return this.findOne(id)
        })
    }

    async remove(id: string) {
        const itinerary = await this.findOne(id)
        await this.itineraryRepository.remove(itinerary)
        return { success: true, id }
    }

    private async generateId(): Promise<string> {
        const prefix = 'ITI-'
        const count = await this.itineraryRepository.count()
        return `${prefix}${(count + 1).toString().padStart(4, '0')}`
    }
}
