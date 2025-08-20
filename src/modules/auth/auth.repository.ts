import { getManyBy, getSingleBy } from '../../helper'

import { dataSource } from '../../databases/data-source'
import { Subscriber } from './auth.entity'
import { InternalServerErrorException } from '@nestjs/common'

export const getUserBy = getSingleBy(Subscriber)
export const getUsersBy = getManyBy(Subscriber)

/**
 * Logs OTP request data into `tbl_log3`
 */
export async function insertOtpLog(mobile: string, body: any): Promise<void> {
  console.log(mobile, body)
  const sql = `
    INSERT INTO tbl_log3 (mobileno, message)
    VALUES ($1, $2)`
  try {
    await (await dataSource).query(sql, [mobile, JSON.stringify(body)])
  } catch (err) {
    throw new InternalServerErrorException('Failed to log OTP request', err)
  }
}

/**
 * Saves OTP to `tbl_otpbox`
 */
export async function insertOtp(mobile: string, otp: number, createdOn: string): Promise<void> {
  const sql = `
    INSERT INTO tbl_otpbox (mobileno, otpnumber, created_on)
    VALUES ($1, $2, $3)`
  try {
    await (await dataSource).query(sql, [mobile, otp, createdOn])
  } catch (err) {
    throw new InternalServerErrorException('Failed to save OTP', err.message)
  }
}




export async function getNextSubscriberID(): Promise<string> {
  const defaultID = 'SG0001'

  try {
    const sql = `
      SELECT subscriberid
      FROM tbl_subscriber
      WHERE isdelete = 0
        AND subscriberid IS NOT NULL
      ORDER BY id DESC
      LIMIT 1
    `
    const [latest]: any = await (await dataSource).query(sql)

    if (!latest || !latest.subscriberid) {
      return defaultID
    }

    const numericPart = parseInt(latest.subscriberid.replace('SG', ''), 10)
    if (isNaN(numericPart)) {
      return defaultID
    }

    return `SG${String(numericPart + 1).padStart(4, '0')}`
  } catch (error) {
    console.error('Error generating subscriber ID:', error)
    return defaultID
  }
}

