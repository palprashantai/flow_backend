import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

export type WorkflowType =
  | 'subscription'
  | 'subscription_insert'
  | 'subscriber'
  | 'subscriber_insert'
  | 'lead_creation'
  | 'order_insert'
  | 'order_update'

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generic workflow caller
   */
  async callWorkflow(
    workflowType: WorkflowType,
    id: number,
    productApp: 0 | 1 = 0,
    additionalData?: Record<string, any>,
  ): Promise<any> {
    try {
      const baseUrl = this.getWorkflowUrl(workflowType)
      const url = `${baseUrl}${id}/${productApp}`

      this.logger.log(`Calling ${workflowType} workflow: ${url}`)

      const payload = {
        workflowType,
        id,
        productApp,
        timestamp: new Date().toISOString(),
        ...additionalData,
      }

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }),
      )

      this.logger.log(`${workflowType} workflow completed successfully`)
      return response.data
    } catch (error) {
      this.logger.error(`${workflowType} workflow failed: ${error.message}`)
      throw new Error(`${workflowType} workflow failed: ${error.message}`)
    }
  }

  /** ================== Wrapper methods ================== */

  async callSubscriberWorkflow(subscriberId: number, productApp: 0 | 1 = 0) {
    return this.callWorkflow('subscriber', subscriberId, productApp, { action: 'update' })
  }

  async callSubscriberInsertWorkflow(subscriberId: number, productApp: 0 | 1 = 0) {
    return this.callWorkflow('subscriber_insert', subscriberId, productApp, { action: 'insert' })
  }

  async callSubscriptionWorkflow(
    subscriptionId: number,
    actionOrProductApp?: string | 0 | 1,
    actionIfProductApp?: string,
  ): Promise<any> {
    let productApp: 0 | 1 = 0
    let action: string = 'update'

    if (typeof actionOrProductApp === 'number') {
      productApp = actionOrProductApp
      if (actionIfProductApp) action = actionIfProductApp
    } else if (typeof actionOrProductApp === 'string') {
      action = actionOrProductApp
    }

    return this.callWorkflow('subscription', subscriptionId, productApp, { action })
  }

  async assignLeadSubscriber(
    lead_source: string = '',
    langId: number = 0,
    product_app: number = 0,
  ) {
    // Base URL from env
    const baseUrl =
      this.configService.get<string>('WORKFLOW_URL_ASSGINTO') ||
      'http://localhost/newstreet/app/StreetApi/workflowSubscriberAssignTo/2Bcdeweikd'

    // Construct full URL with path params
    const url = `${baseUrl}/${lead_source}/${langId}/${product_app}`

    // GET or POST depending on API design
    const response = await firstValueFrom(this.httpService.get(url))

    return response.data
  }

  async callSubscriptionInsertWorkflow(subscriptionId: number, productApp: 0 | 1 = 0) {
    return this.callWorkflow('subscription_insert', subscriptionId, productApp, { action: 'insert' })
  }

  async callLeadCreationWorkflow(leadId: number, productApp: 0 | 1 = 0) {
    return this.callWorkflow('lead_creation', leadId, productApp, { action: 'create_lead' })
  }

  async callOrderInsertWorkflow(orderId: number, productApp: 0 | 1 = 0) {
    return this.callWorkflow('order_insert', orderId, productApp, { action: 'insert' })
  }

  async callOrderUpdateWorkflow(orderId: number, productApp: 0 | 1 = 0) {
    return this.callWorkflow('order_update', orderId, productApp, { action: 'update' })
  }

  /** ================== Retry logic ================== */
  async callWorkflowWithRetry(
    workflowType: WorkflowType,
    id: number,
    productApp: 0 | 1 = 0,
    maxRetries = 3,
    additionalData?: Record<string, any>,
  ): Promise<any> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.callWorkflow(workflowType, id, productApp, {
          ...additionalData,
          attempt,
        })

        if (attempt > 1) {
          this.logger.log(`${workflowType} workflow succeeded on attempt ${attempt}`)
        }

        return result
      } catch (error) {
        lastError = error
        this.logger.warn(
          `${workflowType} workflow attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        )

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          this.logger.log(`Retrying ${workflowType} workflow in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw new Error(
      `${workflowType} workflow failed after ${maxRetries} attempts: ${lastError.message}`,
    )
  }

  /** ================== URL resolver ================== */
  private getWorkflowUrl(workflowType: WorkflowType): string {
    const urlMap: Record<WorkflowType, string> = {
      subscription: 'WORKFLOW_URL',
      subscription_insert: 'WORKFLOW_URL_INSERT',
      subscriber: 'WORKFLOW_URL_SUBSCRIBER',
      subscriber_insert: 'WORKFLOW_URL_SUBSCRIBER_INSERT',
      lead_creation: 'WORKFLOW_URL_LEAD_CREATION',
      order_insert: 'WORKFLOW_URL_ORDERINSERT',
      order_update: 'WORKFLOW_URL_ORDERUPDATE',
    }

    const envKey = urlMap[workflowType]
    let url = this.configService.get<string>(envKey)

    if (!url) {
      throw new Error(`Workflow URL not configured for type: ${workflowType} (${envKey})`)
    }

    if (!url.endsWith('/')) {
      url += '/'
    }

    return url
  }
}
