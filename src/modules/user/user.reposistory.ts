import { dataSource } from 'databases/data-source'

export async function getSubscriptionList(subscriberid: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select([
      't1.packno',
      't2.id AS serviceid',
      't2.service_name',
      't2.parentid',
      't1.subscriptionid',
      't1.amount',
      't1.created_on',
      't1.stype',
      't1.status',
      't1.trades_used',
      't1.trades_available',
      't1.trades_total',
    ])
    .from('tbl_subscription', 't1')
    .leftJoin('tbl_services', 't2', 't2.id = t1.serviceid')
    .where('t1.isdelete = 0 AND t1.subscriberid = :subscriberid', { subscriberid })
    .orderBy('t1.id', 'DESC')
    .getRawMany()
}

export async function getParentList(parentIds: number[]) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select('id, service_name')
    .from('tbl_services', 'p')
    .where('p.id IN (:...ids)', { ids: parentIds })
    .getRawMany()
}
export async function updateEmail(emailid: string, userId: number) {
  const ds = await dataSource
  return await ds.createQueryBuilder().update('tbl_subscriber').set({ email: emailid }).where('id = :id', { id: userId }).execute()
}
export async function getLangList() {
  const ds = await dataSource
  return await ds.createQueryBuilder().select('*').from('tbl_languages', 'l').getRawMany()
}

export async function getStateList() {
  const ds = await dataSource
  return await ds.createQueryBuilder().select('*').from('tbl_state', 's').getRawMany()
}

export async function getSubscriberDetails(subscriberid: number) {
  const ds = await dataSource
  return await ds
    .createQueryBuilder()
    .select([
      't1.id AS id',
      't1.subscriberid AS subscriberid',
      't1.fullname AS fullname',
      't1.email AS email',
      't1.mobileno AS mobileno',
      't1.imgurl AS imgurl',
      't1.state AS state',
      't1.language AS language',
      't1.address AS address',
      't2.user_fullname AS user_fullname',
      't2.user_mob2 AS user_mob2',
      't2.user_whatsapp AS user_whatsapp',
    ])
    .from('tbl_subscriber', 't1')
    .leftJoin('tbl_userinfo', 't2', 't1.assignedto = t2.id')
    .where('t1.isdelete = 0 AND t1.id = :subscriberid', { subscriberid })
    .getRawOne()
}

export async function getSubscriberSubscriptions(subscriberid: number, skip = 0, limitNum = 10) {
  const ds = await dataSource

  const [totalCountResult, subscriptions] = await Promise.all([
    ds
      .createQueryBuilder()
      .select('COUNT(sub.id)', 'count')
      .from('tbl_subscription', 'sub')
      .innerJoin('tbl_services', 'sv', 'sub.serviceid = sv.id')
      .where('sub.isdelete = 0 AND sub.subscriberid = :sid AND sv.service_type = 1', { sid: subscriberid })
      .getRawOne(),

    ds
      .createQueryBuilder()
      .select([
        'sub.id AS id',
        'sub.status AS status',
        'sub.stype AS stype',
        'sub.plantype AS plantype',
        'sub.subscriptionid AS subscriptionid',
        'sub.trades_total AS trades_total',
        'sub.trades_used AS trades_used',
        'sub.activation_date AS activation_date',
        'sub.activation_time AS activation_time',
        'CAST(sub.expiry_date AS CHAR) AS expiry_date',
        'sub.expiry_time AS expiry_time',
        'sv.service_name AS service_name',
        'sv.service_image AS service_image',
        'sv.service_slug AS service_slug',
        'sv.last_rebalance_date AS last_rebalance_date',
        'sv.next_rebalance_date AS next_rebalance_date',
        'sv.rebalance_frequency AS rebalance_frequency',
        `CASE WHEN sub.expiry_date > NOW() THEN TRUE ELSE FALSE END AS hasActiveSubscription`,
        `CASE WHEN sub.expiry_date <= NOW() THEN TRUE ELSE FALSE END AS hasExpiredSubscription`,
        'sv.id AS serviceid',
      ])
      .from('tbl_subscription', 'sub')
      .innerJoin('tbl_services', 'sv', 'sub.serviceid = sv.id')
      .where('sub.isdelete = 0 AND sub.subscriberid = :sid AND sv.service_type = 1', { sid: subscriberid })
      .orderBy('sub.id', 'DESC')
      .offset(skip)
      .limit(limitNum)
      .getRawMany(),
  ])

  const totalCount = totalCountResult?.count ?? 0
  return { totalCount, subscriptions }
}

export async function getSubscriptionDetails(id: number) {
  const ds = await dataSource

  const subscription = await ds
    .createQueryBuilder()
    .select([
      'sub.id AS id',
      'sub.status AS status',
      'sub.stype AS stype',
      'sub.plantype AS plantype',
      'sub.subscriptionid AS subscriptionid',
      'sub.trades_total AS trades_total',
      'sub.trades_used AS trades_used',
      'sub.trades_available AS trades_available',
      'CAST(sub.activation_date AS CHAR) AS activation_date',
      'CAST(sub.expiry_date AS CHAR) AS expiry_date',
      'sub.activation_time AS activation_time',
      'sub.expiry_time AS expiry_time',
      'sv.service_name AS service_name',
      'sv.service_image AS service_image',
      'sv.service_slug AS service_slug',
      'sv.last_rebalance_date AS last_rebalance_date',
      'sv.next_rebalance_date AS next_rebalance_date',
      'sv.rebalance_frequency AS rebalance_frequency',
      'sv.id AS serviceid',
      'ac.id AS asset_class_id',
      'ac.asset_name AS asset_class_name',
      'ac.exchange AS asset_class_exchange',
      `CASE WHEN sub.expiry_date > NOW() THEN TRUE ELSE FALSE END AS hasActiveSubscription`,
      `CASE WHEN sub.expiry_date <= NOW() THEN TRUE ELSE FALSE END AS hasExpiredSubscription`,
    ])
    .from('tbl_subscription', 'sub')
    .innerJoin('tbl_services', 'sv', 'sub.serviceid = sv.id')
    .leftJoin('tbl_asset_class', 'ac', 'sv.asset_class = ac.id')
    .where('sub.id = :id AND sub.isdelete = 0 AND sv.service_type = 1', { id })
    .getRawOne()

  return subscription
}

export async function getSubscriberNotificationsStats(serviceid: number, activationDate: string, expiryDate?: string) {
  const ds = await dataSource

  const query = ds
    .createQueryBuilder()
    .select([
      'COUNT(id) AS rtot',
      "SUM(CASE WHEN rtype = 'p' THEN 1 ELSE 0 END) AS ptot",
      "SUM(CASE WHEN rtype = 'n' THEN 1 ELSE 0 END) AS ntot",
      "COALESCE(SUM(CASE WHEN rtype = 'p' THEN gainsnew ELSE 0 END), 0) AS tprof",
      "COALESCE(SUM(CASE WHEN rtype = 'n' THEN gainsnew ELSE 0 END), 0) AS tloss",
    ])
    .from('tbl_notification', 'n')
    .where('n.serviceid = :sid AND n.isdelete = 0 AND n.created_on >= :startDate', {
      sid: serviceid,
      startDate: activationDate,
    })

  if (expiryDate) {
    query.andWhere('n.created_on <= :endDate', { endDate: expiryDate })
  }

  const stats = await query.getRawOne()
  return stats
}

export async function getPortfolioCount(serviceid: number) {
  const ds = await dataSource

  const result = await ds
    .createQueryBuilder()
    .select('COUNT(id) AS rtot')
    .from('tbl_portfolio', 'p')
    .where('p.serviceid = :sid', { sid: serviceid })
    .getRawOne()

  return { rtot: Number(result?.rtot) || 0 }
}

export async function findSubscriberBillingDetails(id: number) {
  const ds = await dataSource

  const result = await ds
    .createQueryBuilder()
    .select([
      't1.id AS id',
      't1.fullname AS fullname',
      't1.mobileno AS mobileno',
      'CAST(t1.state AS UNSIGNED) AS state',
      't2.name_pann AS name_pann',
      't2.dob AS dob',
      't2.pan_number AS pan_number',
    ])
    .from('tbl_subscriber', 't1')
    .leftJoin('tbl_subscribers_document', 't2', 't1.id = t2.subscriberid')
    .where('t1.isdelete = :isdelete', { isdelete: 0 })
    .andWhere('t1.id = :id', { id })
    .limit(1)
    .getRawOne()

  return result
}

export async function findSubscriberWithDoc(id: number) {
  const ds = await dataSource

  const result = await ds
    .createQueryBuilder()
    .select(['t1.id AS id', 't2.id AS docid'])
    .from('tbl_subscriber', 't1')
    .leftJoin('tbl_subscribers_document', 't2', 't1.id = t2.subscriberid')
    .where('t1.isdelete = :isdelete', { isdelete: 0 })
    .andWhere('t1.id = :id', { id })
    .limit(1)
    .getRawOne()

  return result
}

export async function updateSubscriberDocument(docid: number, pan: string, name_as_per_pan: string, dob: string) {
  const ds = await dataSource

  await ds
    .createQueryBuilder()
    .update('tbl_subscribers_document')
    .set({
      pan_number: pan,
      name_pann: name_as_per_pan,
      dob,
    })
    .where('id = :id', { id: docid })
    .execute()
}

export async function insertSubscriberDocument(subscriberId: number, pan: string, name_as_per_pan: string, dob: string) {
  const ds = await dataSource

  await ds
    .createQueryBuilder()
    .insert()
    .into('tbl_subscribers_document')
    .values({
      subscriberid: subscriberId,
      pan_number: pan,
      name_pann: name_as_per_pan,
      dob,
    })
    .execute()
}

export async function updateSubscriberState(subscriberId: number, state: string) {
  const ds = await dataSource

  await ds.createQueryBuilder().update('tbl_subscriber').set({ state }).where('id = :id', { id: subscriberId }).execute()
}

export async function findPushNotifySubscriber(nid: number, mobileno: string) {
  const ds = await dataSource

  const result = await ds
    .createQueryBuilder()
    .select('gps.id', 'id')
    .from('tbl_gen_pushnotifysub', 'gps')
    .where('gps.nid = :nid AND gps.mobile = :mobileno', { nid, mobileno })
    .getRawOne()

  return result
}

export async function getSubscriberOrders(userId: number, skip = 0, limit = 10) {
  const ds = await dataSource

  const orders = await ds
    .createQueryBuilder()
    .select([
      'o.id AS id',
      'o.actual_amount AS actual_amount',
      'o.payment_date AS payment_date',
      'o.transactionid AS transactionid',
      'o.order_approval AS order_approval',
      'os.trade AS trade',
      'o.research_fee AS research_fee',
      'o.tax_amt AS tax_amt',
      'o.discount_amt AS discount_amt',
      's.service_name AS service_name',
    ])
    .from('tbl_order', 'o')
    .leftJoin('tbl_order_sub', 'os', 'os.order_id = o.id')
    .leftJoin('tbl_services', 's', 's.id = os.serviceid')
    .where('o.isdelete = 0 AND o.subscriberid = :subId', { subId: userId })
    .andWhere('s.service_type = :type', { type: 1 }) // 🔥 service type = 1
    .orderBy('o.id', 'DESC')
    .offset(skip)
    .limit(limit)
    .getRawMany()

  return orders
}

export async function getGeneralPushNotifications(notifyId: number, created_on?: string) {
  const ds = await dataSource

  const qb = ds
    .createQueryBuilder()
    .select([
      'gpn.id AS id',
      'gpn.title AS title',
      'gpn.message AS message',
      'gpn.src_url AS src_url',
      'gpn.notifyid AS notifyid',
      'gpn.datatype AS datatype',
      'gpn.created_on AS created_on',
    ])
    .from('tbl_gen_pushnotification', 'gpn')
    .where('(gpn.notifyid = 0 OR gpn.notifyid = :notifyId)', { notifyId })

  if (created_on) {
    qb.andWhere('gpn.created_on > :createdOn', { createdOn: created_on })
  }

  qb.orderBy('gpn.created_on', 'DESC')

  return await qb.getRawMany()
}

export async function getPushNotifications(notifyId: number, created_on?: string) {
  const ds = await dataSource

  const qb = ds
    .createQueryBuilder()
    .select([
      'gpn.id AS id',
      'gpn.title AS title',
      'gpn.message AS message',
      'gpn.src_url AS src_url',
      'gpn.notifyid AS notifyid',
      'gpn.created_on AS created_on',
    ])
    .from('tbl_pushnotification', 'gpn')
    .where('(gpn.notifyid = 0 OR gpn.notifyid = :notifyId)', { notifyId })

  if (created_on) {
    qb.andWhere('gpn.created_on > :createdOn', { createdOn: created_on })
  }

  qb.orderBy('gpn.created_on', 'DESC')

  return await qb.getRawMany()
}
