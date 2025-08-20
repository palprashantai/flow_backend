import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('tbl_configuration')
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  firebase_key: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  sms_sender: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  sms_apikey: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  smtp_host: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  smtp_username: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  smtp_password: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  smtp_print_username: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  smtp_print_password: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  smtp_secure: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  smtp_port: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  emailfrom: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  mailer_name: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  p_company: string

  @Column({ type: 'varchar', length: 1000, nullable: true })
  p_address: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  p_email: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  p_phone: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  p_gstin: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  p_subject: string

  @Column({ type: 'text', nullable: true })
  p_message: string

  @Column({ type: 'text', nullable: true })
  p_notes: string

  @Column({ type: 'text', nullable: true })
  p_tnc: string

  @Column({ type: 'int', default: 0 })
  streetstock_price: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  inv_month_ending: string

  @Column({ type: 'varchar', length: 255 })
  call_account_sid: string

  @Column({ type: 'text' })
  call_api_key: string

  @Column({ type: 'text' })
  call_api_token: string

  @Column({ type: 'text' })
  call_subdomain: string

  @Column({ type: 'varchar', length: 15 })
  call_callerid: string

  @Column({ type: 'varchar', length: 15, nullable: true })
  call_default_number: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  wp_api_url: string

  @Column({ type: 'text', nullable: true })
  wp_api_key: string

  @Column({ type: 'varchar', length: 15, nullable: true })
  wp_default_number: string

  @Column({ type: 'datetime', nullable: true })
  subscription_amt_count_date: Date

  @Column({ type: 'int', default: 0 })
  google_sheet_start_from: number

  @Column({ type: 'int', default: 0 })
  google_looker_start_from: number

  @Column({ type: 'text' })
  lead_source: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  razorpay_key: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  razorpay_secret: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  cinno: string
}
