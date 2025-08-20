import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { JwtPayload } from './auth.interface'
import { ConfigService } from '@nestjs/config'
import { getNextSubscriberID } from './auth.repository'
import { getCurrentDateTime, sanitize, sanitizeMobile } from 'helper'
import { InjectRepository } from '@nestjs/typeorm'
import { LogEntity, OtpBoxEntity, Subscriber, SubscriberRecent, UserInfo, WorkflowLeadCreation } from './auth.entity'
import { In, Not, Repository } from 'typeorm'
import { RegisterDto } from './auth.dto'
import { CommonService } from 'modules/common/common.service'

@Injectable()
export class AuthService {
  logger: Logger
  constructor(
    private readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    private readonly commonService: CommonService,
    @InjectRepository(LogEntity)
    private readonly logRepo: Repository<LogEntity>,
    @InjectRepository(OtpBoxEntity)
    private readonly otpRepo: Repository<OtpBoxEntity>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(SubscriberRecent)
    private readonly subscriberRecentRepo: Repository<SubscriberRecent>,
    @InjectRepository(WorkflowLeadCreation)
    private readonly workflowLeadCreationRepository: Repository<WorkflowLeadCreation>,
    @InjectRepository(UserInfo)
    private readonly userInfoRepository: Repository<UserInfo>
  ) {}

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
      throw new BadRequestException('Mobile number is required')
    }

    if (!sanitizedMobile || sanitizedMobile.length !== 10) {
      throw new BadRequestException('Invalid mobile number format')
    }

    // Bypass check for test number
    if (sanitizedMobile !== '9999999999') {
      // ✅ Device ID validation
      if (cleanDeviceId) {
        const deviceCheck = await this.subscriberRepo.findOne({
          where: {
            deviceid: cleanDeviceId,
            isdelete: 0,
            mobileno: Not(sanitizedMobile), // ensures mobile is NOT equal
          },
        })
        if (deviceCheck) {
          throw new ConflictException('This device is already registered with another number. Please login with that number')
        }
      }

      // ✅ OTP Generation (4 digits)
      const otp = Math.floor(1000 + Math.random() * 9000)
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

      // Insert logs & OTP
      await this.logRepo.save(
        this.logRepo.create({ mobileno: sanitizedMobile, message: JSON.stringify({ MobileNo: mobileNo, DeviceId: cleanDeviceId }) })
      )

      // Save OTP
      await this.otpRepo.save(this.otpRepo.create({ mobileno: sanitizedMobile, otpnumber: otp.toString(), created_on: now }))

      // ✅ Send SMS
      const message = `Welcome to Streetgains. Your Login OTP is ${otp}\n\n - STREETGAINS yqoW/F5XuOH`
      console.log(message)
      await this.commonService.sendSms(sanitizedMobile, message)
    }
  }

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
      throw new BadRequestException('Mobile number and OTP are required')
    }

    // ✅ Check OTP validity
    console.log(cleanOtp, sanitizedMobile)
    const otpResult = await this.otpRepo.findOne({
      where: { mobileno: sanitizedMobile },
      order: { id: 'DESC' },
    })

    console.log(otpResult.otpnumber, cleanOtp)

    if (!otpResult || otpResult.otpnumber !== cleanOtp) {
      throw new UnauthorizedException('Invalid OTP')
    }

    // ✅ Check if subscriber exists
    let subscriber = await this.subscriberRepo.findOne({
      where: { mobileno: sanitizedMobile },
    })

    let subscriberid: string
    let usertype = 0

    if (!subscriber) {
      subscriberid = await getNextSubscriberID()
      const assignedto = await this.assignLeadSubscriber('MobileApp', 0, 0)

      subscriber = this.subscriberRepo.create({
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
      })

      await this.subscriberRepo.save(subscriber)

      await Promise.all([
        // this.commonService.checkWorkFlowLeadCreation(subscriberid),
        // this.commonService.checkWorkflowSubscriberWorkflow(subscriberid, 'insert'),
      ])

      usertype = 1
    } else {
      // 👉 Existing Subscriber
      const id = subscriber.id

      if (!subscriber.email) {
        usertype = 1 // special case
      }

      // Update subscriber activity and device token
      subscriber.deviceid = cleanDeviceId
      subscriber.token = cleanToken
      subscriber.recent_contacted = new Date()

      await this.subscriberRepo.save(subscriber)
      await this.subscriberRecentRepo.save({
        subscriberid: id,
        source: 'MobileApp',
        lead_type: usertype, // 0 = old, 1 = new
        lead_source: 'MobileApp',
        created_on: new Date(),
      })
    }

    const filteredSubscriber = {
      id: subscriber.id,
      fullname: subscriber.fullname,
      mobileno: subscriber.mobileno,
      email: subscriber.email,
      subscriberid: subscriber.subscriberid,
      language: subscriber.language,
      address: subscriber.address,
      state: subscriber.state,
    }
    const jwt = await this.generateToken(subscriber.id)
    return { usertype, jwt, subscriber: filteredSubscriber }
  }

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

  async userAcceptance(subscriberId: number) {
    // Fetch subscriber
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId, isdelete: 0 },
    })
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }
    const currentTime = getCurrentDateTime()

    // Update user acceptance timestamp
    subscriber.user_acceptance = new Date(currentTime)
    subscriber.updated_on = currentTime

    await this.subscriberRepo.save(subscriber)

    return {
      success: true,
      message: 'success',
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

      await this.workflowLeadCreationRepository.update(workflow.id, updateData)
    } catch (error) {
      this.logger.error(`Error in assignLeadSubscriber: ${error.message}`, error.stack)
    }

    return assignedTo
  }
}
