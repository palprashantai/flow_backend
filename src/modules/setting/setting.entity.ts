import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('tbl_log_streetfolio_events')
export class AppEventLog {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  screen_name?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  event_type?: string

  @Index()
  @Column({ type: 'int', default: 0 })
  subscriberid: number

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id?: string

  @Column({ type: 'text', nullable: true })
  payload?: string

  @CreateDateColumn({ type: 'datetime', name: 'created_on' })
  createdAt: Date
}
