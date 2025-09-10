import { HttpException, HttpStatus, Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { CreatePlanDto, CreatePortfolioOrderDto, CreateSubscriptionDto } from './payment.dto'
import Razorpay from 'razorpay'
import { DataSource } from 'typeorm'
import dayjs from 'dayjs'
import { logger } from 'middlewares/logger.middleware'
import { getUserBy } from 'modules/auth/auth.repository'
import { fetchOfferByCode, fetchPlan } from 'modules/portfolio/portfolio.reposistory'

@Injectable()
export class PaymentService {
  private readonly logger = logger

  private readonly razorpay: Razorpay

  constructor(private readonly dataSource: DataSource) {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_SECRET

    if (!key_id || !key_secret) {
      this.logger.error('Missing Razorpay configuration', {
        hasKeyId: !!key_id,
        hasKeySecret: !!key_secret,
      })
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_SECRET are required')
    }

    try {
      this.razorpay = new Razorpay({ key_id, key_secret })
      console.log(`Razorpay initialized successfully`)
    } catch (error) {
      this.logger.error('Failed to initialize Razorpay', error)
      throw new Error('Failed to initialize Razorpay client')
    }
  }

  async getSubscriberDetails(subscriberid: string): Promise<{ subscriberid: string; authid: string } | null> {
    if (!subscriberid) return null

    const result = await this.dataSource
      .createQueryBuilder()
      .select(['s.id AS id', 's.subscriberid AS subscriberid', 's.authid AS authid'])
      .from('tbl_subscriber', 's')
      .where('s.isdelete = 0 AND s.subscriberid = :subscriberid', { subscriberid })
      .getRawOne<{ subscriberid: string; authid: string }>()
    return result ?? null
  }

  async createPlan(dto: CreatePlanDto) {
    this.logger.log('Creating Razorpay plan', {
      period: dto.period,
      interval: dto.interval,
      itemName: dto.item.name,
      amount: dto.item.amount,
      currency: dto.item.currency,
    })

    // Validate input
    if (!dto.period || !dto.interval || !dto.item) {
      this.logger.error('Invalid plan creation request', { dto })
      throw new BadRequestException('Period, interval, and item are required')
    }

    if (!dto.item.name || !dto.item.amount || !dto.item.currency) {
      this.logger.error('Invalid item data in plan creation', { item: dto.item })
      throw new BadRequestException('Item name, amount, and currency are required')
    }

    try {
      const planData = {
        period: dto.period,
        interval: dto.interval,
        item: {
          name: dto.item.name,
          amount: dto.item.amount,
          currency: dto.item.currency,
          description: dto.item.description || '',
        },
      }

      const plan = await this.razorpay.plans.create(planData)

      this.logger.log('Plan created successfully', {
        planId: plan.id,
        period: plan.period,
        interval: plan.interval,
      })

      return {
        success: true,
        plan_id: plan.id,
      }
    } catch (error: any) {
      const errorMessage = error.error?.description || error.message || 'Create plan failed'
      const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR

      this.logger.error('Plan creation failed', {
        error: error.error,
        statusCode,
        field: error.error?.field,
        description: error.error?.description,
        code: error.error?.code,
      })

      throw new HttpException(
        {
          message: errorMessage,
          statusCode,
          context: 'Create plan',
          timestamp: new Date().toISOString(),
        },
        statusCode
      )
    }
  }

  async createSubscription(dto: CreateSubscriptionDto) {
    this.logger.log('Creating Razorpay subscription', {
      planId: dto.planid,
    })

    if (!dto.planid || dto.planid.trim() === '') {
      this.logger.error('Invalid subscription creation request - missing planid')
      throw new BadRequestException('Plan ID is required and cannot be empty')
    }

    try {
      const subscriptionData = {
        plan_id: dto.planid.trim(),
        total_count: 12,
      }

      const subscription = await this.razorpay.subscriptions.create(subscriptionData)

      this.logger.log('Subscription created successfully', {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        status: subscription.status,
        totalCount: subscription.total_count,
      })

      // ✅ Update `productid` in tbl_services_sub
      if (dto.serviceSubId) {
        await this.dataSource
          .createQueryBuilder()
          .update('tbl_services_sub')
          .set({ productid: dto.planid.trim() })
          .where('id = :id', { id: dto.serviceSubId })
          .execute()
      }

      // ✅ Insert into tbl_razorpay_order
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_razorpay_order')
        .values({
          serviceid: 0,
          subscriberid: 0,
          ordertype: 1, // 1 - Portfolio Based
          orderid: subscription.id, // Razorpay subscription ID
          transactionid: null, // will be filled after payment
          status: 0, // 0 = pending
          updated_on: new Date(),
        })
        .execute()

      // ✅ Insert into tbl_razorpay_order

      return {
        success: true,
        subscription,
      }
    } catch (error: any) {
      const errorMessage = error.error?.description || error.message || 'Create subscription failed'
      const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR

      this.logger.error('Subscription creation failed', {
        error: error.error,
        statusCode,
        field: error.error?.field,
        description: error.error?.description,
        code: error.error?.code,
      })

      throw new HttpException(
        {
          message: errorMessage,
          statusCode,
          context: 'Create subscription',
          timestamp: new Date().toISOString(),
        },
        statusCode
      )
    }
  }

  async createOrder(dto: { amount: number; currency: string; receipt?: string }) {
    this.logger.log('Creating Razorpay order', {
      amount: dto.amount,
      currency: dto.currency,
    })

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number')
    }

    if (!dto.currency || dto.currency.length !== 3) {
      throw new BadRequestException('Currency must be a 3-letter ISO code')
    }

    try {
      // Convert to paise (or smallest unit)
      const amountInSubunit = Math.round(dto.amount * 100)

      const orderData = {
        amount: amountInSubunit,
        currency: dto.currency,
        receipt: `receipt_order_${Date.now()}`,
      }

      const order = await this.razorpay.orders.create(orderData)

      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_razorpay_order')
        .values({
          serviceid: 0,
          subscriberid: 0,
          ordertype: 0, // 0 = Credit Based
          orderid: order.id, // Razorpay order ID
          transactionid: null, // will be updated on payment success
          status: 0, // 0 = pending
          updated_on: new Date(),
        })
        .execute()

      this.logger.log('Order created successfully', { status: order.status })

      return {
        success: true,
        order,
      }
    } catch (error: any) {
      const errorMessage = error?.error?.description || error.message || 'Create order failed'
      const statusCode = error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR

      this.logger.error('Order creation failed', {
        error: error.error,
        statusCode,
        field: error.error?.field,
        description: error.error?.description,
        code: error.error?.code,
      })

      throw new HttpException(
        {
          message: errorMessage,
          statusCode,
          context: 'Create order',
          timestamp: new Date().toISOString(),
        },
        statusCode
      )
    }
  }

  async getOrderById(orderId: string) {
    if (!orderId) {
      throw new BadRequestException('Order ID is required')
    }

    try {
      const order = await this.razorpay.orders.fetch(orderId)

      return {
        success: true,
        order,
      }
    } catch (error: any) {
      const errorMessage = error?.error?.description || error.message || 'Fetch order failed'
      const statusCode = error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR

      this.logger.error('Error fetching order', {
        error: error.error,
        orderId,
      })

      throw new HttpException(
        {
          message: errorMessage,
          statusCode,
          context: 'Fetch order',
          timestamp: new Date().toISOString(),
        },
        statusCode
      )
    }
  }

  async getRazorPayKey(subscriberid: number) {
    if (!subscriberid) {
      throw new BadRequestException('User ID is missing.')
    }

    try {
      // Get Razorpay keys
      const apiDetails = await this.dataSource
        .createQueryBuilder()
        .select(['c.razorpay_key AS razorpay_key', 'c.razorpay_secret AS razorpay_secret'])
        .from('tbl_configuration', 'c')
        .where('c.id = 1')
        .getRawOne()

      if (!apiDetails) {
        throw new NotFoundException('API details not found')
      }

      return {
        success: true,
        message: 'API retrieved successfully',
        result: {
          apikey: apiDetails.razorpay_key,
          secretkey: apiDetails.razorpay_secret,
        },
      }
    } catch (error) {
      this.logger.error('Error fetching Razorpay key:', error)
      throw new InternalServerErrorException(error.message || 'Internal Server Error')
    }
  }

  async paymentSuccessPortfolio(dto: CreatePortfolioOrderDto, userId: number) {
    const { transactionId, razorpaySubscriptionId, serviceId, serviceSubId, couponcode, use_balance } = dto

    const today = new Date().toISOString().slice(0, 19).replace('T', ' ')

    try {
      const user = await getUserBy(
        { id: userId },
        ['id', 'fullname', 'mobileno', 'email', 'assignedto'] // optional selected fields
      )

      if (!user) throw new NotFoundException('No subscriber found')
      // Fetch plan data
      const planData = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('tbl_services_sub', 'ss')
        .where('ss.isdelete = 0 AND ss.id = :serviceSubId', { serviceSubId })
        .getRawOne()

      if (!planData) throw new BadRequestException('Plan not found')

      const amount = Number(planData.credits_price)

      console.log(userId, amount, transactionId)
      if (!userId || !amount || !transactionId) {
        throw new BadRequestException('Required parameters are missing')
      }

      // Handle coupon code logic
      let offerId = 0
      let offerType = '1'
      let cartReferBy = 0

      if (couponcode) {
        const offerData = await this.dataSource
          .createQueryBuilder()
          .select('*')
          .from('tbl_offers', 'o')
          .where('o.offercode = :couponcode', { couponcode })
          .getRawMany()

        if (offerData.length) {
          offerId = offerData[0].id
          offerType = '0'
        } else {
          const cartRefData = await this.dataSource
            .createQueryBuilder()
            .select('*')
            .from('tbl_cart_referral', 'cr')
            .where('cr.sub_id = :userId AND cr.code = :couponcode', { userId, couponcode })
            .getRawMany()

          if (cartRefData.length) {
            offerType = '2'
            cartReferBy = cartRefData[0].updated_by || cartRefData[0].created_by

            await this.dataSource
              .createQueryBuilder()
              .delete()
              .from('tbl_cart_referral')
              .where('id = :id', { id: cartRefData[0].id })
              .execute()
          }
        }
      }

      // Generate invoice
      const invoiceArr = await this.getOrderInvoice(amount)
      const orderId = invoiceArr.invoiceno
      // const taxAmount = 0
      // Insert order
      // Check if order exists for this transactionId
      const existingOrder = await this.dataSource
        .createQueryBuilder()
        .select('o.id', 'id')
        .from('tbl_order', 'o')
        .where('o.transactionid = :transactionId', { transactionId })
        .getRawOne()

      let orderInsertedId: number

      console.log(existingOrder)
      if (existingOrder) {
        // Update existing order
        await this.dataSource
          .createQueryBuilder()
          .update('tbl_order')
          .set({
            subscriberid: userId,
            research_fee: amount,
            discount_amt: 0,
            tax_amt: 0,
            amount_payable: amount,
            actual_amount: amount,
            offerid: offerId,
            offercode: couponcode,
            offer_type: offerType,
            payment_mode: 'Razorpay',
            payment_date: today,
            payment_source: 'MobileApp',
            sales_manager: user.assignedto,
            order_approval: 1,
            cart_refer_by: cartReferBy,
          })
          .where('id = :id', { id: existingOrder.id })
          .execute()

        orderInsertedId = existingOrder.id
      } else {
        // Insert new order
        const orderResult = await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('tbl_order')
          .values({
            orderid: orderId,
            subscriberid: userId,
            research_fee: amount,
            discount_amt: 0,
            tax_amt: 0,
            amount_payable: amount,
            actual_amount: amount,
            offerid: offerId,
            offercode: couponcode,
            offer_type: offerType,
            transactionid: transactionId,
            orderinvoiceyear: invoiceArr.invoiceyear,
            orderinvno: invoiceArr.invno,
            payment_mode: 'Razorpay',
            payment_date: today,
            payment_source: 'MobileApp',
            sales_manager: user.assignedto,
            order_approval: 1,
            cart_refer_by: cartReferBy,
          })
          .execute()

        orderInsertedId = orderResult.raw.insertId
      }

      // Now handle tbl_order_sub (insert if not exists)
      const existingOrderSub = await this.dataSource
        .createQueryBuilder()
        .select('id')
        .from('tbl_order_sub', 'os')
        .where('os.order_id = :orderInsertedId AND os.serviceid = :serviceId', {
          orderInsertedId,
          serviceId,
        })
        .getRawOne()

      if (existingOrderSub) {
        // Optionally update existing order_sub if needed
        await this.dataSource
          .createQueryBuilder()
          .update('tbl_order_sub')
          .set({
            service_subid: serviceSubId,
            subscriberid: userId,
            trade: planData.credits,
            price: amount,
          })
          .where('id = :id', { id: existingOrderSub.id })
          .execute()
      } else {
        // Insert new order_sub
        await this.dataSource
          .createQueryBuilder()
          .insert()
          .into('tbl_order_sub')
          .values({
            order_id: orderInsertedId,
            serviceid: serviceId,
            service_subid: serviceSubId,
            subscriberid: userId,
            trade: planData.credits,
            price: amount,
          })
          .execute()
      }

      // 🔹 SUBSCRIPTION: Insert or update
      const expiry_date = dayjs(today)
        .add(planData.credits * 30, 'day')
        .format('YYYY-MM-DD')

      // Insert subscription
      const subscriptionid = await this.getSubscriptionID()
      const subscriptionResult = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_subscription')
        .values({
          subscriptionid,
          subscriberid: userId,
          serviceid: serviceId,
          amount,
          stype: 'Paid',
          sales_manager: Number(user.sales_manager) || 0,
          assigned_user: Number(user.assignedto) || 0,
          trades_total: planData.credits,
          pay_date: today,
          plantype: 1,
          pay_mode: 'Razorpay',
          status: 'Active',
          payment_source: 'MobileApp',
          pay_refno: transactionId,
          ordersub_refno: orderInsertedId,
          expiry_date: expiry_date,
          razorpay_subscriptionid: razorpaySubscriptionId,
          created_by: userId,
          created_on: today,
        })
        .execute()

      const subscriptionRecordId = subscriptionResult.raw.insertId

      // await this.commonService.checkWorkflowSubscriptionWorkflow(subscriptionRecordId, 'Add')

      // Referral points logic
      if (!use_balance && couponcode) {
        const subData = await this.dataSource
          .createQueryBuilder()
          .select('*')
          .from('tbl_subscriber', 's')
          .where('s.isdelete = 0 AND s.id != :userId AND s.referralcode = :couponcode', {
            userId,
            couponcode,
          })
          .getRawMany()

        if (subData.length) {
          const usedRef = await this.dataSource
            .createQueryBuilder()
            .select('*')
            .from('tbl_referral_info', 'r')
            .where('r.sub_id = :userId AND r.referral_code = :couponcode', { userId, couponcode })
            .getRawMany()

          if (!usedRef.length) {
            await this.dataSource
              .createQueryBuilder()
              .insert()
              .into('tbl_referral_info')
              .values({
                referral_id: subData[0].id,
                referral_code: couponcode,
                sub_id: userId,
                ref_source: 'MobileApp',
                ref_amt: 20,
                ref_type: 1,
                created_by: userId,
                created_on: today,
              })
              .execute()

            await this.dataSource
              .createQueryBuilder()
              .update('tbl_subscriber')
              .set({
                // balance: () => 'balance + 20',
                verifykycon: today,
              })
              .where('id = :userId', { userId })
              .execute()
          }
        }
      }

      // After subscription insertion
      await this.dataSource
        .createQueryBuilder()
        .update('tbl_razorpay_order')
        .set({
          serviceid: serviceId,
          subscriberid: userId,
          ordertype: 1, // 1 - Portfolio Based
          transactionid: transactionId, // update transaction ID
          status: 1, // success
          updated_on: today,
        })
        .where('orderid = :orderid', { orderid: razorpaySubscriptionId })
        .execute()

      await this.dataSource
        .createQueryBuilder()
        .update('tbl_subscriber')
        .set({
          // balance: () => 'balance + 20',
          verifykycon: today,
        })
        .where('id = :userId', { userId })
        .execute()

      return {
        success: true,
        message: 'Payment successful',
        orderId: orderInsertedId,
        subscriptionId: subscriptionRecordId,
        subscriptionCode: subscriptionid,
      }
    } catch (err) {
      this.logger.error('Error in paymentSuccessPortfolio:', err)
      throw err
    }
  }

  async applyOffer(offerCode: string) {
    if (!offerCode) {
      throw new BadRequestException('offerCode is required')
    }

    // 1️⃣ Get offer details first
    const offer = await fetchOfferByCode(offerCode)
    if (!offer) throw new NotFoundException('Invalid or expired offer')

    // 2️⃣ Get plan details using planid & serviceid from offer
    const plan = await fetchPlan(offer?.planid, offer?.serviceid)
    if (!plan) throw new NotFoundException('Plan not found')

    // 3️⃣ Calculate percentage discount
    const discountPercent = offer.offervalue || 0
    const discount = (plan.credits_price * discountPercent) / 100
    const finalAmount = Math.max(plan.credits_price - discount, 0)

    // 4️⃣ Return response
    return {
      success: true,
      message: 'Offer applied successfully',
      result: {
        planId: offer.planid,
        serviceId: offer.serviceid,
        originalAmount: plan.credits_price,
        discountPercent,
        discount,
        payableAmount: finalAmount,
        appliedOffer: {
          code: offer.offercode,
          name: offer.offername,
        },
      },
    }
  }

  async getOrderInvoice(amount = 0) {
    const invReturn = { invoiceno: '', invoiceyear: '', invno: 0 }
    if (amount <= 0) return invReturn

    const now = new Date()
    const currentYear = now.getFullYear()
    const year = currentYear.toString().slice(-2)
    const fiscalStart = new Date(`${currentYear}-04-01`)
    const checkYear = now >= fiscalStart ? `${year}-${parseInt(year) + 1}` : `${parseInt(year) - 1}-${year}`

    try {
      const lastOrder = await this.dataSource
        .createQueryBuilder()
        .select(['orderid', 'orderinvno'])
        .from('tbl_order', 'o')
        .where('o.isdelete = 0')
        .andWhere('o.amount_payable > 100')
        .andWhere('o.orderinvoiceyear = :checkYear', { checkYear })
        .andWhere('o.c_type = 0')
        .orderBy('o.orderinvno', 'DESC')
        .limit(1)
        .getRawOne()

      let nextInvNo = 1
      if (lastOrder?.orderid) {
        const parts = lastOrder.orderid.split('/')
        if (parts[1] === checkYear) nextInvNo = lastOrder.orderinvno + 1
      }

      invReturn.invno = nextInvNo
      invReturn.invoiceno = `SGTPL/${checkYear}/${nextInvNo.toString().padStart(4, '0')}`
      invReturn.invoiceyear = checkYear
    } catch (error) {
      this.logger.error('Error generating order invoice:', error)
      throw error
    }

    return invReturn
  }

  async getSubscriptionID(): Promise<string> {
    let subscriptionid = 'SGSER0001' // Default

    try {
      const lastSub = await this.dataSource
        .createQueryBuilder()
        .select('subscriptionid')
        .from('tbl_subscription', 's')
        .where('s.isdelete = 0')
        .orderBy('s.id', 'DESC')
        .limit(1)
        .getRawOne()

      if (lastSub?.subscriptionid) {
        const lastNum = parseInt(lastSub.subscriptionid.replace('SGSER', ''), 10)
        subscriptionid = 'SGSER' + (lastNum + 1).toString().padStart(4, '0')
      }
    } catch (error) {
      this.logger.error('Error getting subscription ID:', error)
      throw error
    }

    return subscriptionid
  }
}
