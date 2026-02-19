import { dataSource } from 'databases/data-source'
import { getCurrentDateTime, getManyBy, getSingleBy } from '../../helper'
import { Subscriber } from './auth.entity'
import { InternalServerErrorException } from '@nestjs/common'
import { logger as logger } from 'middlewares/logger.middleware'

export const getUserBy = getSingleBy(Subscriber)
export const getUsersBy = getManyBy(Subscriber)

/**
 * Logs OTP request data into `tbl_log3`
 */
export async function insertOtpLog(mobile: string, body: any): Promise<void> {
  try {
    const ds = await dataSource

    await ds
      .createQueryBuilder()
      .insert()
      .into('tbl_log3')
      .values({
        mobileno: mobile,
        message: JSON.stringify(body),
        created_on: getCurrentDateTime(),
      })
      .execute()
  } catch (err) {
    logger.error('❌ Failed to log OTP request:', err)
    throw new InternalServerErrorException('Failed to log OTP request')
  }
}

/**
 * Saves OTP into `tbl_otpbox`
 */
export async function insertOtp(mobile: string, otp: number, createdOn: string): Promise<void> {
  try {
    const ds = await dataSource

    await ds
      .createQueryBuilder()
      .insert()
      .into('tbl_otpbox')
      .values({
        mobileno: mobile,
        otpnumber: otp,
        created_on: createdOn,
        otp_source: 4, // 3 → SG Main

      })
      .execute()
  } catch (err) {
    logger.error('❌ Error inserting OTP:', err)
    throw new InternalServerErrorException('Failed to save OTP')
  }
}

/**
 * Generates the next subscriber ID efficiently.
 * Example: SG0001 → SG0002
 */
export async function getNextSubscriberID(): Promise<string> {
  const defaultID = 'SG0001'

  try {
    const ds = await dataSource

    // Use a raw query for better performance instead of QueryBuilder chaining
    const result = await ds.query(`
      SELECT subscriberid 
      FROM tbl_subscriber 
      WHERE isdelete = 0 
        AND subscriberid IS NOT NULL
      ORDER BY id DESC 
      LIMIT 1
    `)

    if (!result || result.length === 0 || !result[0].subscriberid) {
      return defaultID
    }

    // Extract numeric part and increment
    const numericPart = parseInt(result[0].subscriberid.slice(2), 10)
    if (isNaN(numericPart)) {
      return defaultID
    }

    return `SG${String(numericPart + 1).padStart(4, '0')}`
  } catch (err) {
    logger.error('❌ Error generating subscriber ID:', err)
    return defaultID
  }
}

export async function getUtmByDeviceId(deviceId: string) {
  // try {
  //   const ds = await dataSource

  //   const record = await ds
  //     .createQueryBuilder()
  //     .select('payload')
  //     .from('tbl_log_appevents', 'e')
  //     .where('device_id = :deviceId', { deviceId })
  //     .andWhere('event_type = "app_install_attributes"')
  //     .orderBy('created_on', 'DESC')
  //     .getRawOne<{ payload: string }>()

  //   if (!record?.payload) return {}

  //   let payload: any
  //   try {
  //     payload = JSON.parse(record.payload)
  //   } catch (err) {
  //     logger.warn('⚠️ Invalid JSON in payload, returning empty object')
  //     return {}
  //   }

  //   const referrer: string = payload.installReferrer
  //   if (!referrer) return {}

  //   const params = new URLSearchParams(referrer)
  //   const utm_source = params.get('utm_source') || ''
  //   const utm_campaign = params.get('utm_campaign') || ''
  //   const utm_medium = params.get('utm_medium') || ''

  //   return { utm_source, utm_campaign, utm_medium }
  // } catch (err) {
  //   logger.error('❌ Error fetching UTM data:', err)
  //   throw new InternalServerErrorException('Failed to fetch UTM data', (err as Error).message)
  // }

  try {
    // 1️⃣ Get latest install event
    const ds = await dataSource

    const record = await ds
      .createQueryBuilder()
      .select('payload')
      .from('tbl_log_appevents', 'e')
      .where('device_id = :deviceId', { deviceId })
      .andWhere('event_type = "app_install_attributes"')
      .orderBy('created_on', 'DESC')
      .getRawOne<{ payload: string }>()

    //   if (!record?.payload) return {}

    if (!record?.payload) return {}

    // 2️⃣ Parse JSON safely
    let payload: any
    try {
      payload = JSON.parse(record.payload)
    } catch (err) {
      logger.warn('⚠️ Invalid JSON in payload, returning empty object')
      return {}
    }

    const referrer: string = payload.installReferrer
    if (!referrer) return {}

    // 3️⃣ Parse referrer params
    const params = new URLSearchParams(referrer)

    let utm_source = params.get('utm_source') || ''
    let utm_campaign = params.get('utm_campaign') || ''
    let utm_medium = params.get('utm_medium') || ''
    let utm_content = params.get('utm_content') || ''
    let utm_term = params.get('utm_term') || ''

    let clickid = ''
    let clicktype = 0

    // 4️⃣ If UTM missing → derive from GCLID (ONLY RULE YOU WANTED)
    if (!utm_source) {
      const gclid = params.get('gclid')

      if (gclid) {
        utm_source = 'Google'
        utm_medium = 'GCLID'
        clickid = gclid
        clicktype = 1
      }
    }

    // 5️⃣ Return normalized attribution
    return {
      utm_source,
      utm_campaign,
      utm_medium,
      utm_content,
      utm_term,
      clickid,
      clicktype,
    }
  } catch (err) {
    throw new InternalServerErrorException('Failed to fetch UTM data', (err as Error).message)
  }
}
