import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, PrimaryGeneratedColumn } from 'typeorm'
import { TravelPackage } from '../travel-package/travel-package.entity'

@Entity('itineraries')
export class Itinerary {
    @PrimaryColumn({ type: 'char', length: 12 })
    id: string

    @Column({ length: 255 })
    title: string

    @Column({ name: 'package_id', type: 'char', length: 12 })
    @Index()
    packageId: string

    @ManyToOne(() => TravelPackage)
    @JoinColumn({ name: 'package_id' })
    package: TravelPackage

    @OneToMany(() => ItineraryDay, (day) => day.itinerary)
    days: ItineraryDay[]

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}

@Entity('itinerary_days')
export class ItineraryDay {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ name: 'itinerary_id', type: 'char', length: 12 })
    @Index()
    itineraryId: string

    @ManyToOne(() => Itinerary, (itin) => itin.days)
    @JoinColumn({ name: 'itinerary_id' })
    itinerary: Itinerary

    @Column({ name: 'day_number', type: 'smallint' })
    dayNumber: number

    @Column({ length: 255, nullable: true })
    title: string

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ type: 'json', nullable: true })
    meals: string[]

    @Column({ length: 255, nullable: true })
    accommodation: string

    @OneToMany(() => ItineraryDayActivity, (activity) => activity.day)
    activities: ItineraryDayActivity[]
}

@Entity('itinerary_day_activities')
export class ItineraryDayActivity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string

    @Column({ name: 'day_id', type: 'bigint' })
    @Index()
    dayId: string

    @ManyToOne(() => ItineraryDay, (day) => day.activities)
    @JoinColumn({ name: 'day_id' })
    day: ItineraryDay

    @Column({ name: 'sort_order', type: 'smallint', default: 0 })
    sortOrder: number

    @Column({ type: 'text' })
    activity: string

    @Column({ name: 'duration_mins', type: 'smallint', nullable: true })
    durationMins: number

    @Column({ length: 255, nullable: true })
    location: string
}
