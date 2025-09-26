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

  /** ================= Backward-compatible workflow methods ================= */

  async callSubscriberWorkflow(
    subscriberId: number,
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

    return this.callWorkflow('subscriber', subscriberId, productApp, { action })
  }

  async callSubscriberInsertWorkflow(subscriberId: number, productApp?: 0 | 1): Promise<any> {
    return this.callWorkflow('subscriber_insert', subscriberId, productApp ?? 0, {
      action: 'insert',
    })
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

  async callSubscriptionInsertWorkflow(subscriptionId: number, productApp?: 0 | 1): Promise<any> {
    return this.callWorkflow('subscription_insert', subscriptionId, productApp ?? 0, {
      action: 'insert',
    })
  }

  async callLeadCreationWorkflow(leadId: number, productApp?: 0 | 1): Promise<any> {
    return this.callWorkflow('lead_creation', leadId, productApp ?? 0, { action: 'create_lead' })
  }

  /** ================= Batch workflow calls ================= */
  async callMultipleWorkflows(
    calls: Array<{
      type: WorkflowType
      id: number
      productApp?: 0 | 1
      data?: Record<string, any>
    }>,
  ): Promise<any[]> {
    const promises = calls.map((call) =>
      this.callWorkflow(call.type, call.id, call.productApp ?? 0, call.data).catch((error) => ({
        error: error.message,
        type: call.type,
        id: call.id,
      })),
    )
    return Promise.all(promises)
  }

  /** ================= Retry logic ================= */
  async callWorkflowWithRetry(
    workflowType: WorkflowType,
    id: number,
    productApp?: 0 | 1,
    maxRetries = 3,
    additionalData?: Record<string, any>,
  ): Promise<any> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.callWorkflow(workflowType, id, productApp ?? 0, {
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

  /** ================= Get base URL ================= */
  private getWorkflowUrl(workflowType: WorkflowType): string {
    const urlMap = {
      subscription: 'WORKFLOW_URL',
      subscription_insert: 'WORKFLOW_URL_INSERT',
      subscriber: 'WORKFLOW_URL_SUBSCRIBER',
      subscriber_insert: 'WORKFLOW_URL_SUBSCRIBER_INSERT',
      lead_creation: 'WORKFLOW_URL_LEAD_CREATION',
    }

    const envKey = urlMap[workflowType]
    const url = this.configService.get<string>(envKey)

    if (!url) {
      throw new Error(`Workflow URL not configured for type: ${workflowType} (${envKey})`)
    }

    return url.endsWith('/') ? url : url + '/'
  }
}



// Old call still works
// await workflowService.callSubscriberWorkflow(subscriber.id, 'update');

// Optional productApp
// await workflowService.callSubscriberWorkflow(subscriber.id, 1, 'update');

// // Subscriber insert
// await workflowService.callSubscriberInsertWorkflow(subscriber.id); // productApp defaults to 0
// await workflowService.callSubscriberInsertWorkflow(subscriber.id, 1); // productApp = 1

// // Subscription
// await workflowService.callSubscriptionWorkflow(subscription.id, 'update'); // old call
// await workflowService.callSubscriptionWorkflow(subscription.id, 1, 'update'); // new call

// // Lead creation
// await workflowService.callLeadCreationWorkflow(lead.id); // default productApp = 0

// // Multiple workflows
// await workflowService.callMultipleWorkflows([
//   { type: 'subscriber_insert', id: subscriber.id },
//   { type: 'lead_creation', id: lead.id, productApp: 1 },
// ]);

// // Retry logic
// await workflowService.callWorkflowWithRetry('subscriber_insert', subscriber.id);
