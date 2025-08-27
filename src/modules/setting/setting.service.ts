// ticket-category.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { CreateAppEventLogDto, UpdateNotificationDto } from './setting.dto'

import { InjectRepository } from '@nestjs/typeorm'
import { AppEventLog } from './setting.entity'
import { logger } from 'middlewares/logger.middleware'
import { getCompanyInfo, getFinePrint, getSubscriberInfo, updateNotifications } from './setting.reposistory'
import { getUserBy } from 'modules/auth/auth.repository'

@Injectable()
export class SettingService {
  private readonly logger = logger

  constructor(
    @InjectRepository(AppEventLog)
    private readonly applogRepo: Repository<AppEventLog>
  ) {}

  async getSubscriberNotificationSettings(userId: number) {
    try {
      const user = await getUserBy(
        { id: userId },
        ['n_trade', 'n_rebalance', 'n_streetview', 'n_reminders'] // optional selected fields
      )
      if (!user) {
        throw new NotFoundException(`Subscriber with ID ${userId} not found`)
      }

      return {
        success: true,
        message: 'Successful',
        result: user,
      }
    } catch (error) {
      this.logger.error('Error fetching notification settings:', error)
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Failed to retrieve notification settings')
    }
  }

  async updateNotifications(dto: UpdateNotificationDto, userId: number): Promise<{ n_type: number; status: number }[]> {
    try {
      // 1. Load current values (raw query since no entity is used)
      const current = await getUserBy(
        { id: userId },
        ['n_trade', 'n_rebalance', 'n_streetview', 'n_reminders'] // optional selected fields
      )
      if (!current) {
        throw new NotFoundException(`Subscriber with ID ${userId} not found`)
      }

      // 2. Prepare update fields
      const updateFields = {
        n_trade: dto.n_trade !== undefined ? dto.n_trade : current.n_trade,
        n_rebalance: dto.n_rebalance !== undefined ? dto.n_rebalance : current.n_rebalance,
        n_streetview: dto.n_streetview !== undefined ? dto.n_streetview : current.n_streetview,
        n_reminders: dto.n_reminders !== undefined ? dto.n_reminders : current.n_reminders,
      }

      // 3. Update row
      await updateNotifications(updateFields, userId)

      // 4. Always return all four statuses
      return [
        { n_type: 1, status: updateFields.n_trade },
        { n_type: 2, status: updateFields.n_rebalance },
        { n_type: 3, status: updateFields.n_streetview },
        { n_type: 4, status: updateFields.n_reminders },
      ]
    } catch (error) {
      console.error('Error updating notifications:', error)
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Failed to update notification settings')
    }
  }

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

  async getSupport(userId: number) {
    try {
      // Check if subscriber exists

      const subscriber = await getSubscriberInfo(userId)

      if (!subscriber) {
        return { success: false, message: 'No Subscriber Found...' }
      }

      // Load company info
      const company = await getCompanyInfo()

      if (!company) {
        return { success: false, message: 'No Record Found' }
      }

      return {
        success: true,
        message: 'Successfull',
        result: {
          support: [
            {
              // whatsapp: {
              //   text: 'Whatsapp link',
              //   link: `https://wa.me/${subscriber.user_whatsapp}`,
              // },
              email: {
                text: 'Email',
                link: company.c_technical_email,
              },
              // contact: {
              //   text: 'Contact us',
              //   link: subscriber.user_mob2, // Replace with actual contact number
              // },
            },
          ],
        },
      }
    } catch (error) {
      this.logger.error('getSupport error:', error)
      return { success: false, message: 'Internal Server Error' }
    }
  }

  async getFinePrint(slug: string) {
    try {
      const pageData = await getFinePrint(slug)

      if (pageData.length > 0) {
        return {
          success: true,
          message: 'Successful',
          result: pageData,
        }
      }

      return { success: false, message: 'No data found.' }
    } catch (error) {
      console.error(error)
      return {
        success: false,
        message: 'Error retrieving data',
      }
    }
  }
}
