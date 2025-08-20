import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('tbl_subscriber')
export class Subscriber {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  subscriberid: string

  @Column({ type: 'varchar', length: 50, default: 'Street User' })
  fullname: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string

  @Column({ type: 'varchar', length: 15, nullable: true })
  mobileno: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  otherphone: string

  @Column({ type: 'text', nullable: true })
  imgurl: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  state: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  bill_to: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  gstno: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  language: string

  @Column({ type: 'text', nullable: true })
  address: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  occupation: string

  @Column({ type: 'text', nullable: true })
  token: string

  @Column({ type: 'text', nullable: true })
  deviceid: string

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Initial Investment Capital' })
  iic: string

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Experience In Market' })
  exp_in_market: string

  @Column({ type: 'varchar', length: 10, nullable: true, comment: 'Past Advisory Experience' })
  past_exp: string

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Investment Capital' })
  inv_capital: string

  @Column({ type: 'varchar', length: 15, nullable: true, comment: 'Risk Levels' })
  risk_level: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  demat_brokers: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  interested_segments: string

  @Column({ type: 'varchar', length: 20 })
  lead_source: string

  @Column({ type: 'varchar', length: 30, default: 'Open' })
  lead_response: string

  @Column({ type: 'varchar', length: 20, default: 'New' })
  lead_status: string

  @Column({ type: 'varchar', length: 30, default: 'In Progress' })
  client_status: string

  @Column({ type: 'varchar', length: 15, nullable: true })
  subscriber_status: string

  @Column({ type: 'varchar', length: 50, default: 'Not subscribed' })
  subscribed: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  reason_not_interested: string

  @Column({ type: 'date', nullable: true })
  next_followup: Date

  @Column({ type: 'varchar', length: 20, nullable: true })
  price_expected: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  reminder_way: string

  @Column({ type: 'datetime', nullable: true })
  reminder_time: Date

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Lead Comments' })
  comment: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  notes: string

  @Column({ type: 'int', default: 0 })
  assignedto: number

  @Column({ type: 'int', default: 0 })
  sales_manager: number

  @Column({ type: 'tinyint', default: 1 })
  notifystatus: number

  @Column({ type: 'tinyint', default: 0 })
  verifyuser: number

  @Column({ type: 'tinyint', default: 0, comment: '0 - Not Sent / 1 - Sent' })
  verified_email: number

  @Column({ type: 'datetime', nullable: true })
  verified_email_on: Date

  @Column({ type: 'datetime', nullable: true })
  verifiedon: Date

  @Column({ type: 'tinyint', default: 0, comment: '0=Not Verified,1=Verified' })
  verifykyc: number

  @Column({ type: 'datetime', nullable: true })
  verifykycon: Date

  @Column({ type: 'int', default: 0 })
  kyc_verifiedby: number

  @Column({ type: 'longtext', nullable: true })
  verify_details: string

  @Column({ type: 'tinyint', default: 0 })
  freeuser: number

  @Column({ type: 'tinyint' })
  activate: number

  @Column({ type: 'varchar', length: 20, default: 'New' })
  status: string

  @Column({ type: 'tinyint', default: 0 })
  relation_call: number

  @Column({ type: 'tinyint', default: 0 })
  telegram_call: number

  @Column({ type: 'int', default: 0 })
  isdelete: number

  @Column({ type: 'int', default: 0 })
  updated_by: number

  @Column({ type: 'varchar', length: 30, nullable: true })
  updated_on: string

  @Column({ type: 'int', default: 0 })
  created_by: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date

  @Column({ type: 'date', nullable: true })
  subscribed_on: Date

  @Column({ type: 'int', default: 0 })
  subscribed_days: number

  @Column({ type: 'datetime', nullable: true })
  installed_on: Date

  @Column({ type: 'varchar', length: 255 })
  password: string

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date

  @Column({ type: 'varchar', length: 100, nullable: true })
  remember_token: string

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date

  @Column({ type: 'datetime', nullable: true })
  recent_contacted: Date

  @Column({ type: 'varchar', length: 15, nullable: true })
  referralcode: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  subscription_amount: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_time: string

  @Column({ type: 'datetime', nullable: true })
  active_date: Date

  @Column({ type: 'datetime', nullable: true })
  inactive_date: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  active_days: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  invited_by: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  utm_source: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  utm_medium: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  utm_campaign: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  utm_content: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  utm_term: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  clickid: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  investments: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  convertible: string

  @Column({ type: 'datetime', nullable: true })
  deletedOn: Date

  @Column({ type: 'tinyint', default: 1 })
  n_trade: number

  @Column({ type: 'tinyint', default: 1 })
  n_rebalance: number

  @Column({ type: 'tinyint', default: 1 })
  n_streetview: number

  @Column({ type: 'tinyint', default: 1 })
  n_reminders: number

  @Column({ type: 'datetime', nullable: true })
  user_acceptance: Date
}

@Entity('tbl_log3')
export class LogEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceid: string

  @Column({ type: 'int', default: 0 })
  screenid: number

  @CreateDateColumn({ type: 'timestamp', name: 'cdtime' })
  cdtime: Date

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileno: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  message: string
}

@Entity('tbl_otpbox')
export class OtpBoxEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 15, nullable: true })
  mobileno: string

  @Column({ type: 'varchar', length: 6, nullable: true })
  otpnumber: string

  @Column({ type: 'datetime', nullable: true })
  created_on: Date

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isuser: number
}

@Entity('tbl_userinfo')
export class UserInfo {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  managerid?: string

  @Column({ nullable: true })
  teammanagerid?: string

  @Column({ length: 45, charset: 'utf8', collation: 'utf8_general_ci', nullable: true })
  ip_address?: string

  @Column({ default: 0 })
  en_num: number

  @Column({ nullable: true })
  user_name?: string

  @Column({ nullable: true })
  user_password?: string

  @Column({ nullable: true })
  user_fullname?: string

  @Column({ nullable: true })
  user_code?: string

  @Column({ nullable: true })
  user_mob?: string

  @Column({ nullable: true })
  user_mob2?: string

  @Column({ nullable: true })
  user_whatsapp?: string

  @Column({ nullable: true })
  user_email?: string

  @Column({ nullable: true })
  office_email?: string

  @Column({ type: 'date', nullable: true })
  user_dob?: Date | null

  @Column({ nullable: true })
  user_pan?: string

  @Column({ nullable: true })
  user_aadhar?: string

  @Column({ nullable: true })
  user_address?: string

  @Column({ nullable: true })
  user_designation?: string

  @Column()
  user_branch: string

  @Column()
  user_branch_id: number

  @Column()
  user_department: string

  @Column()
  user_department_id: number

  @Column()
  user_designation_id: number

  @Column({ nullable: true })
  user_image?: string

  @Column({ nullable: true })
  uan_number?: string

  @Column({ nullable: true })
  user_aadhar_image?: string

  @Column({ nullable: true })
  user_pan_image?: string

  @Column({ nullable: true })
  bank_name?: string

  @Column({ nullable: true })
  bank_ifsc?: string

  @Column({ nullable: true })
  bank_account?: string

  @Column({ nullable: true })
  name_in_bank?: string

  @Column({ nullable: true })
  esinumber?: string

  @Column({ nullable: true })
  esi_image?: string

  @Column({ default: 3, comment: '1 - Superadmin / 2 - Manager / 3 - Executive' })
  user_type: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  basic_pay: number

  @Column({ type: 'date', nullable: true })
  join_date?: Date | null

  @Column({ type: 'date', nullable: true })
  left_date?: Date | null

  @Column({ type: 'date', nullable: true })
  suspension_date?: Date | null

  @Column({ default: 0 })
  salary: number

  @Column({ default: 0 })
  incentives: number

  @Column({ type: 'enum', enum: ['0', '1'], default: '0', comment: '0:Percentage,1:Slab' })
  incentives_type: '0' | '1'

  @Column({ default: 0 })
  monthly_target: number

  @Column({ type: 'text', nullable: true })
  offer_letter?: string

  @Column({ type: 'text', nullable: true })
  appointment_letter?: string

  @Column({ nullable: true })
  employmentstatus?: string

  @Column({ nullable: true })
  employmenttype?: string

  @Column({ default: 0, comment: '1 - Unblock / 0 - Block' })
  user_blocked: number

  @Column({ nullable: true })
  user_last_login?: string

  @Column({ nullable: true })
  user_session?: string

  @Column({ charset: 'utf8', collation: 'utf8_general_ci', nullable: true })
  salt?: string

  @Column({ charset: 'utf8', collation: 'utf8_general_ci', nullable: true })
  activation_code?: string

  @Column({ charset: 'utf8', collation: 'utf8_general_ci', nullable: true })
  forgotten_password_code?: string

  @Column({ unsigned: true, nullable: true })
  forgotten_password_time?: number

  @Column({ charset: 'utf8', collation: 'utf8_general_ci', nullable: true })
  remember_code?: string

  @Column({ type: 'datetime', nullable: true })
  last_login?: Date

  @Column({ type: 'tinyint', default: 0 })
  iscompleted: boolean

  @Column({ type: 'longtext', nullable: true })
  user_role_details?: string

  @Column({ type: 'enum', enum: ['0', '1'], default: '0' })
  password_updated: '0' | '1'

  @Column({ type: 'datetime', nullable: true })
  last_password_updated_date?: Date | null

  @Column({ type: 'int', default: 0 })
  isdelete: number

  @Column({ default: 0 })
  created_by: number

  @Column({ default: 0 })
  updated_by: number

  @Column({ nullable: true })
  updated_on?: string

  @CreateDateColumn({ type: 'timestamp' })
  created_on: Date | null

  @Column({ type: 'text', nullable: true })
  token?: string

  @Column({ default: '1' })
  language: string

  @Column({ type: 'enum', enum: ['1', '2'], default: '1', comment: '1:Employee,2:User' })
  user_category: '1' | '2'

  @Column({ nullable: true })
  mobile_link_adhar?: string

  @Column({ nullable: true })
  sex?: string

  @Column({ nullable: true })
  marital_status?: string

  @Column({ nullable: true })
  father_name?: string

  @Column({ nullable: true })
  joining_interview_by?: string

  @Column({ nullable: true })
  left_interview_by?: string

  @Column({ nullable: true })
  left_reason?: string

  @Column({ nullable: true })
  permanent_address?: string

  @Column({ nullable: true })
  your_name_in_bank?: string

  @Column({ nullable: true })
  nominee_name?: string

  @Column({ type: 'date', nullable: true })
  nominee_dob?: Date | null

  @Column({ nullable: true })
  relationship_with_nominee?: string

  @Column({ nullable: true })
  crm_profile_image?: string
}

@Entity('tbl_workflow_leadcreation')
export class WorkflowLeadCreation {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  workflow_name: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  lead_source: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  allot_to_user: string

  @Column({ type: 'int', default: 0 })
  alert_lead_sms: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  alert_lead_sms_source: string

  @Column({ type: 'int', default: 0 })
  alert_lead_push: number

  @Column({ type: 'int', default: 0 })
  alert_user_push: number

  @Column({ type: 'int', default: 0 })
  alert_lead_email: number

  @Column({ type: 'int', default: 0 })
  alert_user_sms: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  alert_user_sms_source: string

  @Column({ type: 'int', default: 0 })
  alert_lead_whatsapp_push: number

  @Column({ type: 'int', default: 0 })
  alert_user_whatsapp_push: number

  @Column({ type: 'int', default: 0 })
  last_allocated: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  allocation_list: string

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isdelete: number

  @Column({ type: 'int', default: 0 })
  updated_by: number

  @Column({ type: 'datetime', nullable: true })
  updated_on: Date

  @Column({ type: 'int', default: 0 })
  created_by: number

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date
}

@Entity({ name: 'tbl_subscriber_recent' })
export class SubscriberRecent {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'int', default: 0 })
  subscriberid: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  source: string

  @Column({ type: 'tinyint', default: 0, comment: '0 - Old / 1 - New' })
  lead_type: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  lead_source: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  utm_source: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  utm_medium: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  utm_campaign: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  utm_content: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  utm_term: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  clickid: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  adset_name: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  form_name: string

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date
}
