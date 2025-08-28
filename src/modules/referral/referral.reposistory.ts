import { dataSource } from 'databases/data-source'

export async function getReferralByStatus(status: number, referral_id: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select(['id', 'referral_id', 'referral_code', 'sub_id', 'amount', 'status', 'updated_on', 'datetime'])
    .from('tbl_referral_info_folio', 'tbl_referral_info_folio')
    .where('status = :status', { status })
    .andWhere('referral_id = :referral_id', { referral_id })
    .orderBy('id', 'DESC')
    .getRawMany()
}

// src/wallet/wallet.queries.ts
export async function getWalletBySubscriber(subscriberid: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select(['id', 'subscriberid', 'referid', 'amount', 'type', 'created_on'])
    .from('tbl_wallet_folio', 'tbl_wallet_folio')
    .where('subscriberid = :subscriberid', { subscriberid })
    .orderBy('id', 'DESC')
    .getRawMany()
}
