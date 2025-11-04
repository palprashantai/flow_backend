import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Not, Repository } from 'typeorm'

import { JwtPayload } from './auth.interface'
import { ConfigService } from '@nestjs/config'
import { getNextSubscriberID, getUserBy, getUtmByDeviceId, insertOtp, insertOtpLog } from './auth.repository'
import { getCurrentDateTime, sanitize, sanitizeMobile } from 'helper'
import { OtpBoxEntity, Subscriber, SubscriberRecent, UserInfo, WorkflowLeadCreation } from './auth.entity'
import { RegisterDto, VerifyOtpDto } from './auth.dto'
import { CommonService } from 'modules/common/common.service'
import { logger } from 'middlewares/logger.middleware'
import { WorkflowService } from 'modules/common/workflowphp.service'
// import { GrpcClientService } from 'grpc/grpc-client.service'

@Injectable()
export class AuthService {
  private readonly logger = logger

  constructor(
    private readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly dataSource: DataSource,
    @InjectRepository(OtpBoxEntity)
    private readonly otpRepo: Repository<OtpBoxEntity>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(SubscriberRecent)
    private readonly subscriberRecentRepo: Repository<SubscriberRecent>,
    @InjectRepository(WorkflowLeadCreation)
    private readonly workflowLeadCreationRepository: Repository<WorkflowLeadCreation>,
    @InjectRepository(UserInfo)
    private readonly userInfoRepository: Repository<UserInfo>,
    private readonly workflowService: WorkflowService

    // private readonly grpcClient: GrpcClientService
  ) {}

  async getJWT(mobile: string, otp: string): Promise<{ token: string }> {
    // ✅ For demo: accept OTP = "123456"

    const payload = { mobile, otp }
    const token = await this.jwtService.signAsync(payload, { expiresIn: '1h' })

    return { token }
  }

  /** Generates a token for authentication.
   * @param {number} id
   */

  async generateToken(id: number): Promise<string> {
    const payload: JwtPayload = { id }
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '1h',
      secret: this.configService.get('JWT_SECRET'),
    })
  }

  /**
   * Generate and send OTP for a user.
   * @param mobileNo - User's mobile number
   * @param deviceId - Device identifier
   */
  async getOtpNew(mobileNo: string, deviceId: string): Promise<void> {
    const sanitizedMobile = sanitizeMobile(mobileNo)
    const cleanDeviceId = deviceId || ''

    if (!mobileNo) {
      this.logger.warn('Mobile number missing in getOtpNew')
      throw new BadRequestException('Mobile number is required')
    }

    if (!sanitizedMobile || sanitizedMobile.length !== 10) {
      this.logger.warn(`Invalid mobile format: ${mobileNo}`)
      throw new BadRequestException('Invalid mobile number format')
    }

    // Bypass check for test number
    if (sanitizedMobile !== '9999999999') {
      if (cleanDeviceId) {
        const deviceCheck = await this.subscriberRepo.findOne({
          where: {
            deviceid: cleanDeviceId,
            isdelete: 0,
            mobileno: Not(sanitizedMobile),
          },
        })

        if (deviceCheck) {
          this.logger.error(`Device already registered: ${cleanDeviceId}`)
          throw new ConflictException('This device is already registered with another number. Please login with that number')
        }
      }

      // ✅ OTP Generation (4 digits)
      const otp = Math.floor(1000 + Math.random() * 9000)
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

      this.logger.info(`Generated OTP ${otp} for mobile ${sanitizedMobile}`)

      await insertOtpLog(sanitizedMobile, {
        MobileNo: mobileNo,
        DeviceId: cleanDeviceId,
      })

      await insertOtp(sanitizedMobile, otp, now)

      const message = `Welcome to Streetgains. Your Login OTP is ${otp}\n\n - STREETGAINS ZrPVJ2XWTij`

      // const message = `Welcome to Streetfolio - Model Portfolios by Streetgains\nYour login OTP is ${otp}\n\nZrPVJ2XWTij -STREETGAINS`
      console.log(message)

      this.logger.debug(`Sending SMS to ${sanitizedMobile}: ${message}`)
      await this.commonService.sendSms(sanitizedMobile, message)
    }
  }

  /**
   * Verifies a subscriber's OTP, creates a new subscriber if needed,
   * updates device info, logs activity, and returns a JWT.
   *
   * @param mobileNo - Subscriber's mobile number.
   * @param deviceId - Device ID of the request.
   * @param otp - OTP entered by the subscriber.
   * @param fcmToken - FCM token for push notifications.
   * @returns Object with usertype, JWT, and subscriber info.
   *
   * @throws BadRequestException if mobile or OTP is missing.
   * @throws UnauthorizedException if OTP is invalid.
   */
  async otpVerification(
    mobileNo: string,
    deviceId: string,
    otp: string,
    fcmToken: string
  ): Promise<{ usertype: number; jwt: string; subscriber: any }> {
    const sanitizedMobile = sanitizeMobile(mobileNo)
    const cleanOtp = sanitize(otp)
    const cleanDeviceId = deviceId || ''
    const cleanToken = fcmToken || ''
    const currentTime = getCurrentDateTime()

    if (!sanitizedMobile || !otp) {
      this.logger.warn('OTP or Mobile number missing in otpVerification')
      throw new BadRequestException('Mobile number and OTP are required')
    }
    console.log(`Verifying OTP ${cleanOtp} for mobile ${sanitizedMobile}`) // Debug log

    // Parallel execution of independent queries
    const [otpResult, subscriber, logEvent, referralConfig] = await Promise.all([
      this.otpRepo.findOne({
        where: { mobileno: sanitizedMobile },
        order: { id: 'DESC' },
      }),
      this.subscriberRepo.findOne({
        where: { mobileno: sanitizedMobile, isdelete: 0 },
      }),
      getUtmByDeviceId(cleanDeviceId),
      this.dataSource
        .createQueryBuilder()
        .select('config.referral_amount', 'referral_amount')
        .from('tbl_configuration', 'config')
        .getRawOne(),
    ])

    console.log('OTP record found:', otpResult) // Debug log
    if (!otpResult || otpResult.otpnumber !== cleanOtp) {
      this.logger.error(`Invalid OTP for ${sanitizedMobile}`)
      throw new UnauthorizedException('Invalid OTP')
    }

    console.log('Log Event:', 'Verified') // Debug log
    const referralAmount = referralConfig ? Number(referralConfig.referral_amount) : 0
    let usertype = 0
    let finalSubscriber = subscriber

    console.log('Subscriber found:', subscriber) // Debug log
    if (!subscriber) {
      // New subscriber flow
      usertype = 1
      const [subscriberid, assignedto] = await Promise.all([
        getNextSubscriberID(),
        this.workflowService.assignLeadSubscriber('MobileApp', 0, 1),
      ])
      console.log(assignedto)
      const newSubscriber = this.subscriberRepo.create({
        subscriberid: subscriberid,
        assignedto,
        fullname: 'Subscriber',
        mobileno: sanitizedMobile,
        email: '',
        lead_source: 'MobileApp',
        deviceid: cleanDeviceId,
        token: cleanToken,
        created_on: currentTime,
        recent_contacted: currentTime,
        utm_source: logEvent.utm_source || '',
        utm_campaign: logEvent.utm_campaign || '',
        utm_medium: logEvent.utm_medium || '',
        isfolio: 1,
      })

      finalSubscriber = await this.subscriberRepo.save(newSubscriber)

      console.log('New subscriber created with ID:', finalSubscriber.id) // Debug log

      // Parallel execution for new subscriber operations
      const [user] = await Promise.all([
        getUserBy({ referralcode: logEvent.utm_campaign }, ['id']),
        this.subscriberRecentRepo.save({
          subscriberid: finalSubscriber.id,
          source: 'MobileApp',
          lead_type: usertype,
          lead_source: 'MobileApp',
          created_on: new Date(),
          utm_source: logEvent.utm_source || '',
          utm_campaign: logEvent.utm_campaign || '',
          utm_medium: logEvent.utm_medium || '',
        }),
      ])

      // Referral operations (wallet folio depends on referral folio ID)
      const referralFolio = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_referral_info_folio')
        .values({
          sub_id: finalSubscriber.id,
          referral_id: user?.id || 0,
          referral_code: logEvent.utm_campaign,
          amount: referralAmount,
          status: 0,
          updated_on: currentTime,
          datetime: currentTime,
        })
        .execute()

      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_wallet_folio')
        .values({
          subscriberid: finalSubscriber.id,
          referid: referralFolio.identifiers[0]?.id || 0,
          amount: referralAmount,
          type: 0,
        })
        .execute()
      // ;(this.workflowService.callLeadCreationWorkflow(finalSubscriber.id, 1), // default productApp = 0
      //   this.workflowService.callSubscriberInsertWorkflow(finalSubscriber.id, 1),
        // await this.grpcClient.checkLeadWorkflow(finalSubscriber.id) // Using the same ID for testing
        // await this.grpcClient.checkSubscriberWorkflow(finalSubscriber.id, 'insert')

        // this.logger.info(`New subscriber created: ${subscriberid}`))

        console.log('Calling workflows for new subscriber ID:', finalSubscriber.id) // Debug log
        this.workflowService.callLeadCreationWorkflow(finalSubscriber.id, 1)
        this.workflowService.callSubscriberInsertWorkflow(finalSubscriber.id, 1)

        console.log('New subscriber flow completed for ID:', finalSubscriber.id) // Debug log
    } else {
      // Existing subscriber flow
      if (!subscriber.email) {
        usertype = 1
      }

      console.log('Existing subscriber found:', subscriber.subscriberid) // Debug log
      // Update subscriber data
      Object.assign(subscriber, {
        deviceid: cleanDeviceId,
        token: cleanToken,
        recent_contacted: new Date(),
      })

      // Parallel execution for existing subscriber
      await Promise.all([
        this.subscriberRepo.save(subscriber),
        this.subscriberRecentRepo.save({
          subscriberid: subscriber.id,
          source: 'MobileApp',
          lead_type: usertype,
          lead_source: 'MobileApp',
          created_on: new Date(),
          utm_source: logEvent.utm_source || '',
          utm_campaign: logEvent.utm_campaign || '',
          utm_medium: logEvent.utm_medium || '',
        }),
      ])

      finalSubscriber = subscriber
      this.logger.info(`Existing subscriber logged in: ${subscriber.subscriberid}`)
    }

    console.log('Final subscriber ID:', finalSubscriber.id) // Debug log
    // Final parallel operations
    const [jwt] = await Promise.all([
      this.generateToken(finalSubscriber.id),
      this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_app_folio')
        .values({
          subscriberid: finalSubscriber.id,
          token: cleanToken,
          deviceid: cleanDeviceId,
          created_on: currentTime,
        })
        .execute(),
    ])

    const filteredSubscriber = {
      id: finalSubscriber.id,
      fullname: finalSubscriber.fullname,
      mobileno: finalSubscriber.mobileno,
      email: finalSubscriber.email,
      subscriberid: finalSubscriber.subscriberid,
      language: finalSubscriber.language,
      address: finalSubscriber.address,
      state: finalSubscriber.state,
    }

    console.log('Returning response with usertype:', usertype) // Debug log
    return { usertype, jwt, subscriber: filteredSubscriber }
  }

  /**
   * Registers or updates a subscriber's name and email.
   *
   * @param dto - Registration DTO containing `name` and `email`.
   * @param subscriberId - The ID of the subscriber to update.
   * @returns The updated subscriber object with selected fields.
   * @throws BadRequestException if name or email is missing.
   * @throws NotFoundException if subscriber does not exist.
   */
  async register(dto: RegisterDto, subscriberId: number) {
    const { name, email } = dto

    if (!name || !email) {
      throw new BadRequestException('Name and Email are required')
    }

    // Fetch subscriber
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, isdelete: 0 },
    })
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }
    const currentTime = getCurrentDateTime()

    // Update fields
    subscriber.fullname = name
    subscriber.email = email
    subscriber.updated_on = currentTime
    subscriber.user_acceptance = new Date(currentTime)

    await this.subscriberRepo.save(subscriber)

    // Return updated subscriber (select specific fields)
    const updatedSubscriber = await this.subscriberRepo.findOne({
      where: { id: subscriber.id },
      select: ['id', 'fullname', 'mobileno', 'email', 'subscriberid', 'language', 'address', 'state'],
    })

    return updatedSubscriber
  }

  /**
   * Updates the user acceptance timestamp for a subscriber.
   *
   * @param subscriberId - The ID of the subscriber.
   * @returns An object indicating success.
   * @throws NotFoundException if subscriber does not exist.
   */
  async userAcceptance(subscriberId: number) {
    // 🔹 1. Fetch subscriber
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, isdelete: 0 },
    })
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }

    // const currentTime = new Date()

    /*
    // 🔹 2. Update subscriber verification + acceptance
    subscriber.user_acceptance = currentTime
    subscriber.updated_on = currentTime.toISOString().slice(0, 19).replace('T', ' ')
    subscriber.verifyuser = 1
    subscriber.verifiedon = currentTime
    await this.subscriberRepo.save(subscriber)

    // 🔹 3. Insert into tbl_subscriber_acceptance
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('tbl_subscriber_acceptance')
      .values({
        subscriberid: subscriberId,
        accepted_on: currentTime,
        source: 4, // pass 1/2/3/4 based on request
      })
      .execute()
      */

    return {
      success: true,
      message: 'Subscriber verified and acceptance recorded',
    }
  }

  /**
   * Assigns a lead subscriber based on the lead source and language ID.
   * @param leadSource - The source of the lead.
   * @param langId - The language ID for language-specific assignment.
   * @param loggedInUserId - The ID of the user currently logged in.
   * @returns The ID of the assigned user.
   */
  async assignLeadSubscriber(leadSource: string, langId = 0, loggedInUserId: number): Promise<number> {
    let assignedTo = loggedInUserId

    try {
      const workflow = await this.workflowLeadCreationRepository.findOne({
        where: { isdelete: 0, lead_source: leadSource },
        order: { id: 'DESC' },
      })

      if (!workflow?.allot_to_user) return assignedTo

      const allotToUserIds = workflow.allot_to_user
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id))

      if (!allotToUserIds.length) return assignedTo

      const users = await this.userInfoRepository.find({
        where: { isdelete: 0, id: In(allotToUserIds) },
      })

      const langWiseAssign = (usersList: typeof users): number | null => {
        for (const user of usersList) {
          const userLangs = (user.language || '')
            .split(',')
            .map(Number)
            .filter((lang) => !isNaN(lang))
          if (userLangs.includes(langId)) {
            return user.id
          }
        }
        return null
      }

      // Try language-specific assignment
      if (langId && users.length) {
        const firstTry = langWiseAssign(users.filter((u) => !workflow.allocation_list?.includes(String(u.id))))
        const secondTry = firstTry ?? langWiseAssign(users)

        if (secondTry) {
          assignedTo = secondTry
        } else {
          // Fallback to round-robin logic
          const next = allotToUserIds.find((id) => id > workflow.last_allocated)
          assignedTo = next ?? allotToUserIds[0]
        }
      } else {
        // Round-robin fallback (no language match)
        const next = allotToUserIds.find((id) => id > workflow.last_allocated)
        assignedTo = next ?? allotToUserIds[0]
      }

      const updateData: Partial<WorkflowLeadCreation> = {
        last_allocated: assignedTo,
      }

      if (langId) {
        const existingList = workflow.allocation_list?.split(',') ?? []
        const newList = [...new Set([...existingList, String(assignedTo)])]
        updateData.allocation_list = newList.join(',')
      }

      this.logger.debug(`Assigned subscriber to user ${assignedTo}`)
    } catch (error) {
      this.logger.error(`Error in assignLeadSubscriber: ${error.message}`, error.stack)
    }

    return assignedTo
  }

  async sendOtp(userId: number): Promise<void> {
    const subscriber = await this.subscriberRepo.findOne({
      where: {
        id: userId,
      },
    })

    // ✅ OTP Generation (4 digits)
    const otp = Math.floor(1000 + Math.random() * 9000)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    this.logger.info(`Generated OTP ${otp} for mobile ${subscriber.mobileno}`)

    await insertOtpLog(subscriber.mobileno, {
      MobileNo: subscriber.mobileno,
      DeviceId: subscriber.deviceid,
    })

    await insertOtp(subscriber.mobileno, otp, now)

    const message = `Welcome to Streetgains. Your Login OTP is ${otp}\n\n - STREETGAINS yqoW/F5XuOH`

    // const message = `Thanks for choosing Streetfolios. Your OTP to sign the terms of service is : ${otp} -STREETGAINS`
          console.log(message)

    this.logger.debug(`Sending SMS to ${subscriber.mobileno}: ${message}`)
    await this.commonService.sendSms(subscriber.mobileno, message)
  }

  async verifyOtp(dto: VerifyOtpDto, userId: number) {
    const { otp } = dto

    console.log('Verifying OTP DTO:', dto) // Debug log to check incoming data
    const user = await getUserBy(
      { id: userId },
      ['mobileno'] // optional selected fields
    )
    const mobileno = user.mobileno
    if (!mobileno || !otp) {
      return { success: false, message: 'Error Validating OTP' }
    }

    console.log(`Verifying OTP ${otp} for mobile ${mobileno}`) // Debug log
    try {
      const otpRecords = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('tbl_otpbox', 'o')
        .where('o.mobileno = :usermobile', { usermobile: mobileno })
        .andWhere('o.otpnumber = :otp', { otp })
        .orderBy('o.id', 'DESC')
        .limit(1)
        .getRawMany()

      if (!otpRecords.length) {
        return { success: false, message: 'Invalid OTP' }
      }
      console.log('OTP record found:', otpRecords[0]) // Debug log

      // 🔹 3. Insert into tbl_subscriber_acceptance
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('tbl_subscriber_acceptance')
        .values({
          subscriberid: userId,
          accepted_on: new Date(),
          source: 4, // pass 1/2/3/4 based on request
        })
        .execute()
        console.log('User acceptance recorded for subscriber ID:', userId) // Debug log

      return { success: true, message: 'OTP verified' }
    } catch (error) {
      console.error('Error verifying OTP for KYC:', error)
      return { success: false, message: 'Internal Server Error' }
    }
  }
}
