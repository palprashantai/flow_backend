import { dataSource } from 'databases/data-source'
import { DateTime } from 'luxon'
import { EntitySchema, ObjectType } from 'typeorm'


export function getSingleBy<T = any>(
  table: ObjectType<T> | EntitySchema<T>
): (filter: Partial<T>, columns?: any[], sortings?) => Promise<T> {
  return async (filter, columns?, sortings?) => {
    const condition: any = {
      where: filter,
    }
    if (columns?.length > 0) {
      condition.select = columns
    }
    if (sortings) {
      condition.order = sortings
    }
    const dataSourceFinal = await dataSource
    const repository = dataSourceFinal.getRepository(table)
    // console.log('repos', repository)
    return (await repository.findOne(condition)) || undefined
  }
}

export function getManyBy<T = any>(
  table: ObjectType<T> | EntitySchema<T>
): (filter: Partial<T>, columns?: any[], sortings?) => Promise<T[]> {
  return async (filter, columns?, sortings?) => {
    const condition: any = { where: filter }
    if (columns?.length > 0) {
      condition.select = columns
    }
    if (sortings) {
      condition.order = sortings
    }
    const dataSourceFinal = await dataSource
    const repository = dataSourceFinal.getRepository(table)
    return await repository.find(condition)
  }
}

// Remove all non-alphanumeric characters (used for names, emails, etc.)
export function sanitize(str: string): string {
  return str?.replace(/[^a-zA-Z0-9 ]/g, '') || ''
}

// Remove all non-numeric characters from a mobile number
export function sanitizeMobile(mobile: string): string {
  return mobile.replace(/[^0-9]/g, '')
}

export function sanitizeEmail(str: string): string {
  return str?.trim().replace(/[^\w.@+-]/g, '') || ''
}


export function getCurrentDateTime() {
  // return new Date().toISOString().slice(0, 19).replace('T', ' ')
  return DateTime.now()
    .setZone('Asia/Kolkata')
    .toFormat('yyyy-MM-dd HH:mm:ss');
}