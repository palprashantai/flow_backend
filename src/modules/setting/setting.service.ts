// ticket-category.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { CreateAppEventLogDto } from './setting.dto'

import { InjectRepository } from '@nestjs/typeorm'
import { AppEventLog } from './setting.entity'
import { logger } from 'middlewares/logger.middleware'

@Injectable()
export class SettingService {
  private readonly logger = logger

  constructor(
    @InjectRepository(AppEventLog)
    private readonly applogRepo: Repository<AppEventLog>
  ) {}

  /**
   * Creates and logs a new application event for a subscriber.
   * Builds the event object from the DTO and saves it to the `tbl_log_appevents` table.
   *
   * @param dto - Data transfer object containing event details (screen name, event type, device ID, payload).
   * @param userId - The subscriber ID associated with this event.
   * @throws InternalServerErrorException if the event cannot be saved.
   */
  async createEvent(dto: CreateAppEventLogDto, userId: number): Promise<void> {
    try {
      // Build and save the event
      const newEvent: Partial<AppEventLog> = {
        screen_name: dto.screen_name || '',
        event_type: dto.event_type || '',
        device_id: dto.device_id || '',
        payload: dto.payload || '',
        subscriberid: userId || 0,
      }
      const event = this.applogRepo.create(newEvent)
      await this.applogRepo.save(event)
    } catch (error) {
      this.logger.error('Failed to log app event', error)
      throw new InternalServerErrorException('Unable to log app event at this time')
    }
  }
}
