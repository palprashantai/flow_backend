import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Configuration } from './common.entity'
import axios from 'axios'

@Injectable()
export class CommonService {
  constructor(
    @InjectRepository(Configuration)
    private configurationRepository: Repository<Configuration>
  ) {} // Inject

  /**
   * Sends an SMS message to a specified phone number using Kaleyra API.
   * Formats Indian phone numbers, cleans the message text,
   * fetches SMS configuration from the database, and handles errors.
   *
   * @param sendto - The recipient phone number (10 or 11 digits).
   * @param message - The SMS content to be sent.
   * @returns void
   */
  async sendSms(sendto: string, message: string): Promise<void> {
    try {
      // Format phone number
      if (sendto && sendto.length === 10) {
        sendto = '+91' + sendto
      } else if (sendto && sendto.length === 11) {
        sendto = sendto.replace('+', '+91')
      }

      // Basic string repair
      message = message.replace(/&#39;/g, "'")

      // Fetch SMS config from DB using repository
      const config = await this.configurationRepository.findOne({ where: { id: 1 } })
      if (!config) throw new Error('SMS configuration not found')

      // Kaleyra API request
      const url = 'https://api.kaleyra.io/v1/HXIN1748206109IN/messages'
      const payload = new URLSearchParams({
        to: sendto,
        sender: config.sms_sender,
        type: 'TXN',
        body: message,
        source: 'API',
      })

      await axios.post(url, payload.toString(), {
        headers: {
          'api-key': config.sms_apikey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      console.log('SMS sent')
    } catch (error: any) {
      console.error('SMS sending failed:', error?.message)
    }
  }
}
