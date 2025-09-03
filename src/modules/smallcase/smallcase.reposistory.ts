import { dataSource } from 'databases/data-source'

export async function updateSubscriberAuthId(subscriberid: number, authId: string) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .update('tbl_subscriber')
    .set({ authid: authId })
    .where('id = :subscriberid', { subscriberid })
    .execute()
}

// export async function updateSmallcaseOrderBroker(transactionId: string, broker: string, subscriberid: number) {
//   const ds = await dataSource
//   return await ds
//     .createQueryBuilder()
//     .update('tbl_smallcase_order')
//     .set({
//       broker: broker,
//     })
//     .where('transactionid = :transactionId', { transactionId })
//     .andWhere('subscriberid = :subscriberid', { subscriberid })
//     .execute()
// }

export async function getSmallcaseOrderByTransaction(transactionId: string, subscriberid: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select(['id', 'transactionid', 'serviceid', 'subscriberid', 'status', 'broker'])
    .from('tbl_smallcase_order', 'order')
    .where('order.transactionid = :transactionId', { transactionId })
    .andWhere('order.subscriberid = :subscriberid', { subscriberid })
    .getRawOne()
}

export async function deleteSubscriberAuthId(subscriberid: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .update('tbl_subscriber')
    .set({ authid: null })
    .where('id = :subscriberid', { subscriberid })
    .execute()
}
