// ticket-category.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import {
  ComplianceItemDto,
  CreateAppEventLogDto,
  CreateFolioTrackingDto,
  CreateSubscriberEventDto,
  UpdateNotificationDto,
} from './setting.dto'

import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { AppEventLog } from './setting.entity'
import { logger } from 'middlewares/logger.middleware'
import {
  getCompanyInfo,
  getFinePrint,
  getSubscriberInfo,
  getSubscriberNotificationDetails,
  insertSubscriberEvent,
  updateSubscriberNotifications,
} from './setting.reposistory'

@Injectable()
export class SettingService {
  private readonly logger = logger

  constructor(
    @InjectRepository(AppEventLog)
    private readonly applogRepo: Repository<AppEventLog>,
    @InjectDataSource('secondary')
    private readonly secondarySource: DataSource
  ) {}

  async getSubscriberNotificationSettings(subscriberId: number) {
    try {
      const current = await getSubscriberNotificationDetails(subscriberId)

      if (!current) {
        throw new NotFoundException(`Subscriber details not found for ID ${subscriberId}`)
      }

      return {
        success: true,
        message: 'Successful',
        result: current,
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Failed to retrieve notification settings')
    }
  }

  // Update subscriber notification settings
  async updateNotifications(dto: UpdateNotificationDto, subscriberId: number): Promise<{ n_type: number; status: number }[]> {
    try {
      // 1. Load current values
      const current = await getSubscriberNotificationDetails(subscriberId)

      if (!current) {
        throw new NotFoundException(`Subscriber details not found for ID ${subscriberId}`)
      }

      // 2. Prepare update fields
      const updateFields = {
        subscription_alerts: dto.subscription_alerts ?? current.subscription_alerts,
        rebalance_alerts: dto.rebalance_alerts ?? current.rebalance_alerts,
        investment_push: dto.investment_push ?? current.investment_push,
        offers_discounts_push: dto.offers_discounts_push ?? current.offers_discounts_push,
        market_updates: dto.market_updates ?? current.market_updates,
        renewal_reminders: dto.renewal_reminders ?? current.renewal_reminders,
        whatsapp_notifications: dto.whatsapp_notifications ?? current.whatsapp_notifications,
      }

      // 3. Update row
      await updateSubscriberNotifications(updateFields, subscriberId)

      // 4. Always return all statuses
      return [
        { n_type: 1, status: updateFields.subscription_alerts },
        { n_type: 2, status: updateFields.rebalance_alerts },
        { n_type: 3, status: updateFields.investment_push },
        { n_type: 4, status: updateFields.offers_discounts_push },
        { n_type: 5, status: updateFields.market_updates },
        { n_type: 6, status: updateFields.renewal_reminders },
        { n_type: 7, status: updateFields.whatsapp_notifications },
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
      // Generate correct IST datetime
      const nowUtc = new Date()
      const istOffset = 5.5 * 60 * 60 * 1000
      const istNow = new Date(nowUtc.getTime() + istOffset)

      const newEvent: Partial<AppEventLog> = {
        screen_name: dto.screen_name || '',
        event_type: dto.event_type || '',
        device_id: dto.device_id || '',
        payload: dto.payload || '',
        subscriberid: userId || 0,
        created_on: istNow,
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
              email: {
                text: 'Email',
                link: company.technical_email,
              },
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

  getComplianceItems(): ComplianceItemDto[] {
    return [
      { name: 'Privacy Policy', value: 'https://streetgains.in/privacy-policy' },
      { name: 'Terms & Conditions', value: 'https://streetgains.in/terms-conditions' },
      { name: 'Disclaimer', value: 'https://streetgains.in/disclaimer' },
      { name: 'Grievance Redressal Process', value: 'https://streetgains.in/grievance' },
      { name: 'Refund Policy', value: 'https://streetgains.in/refund-policy' },
      { name: 'Client Acceptance', value: 'https://streetgains.in/client-acceptance' },
      { name: 'User Agreement', value: 'https://streetgains.in/user-agreement' },
      { name: 'About', value: 'https://streetgains.in/about' },
    ]
  }

  async createSubscriberEvent(dto: CreateSubscriberEventDto, subscriberId: number): Promise<void> {
    try {
      const { serviceid, event_type, planid } = dto

      // Use ?? to default only if planid is undefined
      await insertSubscriberEvent(serviceid, subscriberId, event_type ?? null, planid ?? 0)
    } catch (error) {
      console.error('Error creating subscriber event:', error)
      throw new InternalServerErrorException('Internal Server Error')
    }
  }

  async insertFolioTracking(dto: CreateFolioTrackingDto, subscriberid: number): Promise<any> {
    const now = new Date()
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    const createdOn = istTime.toISOString().slice(0, 19).replace('T', ' ')
    const payload = {
      subscriberid: subscriberid,
      utm_source: dto.utm_source,
      utm_medium: dto.utm_medium,
      utm_campaign: dto.utm_campaign,
      utm_content: dto.utm_content,
      utm_term: dto.utm_term,
      clickid: dto.clickid,
      created_on: createdOn,
    }

    const result = await this.insertRow('tbl_folio_tracking', payload)

    if (!result.success) {
      throw new InternalServerErrorException('Failed to insert folio tracking')
    }

    return { id: result.id }
  }

  async insertRow(table: string, values: Record<string, any>) {
    try {
      const ds = await this.secondarySource

      const result = await ds.createQueryBuilder().insert().into(table).values(values).execute()

      return {
        success: true,
        id: result?.identifiers?.[0]?.id || null,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Insert failed',
        error: error.message,
      }
    }
  }
}
