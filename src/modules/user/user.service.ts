import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { logger } from 'middlewares/logger.middleware'
import { getUserBy } from 'modules/auth/auth.repository'
import moment from 'moment'
import {
  findSubscriberBillingDetails,
  findSubscriberWithDoc,
  getGeneralPushNotifications,
  getPortfolioCount,
  getPushNotifications,
  getStateList,
  getSubscriberDetails,
  getSubscriberOrders,
  getSubscriberSubscriptions,
  getSubscriptionDetails,
  insertSubscriberDocument,
  updateEmail,
  updateSubscriberDocument,
  updateSubscriberState,
} from './user.reposistory'
import { UpdateSubscriberBillingDetailsDto, UpdateSubscriberEmailDto } from './user.dto'
import { checkExpiryDate } from 'helper'
import NodeCache from 'node-cache'
import { Subscriber } from 'modules/auth/auth.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { dataSource } from 'databases/data-source'

@Injectable()
export class UserService {
  private readonly logger = logger

  constructor(
    @Inject('NODE_CACHE') private readonly cache: NodeCache,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>
  ) {}

  async getProfile(subscriberid: number): Promise<any> {
    try {
      const subscriber = await getUserBy({ id: subscriberid }, [
        'id',
        'fullname',
        'mobileno',
        'email',
        'subscriberid',
        'language',
        'address',
        'state',
      ])

      if (!subscriber) throw new NotFoundException('Subscriber not found')

      // 3. Fetch subscriptions with service info
      // const subscriptions = await getSubscriptionList(subscriberid)

      // const parentIds = subscriptions.filter((s) => s.parentid && s.parentid !== 0 && s.serviceid > 12).map((s) => s.parentid)

      // let parentNames: Record<number, string> = {}
      // if (parentIds.length > 0) {
      //   const parents = await getParentList(parentIds)

      //   parentNames = parents.reduce((acc, p) => {
      //     acc[p.id] = p.service_name
      //     return acc
      //   }, {})
      // }

      // const suparray = subscriptions.map((sub) => ({
      //   service:
      //     sub.parentid && sub.parentid !== 0 && sub.serviceid > 12 ? parentNames[sub.parentid] || sub.service_name : sub.service_name,
      //   stype: sub.stype === 'Paid' ? 'Paid' : 'Free',
      //   status: sub.status,
      //   spackno: sub.subscriptionid,
      //   purchase_date: sub.created_on ? new Date(sub.created_on).toISOString().split('T')[0] : null,
      //   amount: sub.amount ?? 0,
      //   used: sub.trades_available ?? 0,
      //   totalcredits: sub.trades_total ?? 0,
      // }))

      // 4. Fetch languages and states
      // const [languages, states] = await Promise.all([getLangList(), getStateList()])

      const profileResponse = {
        subscriberid: subscriber.subscriberid ?? '',
        fullname: subscriber.fullname ?? '',
        mobileno: subscriber.mobileno ?? '',
        emailid: subscriber.email ?? '',
        language: subscriber.language ?? '',
        address: subscriber.address ?? '',
        state: subscriber.state ?? '',

        // subscription: suparray,
        // subscriberno: subscriber.subscriberid?.replace('SG', '') ?? '',
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        result: [profileResponse],
        // languages,
        // states,
      }
    } catch (error) {
      this.logger.error('Error in getProfile:', error)
      throw new InternalServerErrorException(error.message || 'An error occurred while processing your request')
    }
  }

  async getSubscriberEmailById(subscriberid: number) {
    try {
      const subscriber = await getUserBy({ id: subscriberid }, ['email'])
      if (!subscriber) {
        throw new NotFoundException('Subscriber not found')
      }
      if (!subscriber.email) {
        throw new NotFoundException('Email not found')
      }

      return {
        success: true,
        message: 'Email retrieved successfully',
        result: { emailid: subscriber.email },
      }
    } catch (error) {
      this.logger.error('Error fetching subscriber email:', error)
      throw new InternalServerErrorException('Internal Server Error')
    }
  }

  async updateSubscriberEmail(dto: UpdateSubscriberEmailDto, userId: number) {
    try {
      await updateEmail(dto.emailid, userId)
      return { success: true, message: 'Updated Successfully' }
    } catch (error) {
      this.logger.error('Error updating subscriber email:', error)
      throw new InternalServerErrorException('Internal Server Error')
    }
  }

  async registerReferral(subscriberId: number) {
    try {
      const subscriber = await this.subscriberRepo.findOne({
        where: { id: subscriberId, isdelete: 0 },
      })

      if (!subscriber) {
        throw new NotFoundException('Subscriber not found')
      }

      // Check if subscriber already has a referral code
      if (subscriber.referralcode) {
        return {
          message: 'Referral code already exists',
          referralCode: subscriber.referralcode,
        }
      }

      // Generate unique referral code with retry logic
      let referralCode: string
      let isUnique = false
      let attempts = 0
      const maxAttempts = 10

      // Using cleaner character set (removing similar looking characters)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

      while (!isUnique && attempts < maxAttempts) {
        // Generate 5-character code
        referralCode = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

        // Check if this code already exists
        const existingCode = await this.subscriberRepo.findOne({
          where: { referralcode: referralCode },
          select: ['id'], // Only select ID for performance
        })

        if (!existingCode) {
          isUnique = true
        }

        attempts++
      }

      // If we couldn't generate a unique code after max attempts
      if (!isUnique) {
        throw new InternalServerErrorException('Unable to generate unique referral code. Please try again.')
      }

      // Update subscriber with new referral code
      subscriber.referralcode = referralCode
      subscriber.updated_on = new Date().toISOString()

      await this.subscriberRepo.save(subscriber)

      // Log the referral code generation (optional)
      console.log(`Referral code ${referralCode} generated for subscriber ${subscriberId}`)

      return {
        message: 'Referral code registered successfully',
        referralCode,
      }
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error
      }

      // Handle database errors
      if (error?.code === '23505' || error?.message?.includes('duplicate')) {
        // Rare case where duplicate was inserted between check and save
        throw new ConflictException('Referral code generation failed. Please try again.')
      }

      console.error('Error registering referral:', error)
      throw new InternalServerErrorException('Could not register referral')
    }
  }

  async getOrderListing(userId: number, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit

      // Get orders
      const orders = await getSubscriberOrders(userId, skip, limit)
      if (!orders?.length) throw new Error('No orders found for this subscriber')

      // Map to response
      const mappedOrders = orders.map((order: any) => ({
        serviceName: order.service_name || '',
        serviceImage: order.service_image || null,
        subscribedOn: order.subscribed_on,
        subscriptionPlan: order.plan_type === 1 ? '1 Month' : 'Credits',
        amountPaid: parseFloat(order.amount_paid) || 0,
        discountApplied: parseFloat(order.discount_applied) || 0,
      }))

      return mappedOrders
    } catch (error) {
      this.logger.error('Error in OrdersService.getOrderListing:', error.message || error)
      throw error
    }
  }

  async getMySubscriptions(userId: number, page = 1, limit = 10) {
    try {
      const pageNum = Number(page) || 1
      const limitNum = Number(limit) || 10
      const skip = (pageNum - 1) * limitNum

      const cacheKey = `my_subscriptions_${userId}_page${pageNum}_limit${limitNum}`
      const ttl = Number(process.env.CACHE_TTL_SECONDS) || 300

      const cached = await this.cache.get(cacheKey)
      if (cached) return cached

      const subscriber = await getSubscriberDetails(userId)
      if (!subscriber) throw new NotFoundException('User not found')

      const { totalCount, subscriptions } = await getSubscriberSubscriptions(userId, skip, limitNum)

      const subscriptionDetails = await Promise.all(
        subscriptions.map(async (sub) => {
          let totalStocks = 0
          if (sub.plantype === 1) {
            const stocksCount = await getPortfolioCount(sub.serviceid)
            totalStocks = stocksCount?.rtot || 0
          }

          const statusColor = sub.status === 'Active' ? '#16B24B' : '#FF4444'
          const daysLeft =
            sub.expiry_date !== null ? Math.ceil((new Date(sub.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

          return {
            id: sub.id,
            image: sub.service_image,
            slug: sub.service_slug,
            subscription_id: sub.subscriptionid,
            name: sub.service_name,
            subscription_date: sub.activation_date,
            plantype: sub.plantype,
            status: sub.status,
            expiry_date: checkExpiryDate(sub.expiry_date),
            status_color: statusColor,
            startDate: sub.activation_date || '',
            plan: `${sub.trades_total} Month${sub.trades_total > 1 ? 's' : ''}`,
            current_value: 0,
            total_investment: 0,
            current_returns: 0,
            total_returns: 0,
            total_stocks: totalStocks,
            last_rebalance: sub.last_rebalance_date,
            next_rebalance: sub.next_rebalance_date,
            is_renew: daysLeft !== null && daysLeft <= 5,
            rebalance_frequency: sub.rebalance_frequency,
            activation_date: sub.created_on,
            isActiveSubscription: Number(sub.hasActiveSubscription) === 1,
            isExpiredSubscription: Number(sub.hasExpiredSubscription) === 1,
          }
        })
      )

      const salesRepresentative = [
        {
          name: subscriber.user_fullname,
          phone: subscriber.user_mob2,
          whatsapp_no: subscriber.user_whatsapp,
          whatsapp_msg: 'Hello, Connect with us for further',
        },
      ]

      const finalResponse = {
        status: 'success',
        data: {
          subscription: subscriptionDetails.filter(Boolean),
          sales_representative: salesRepresentative,
          pagination: {
            currentPage: pageNum,
            limit: limitNum,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
          },
        },
      }

      await this.cache.set(cacheKey, finalResponse, ttl)
      return finalResponse
    } catch (error) {
      throw new InternalServerErrorException('Server error occurred: ' + error.message)
    }
  }

  async getSubscriptionDetailsById(userId: number, id: number) {
    try {
      const cacheKey = `subscription_details_${userId}_${id}`
      const ttl = Number(process.env.CACHE_TTL_SECONDS) || 300

      const cached = await this.cache.get(cacheKey)
      if (cached) return cached

      // Parallel fetching: subscriber and subscription
      const [subscriber, sub] = await Promise.all([getSubscriberDetails(userId), getSubscriptionDetails(id)])

      if (!subscriber) throw new NotFoundException('User not found')
      if (!sub) throw new NotFoundException('Subscription not found')

      let stocksCountPromise: Promise<{ rtot: number }> = Promise.resolve({ rtot: 0 })
      if (sub.plantype === 1) {
        stocksCountPromise = getPortfolioCount(sub.serviceid)
      }

      // Run both concurrently
      const [stocksCount] = await Promise.all([stocksCountPromise])

      const statusColor = sub.status === 'Active' ? '#16B24B' : '#FF4444'

      const salesRepresentative = [
        {
          name: subscriber.user_fullname,
          phone: subscriber.user_mob2,
          whatsapp_no: subscriber.user_whatsapp,
          whatsapp_msg: 'Hello, Connect with us for further',
        },
      ]

      const baseData = {
        id: sub.id,
        image: sub.service_image,
        slug: sub.service_slug,
        subscription_id: sub.subscriptionid,
        name: sub.service_name,
        status: sub.status,
        expiry_date: checkExpiryDate(sub.expiry_date),
        activation_date: sub.activation_date,
        status_color: statusColor,
        rebalance_frequency: sub.rebalance_frequency,
        isActiveSubscription: !!sub.hasActiveSubscription,
        isExpiredSubscription: !!sub.hasExpiredSubscription,
        salesRepresentative,
        asset_class: {
          id: sub.asset_class_id,
          name: sub.asset_class_name,
          exchange: sub.asset_class_exchange,
        },
      }

      const commonData = {
        ...baseData,
        plantype: sub.plantype,
      }

      let response: any = null

      const daysLeft = sub.expiry_date ? moment(sub.expiry_date).diff(moment(), 'days') : null
      response = {
        ...commonData,
        plan: `${sub.trades_total} Month${sub.trades_total > 1 ? 's' : ''}`,
        current_value: 0,
        total_investment: 0,
        current_returns: 0,
        total_returns: 0,
        total_stocks: stocksCount?.rtot || 0,
        last_rebalance: sub.last_rebalance_date,
        next_rebalance: sub.next_rebalance_date,
        is_renew: daysLeft !== null && daysLeft <= 5,
      }

      await this.cache.set(cacheKey, { status: 'success', data: response }, ttl)
      return { status: 'success', data: response }
    } catch (error) {
      this.logger.error('getSubscriptionDetailsById error:', error)
      throw new InternalServerErrorException('Something went wrong')
    }
  }

  async getSubscriberBillingDetails(subscriberid: number) {
    try {
      const subscriber = await findSubscriberBillingDetails(subscriberid)
      if (!subscriber) {
        return { success: false, message: 'Subscriber not found' }
      }

      const stateList = await getStateList()

      return {
        success: true,
        message: 'Billing details retrieved successfully',
        result: {
          pan: subscriber.pan_number,
          mobileno: subscriber.mobileno,
          name_as_per_pan: subscriber.name_pann,
          dob: subscriber.dob ? subscriber.dob.toISOString().split('T')[0] : null,
          state: parseInt(subscriber.state),
          statelist: stateList,
        },
      }
    } catch (error) {
      this.logger.error('Error fetching subscriber billing details:', error)
      throw new InternalServerErrorException('Internal Server Error')
    }
  }
  async updateSubscriberBillingDetails(dto: UpdateSubscriberBillingDetailsDto, subscriberid: number) {
    try {
      const subscriber = await findSubscriberWithDoc(subscriberid)
      if (!subscriber) {
        return { success: false, message: 'Subscriber not found' }
      }

      if (subscriber.docid) {
        // Update existing document
        await updateSubscriberDocument(subscriber.docid, dto.pan, dto.name_as_per_pan, dto.dob)
      } else {
        // Insert new document
        await insertSubscriberDocument(subscriber.id, dto.pan, dto.name_as_per_pan, dto.dob)
      }

      // Update subscriber state
      await updateSubscriberState(subscriber.id, dto.state)

      return { success: true, message: 'Updated Successfully' }
    } catch (error) {
      this.logger.error('Error updating subscriber billing details:', error)
      throw new InternalServerErrorException('Internal Server Error')
    }
  }

  // async getGeneralNotifications(subscriberid: number, page = 1, limit = 10) {
  //   try {
  //     const offset = (page - 1) * limit
  //     const cacheKey = `general_notifications_${subscriberid}_p${page}_l${limit}`

  //     // Try to fetch from cache
  //     const cached = await this.cache.get(cacheKey)
  //     if (cached) return cached

  //     // 1. Get subscriber
  //     const subscriber = await getUserBy({ id: subscriberid }, ['id', 'mobileno', 'created_on'])
  //     const { mobileno, created_on } = subscriber

  //     // 2. Find user (no need for created_on now)
  //     // const user = await this.dataSource
  //     //   .createQueryBuilder()
  //     //   .select(['u.id AS id'])
  //     //   .from('tbl_userinfo', 'u')
  //     //   .where('u.token = :token AND u.user_mob = :mobileno', { token, mobileno })
  //     //   .orderBy('u.id', 'ASC')
  //     //   .limit(1)
  //     //   .getRawOne()

  //     // 3. Build general notification query
  //     const notifyId = subscriber?.id ?? 0
  //     const allGeneral = await getGeneralPushNotifications(notifyId, created_on.toISOString())

  //     const allPush = await getPushNotifications(notifyId, created_on.toISOString())

  //     // 5. Process and merge
  //     const notifyresponse: any[] = []

  //     for (const post of allGeneral) {
  //       if (post.datatype === 0) {
  //         const exists = await findPushNotifySubscriber(post.id, mobileno)
  //         if (!exists) continue
  //       }

  //       const created = post.created_on
  //         ? new Date(post.created_on).toLocaleString('en-GB', {
  //             day: '2-digit',
  //             month: '2-digit',
  //             year: 'numeric',
  //             hour: '2-digit',
  //             minute: '2-digit',
  //             hour12: true,
  //           })
  //         : ''

  //       notifyresponse.push({
  //         id: post.id,
  //         title: post.title,
  //         message: post.message,
  //         src_url: post.src_url,
  //         nurl: post.nurl,
  //         notifyid: post.notifyid,
  //         created_on: post.created_on,
  //         url: post.notifyid === 0 && post.src_url ? post.src_url : post.nurl || '',
  //         created,
  //       })
  //     }

  //     for (const post of allPush) {
  //       const created = post.created_on
  //         ? new Date(post.created_on).toLocaleString('en-GB', {
  //             day: '2-digit',
  //             month: '2-digit',
  //             year: 'numeric',
  //             hour: '2-digit',
  //             minute: '2-digit',
  //             hour12: true,
  //           })
  //         : ''

  //       notifyresponse.push({
  //         id: post.id,
  //         title: post.title,
  //         message: post.message,
  //         src_url: post.src_url,
  //         nurl: post.nurl,
  //         notifyid: post.notifyid,
  //         created_on: post.created_on,
  //         url: post.notifyid === 0 && post.src_url ? post.src_url : post.nurl || '',
  //         created,
  //       })
  //     }

  //     // Sort all notifications
  //     notifyresponse.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())

  //     const total = notifyresponse.length
  //     const paginatedData = notifyresponse.slice(offset, offset + limit)

  //     const response = {
  //       success: true,
  //       message: 'Success',
  //       result: {
  //         total,
  //         page,
  //         limit,
  //         notificationlist: paginatedData,
  //       },
  //     }

  //     // Cache result
  //     const ttl = Number(process.env.CACHE_TTL_SECONDS) || 300
  //     await this.cache.set(cacheKey, response, ttl)

  //     return response
  //   } catch (error) {
  //     this.logger.error('Error fetching general notifications:', error)
  //     return {
  //       success: false,
  //       message: 'Something went wrong while fetching notifications',
  //     }
  //   }
  // }

  async getGeneralNotifications(subscriberid: number, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit
      const cacheKey = `general_notifications_${subscriberid}_p${page}_l${limit}`

      // 1. Try to fetch from cache
      const cached = await this.cache.get(cacheKey)
      if (cached) return cached

      // 2. Get subscriber
      const subscriber = await getUserBy({ id: subscriberid }, ['id', 'mobileno', 'created_on'])
      if (!subscriber) {
        const errorResponse = { success: false, message: 'No valid subscriber found for this ID' }
        await this.cache.set(cacheKey, errorResponse, 60)
        return errorResponse
      }
      const { mobileno, created_on } = subscriber
      const notifyId = subscriber?.id ?? 0

      // 3. Fetch all notifications in parallel
      const [allGeneral, allPush, allPortfolio] = await Promise.all([
        getGeneralPushNotifications(notifyId, created_on.toISOString()),
        getPushNotifications(notifyId, created_on.toISOString()),
        await (
          await dataSource
        )
          .createQueryBuilder()
          .select([
            'pf.id AS id',
            'pf.title AS title',
            'pf.message AS message',
            'pf.src_url AS src_url',
            'pf.src_url AS nurl',
            'pf.notifyid AS notifyid',
            'pf.datatype AS datatype',
            'pf.created_on AS created_on',
          ])
          .from('tbl_portfolio_pushnotification', 'pf')
          .where('(pf.datatype = 1 OR pf.notifyid = 0 OR pf.notifyid = :notifyId)', { notifyId })
          .andWhere(created_on ? 'pf.created_on > :createdOn' : '1=1', { createdOn: created_on })
          .orderBy('pf.created_on', 'DESC')
          .getRawMany(),
      ])

      // 4. Batch-check "exists" for datatype=0 notifications
      const generalIdsToCheck = allGeneral.filter((n) => n.datatype === 0).map((n) => n.id)
      const portfolioIdsToCheck = allPortfolio.filter((n) => n.datatype === 0).map((n) => n.id)

      const [generalExists, portfolioExists] = await Promise.all([
        generalIdsToCheck.length
          ? await (
              await dataSource
            )
              .createQueryBuilder()
              .select('gps.nid AS nid')
              .from('tbl_gen_pushnotifysub', 'gps')
              .where('gps.nid IN (:...ids) AND gps.mobile = :mobileno', {
                ids: generalIdsToCheck,
                mobileno,
              })
              .getRawMany()
          : [],
        portfolioIdsToCheck.length
          ? await (
              await dataSource
            )
              .createQueryBuilder()
              .select('pps.nid AS nid')
              .from('tbl_portfolio_pushnotifysub', 'pps')
              .where('pps.nid IN (:...ids) AND pps.mobile = :mobileno', {
                ids: portfolioIdsToCheck,
                mobileno,
              })
              .getRawMany()
          : [],
      ])

      const generalAllowedIds = new Set(generalExists.map((r) => r.nid))
      const portfolioAllowedIds = new Set(portfolioExists.map((r) => r.nid))

      // 5. Merge and format notifications
      const notifyresponse: any[] = []

      const formatNotif = (post: any) => {
        const created = post.created_on
          ? new Date(post.created_on).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : ''
        return {
          id: post.id,
          title: post.title,
          message: post.message,
          src_url: post.src_url,
          nurl: post.nurl,
          notifyid: post.notifyid,
          created_on: post.created_on,
          url: post.notifyid === 0 && post.src_url ? post.src_url : post.nurl || '',
          created,
        }
      }

      for (const post of allGeneral) {
        if (post.datatype === 0 && !generalAllowedIds.has(post.id)) continue
        notifyresponse.push(formatNotif(post))
      }

      for (const post of allPush) {
        notifyresponse.push(formatNotif(post))
      }

      for (const post of allPortfolio) {
        if (post.datatype === 0 && !portfolioAllowedIds.has(post.id)) continue
        notifyresponse.push(formatNotif(post))
      }

      // 6. Sort + paginate
      notifyresponse.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())
      const total = notifyresponse.length
      const paginatedData = notifyresponse.slice(offset, offset + limit)

      const response = {
        success: true,
        message: 'Success',
        result: {
          total,
          page,
          limit,
          notificationlist: paginatedData,
        },
      }

      // 7. Cache result
      const ttl = Number(process.env.CACHE_TTL_SECONDS) || 300
      await this.cache.set(cacheKey, response, ttl)

      return response
    } catch (error) {
      this.logger.error('Error fetching general notifications:', error)
      return {
        success: false,
        message: 'Something went wrong while fetching notifications',
      }
    }
  }
}
