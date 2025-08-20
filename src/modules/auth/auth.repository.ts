import { dataSource } from 'databases/data-source'
import { getCurrentDateTime, getManyBy, getSingleBy } from '../../helper'
import { Subscriber } from './auth.entity'
import { InternalServerErrorException } from '@nestjs/common'

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
    console.error('❌ Failed to log OTP request:', err)
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
      })
      .execute()
  } catch (err) {
    console.error('❌ Error inserting OTP:', err)
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
    console.error('❌ Error generating subscriber ID:', err)
    return defaultID
  }
}
