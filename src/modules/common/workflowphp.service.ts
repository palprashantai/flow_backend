// Comprehensive Workflow Service for all your workflow URLs
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export type WorkflowType = 
  | 'subscription' 
  | 'subscription_insert' 
  | 'subscriber' 
  | 'subscriber_insert' 
  | 'lead_creation';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generic workflow caller that handles all your workflow types
   */
  async callWorkflow(
    workflowType: WorkflowType, 
    id: number, 
    additionalData?: Record<string, any>
  ): Promise<any> {
    try {
      const baseUrl = this.getWorkflowUrl(workflowType);
      const url = `${baseUrl}${id}`;
      
      this.logger.log(`Calling ${workflowType} workflow: ${url}`);
      
      const payload = {
        workflowType,
        id,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
      );
      
      this.logger.log(`${workflowType} workflow completed successfully`);
      return response.data;
      
    } catch (error) {
      this.logger.error(`${workflowType} workflow failed:`, error.message);
      throw new Error(`${workflowType} workflow failed: ${error.message}`);
    }
  }

  /**
   * Specific methods for each workflow type
   */
  
  // Replace: await this.commonService.checkWorkflowSubscriberWorkflow(subscriber.id, 'update')
  async callSubscriberWorkflow(subscriberId: number, action?: string): Promise<any> {
    return this.callWorkflow('subscriber', subscriberId, { action: action || 'update' });
  }

  // For subscriber inserts
  async callSubscriberInsertWorkflow(subscriberId: number): Promise<any> {
    return this.callWorkflow('subscriber_insert', subscriberId, { action: 'insert' });
  }

  // For subscription workflows
  async callSubscriptionWorkflow(subscriptionId: number, action?: string): Promise<any> {
    return this.callWorkflow('subscription', subscriptionId, { action: action || 'update' });
  }

  // For subscription inserts
  async callSubscriptionInsertWorkflow(subscriptionId: number): Promise<any> {
    return this.callWorkflow('subscription_insert', subscriptionId, { action: 'insert' });
  }

  // For lead creation
  async callLeadCreationWorkflow(leadId: number): Promise<any> {
    return this.callWorkflow('lead_creation', leadId, { action: 'create_lead' });
  }

  /**
   * Get the appropriate URL based on workflow type
   */
  private getWorkflowUrl(workflowType: WorkflowType): string {
    const urlMap = {
      'subscription': 'WORKFLOW_URL',
      'subscription_insert': 'WORKFLOW_URL_INSERT', 
      'subscriber': 'WORKFLOW_URL_SUBSCRIBER',
      'subscriber_insert': 'WORKFLOW_URL_SUBSCRIBER_INSERT',
      'lead_creation': 'WORKFLOW_URL_LEAD_CREATION'
    };

    const envKey = urlMap[workflowType];
    const url = this.configService.get<string>(envKey);
    
    if (!url) {
      throw new Error(`Workflow URL not configured for type: ${workflowType} (${envKey})`);
    }
    
    return url;
  }

  /**
   * Batch workflow calls (if you need to call multiple workflows)
   */
  async callMultipleWorkflows(calls: Array<{
    type: WorkflowType;
    id: number;
    data?: Record<string, any>;
  }>): Promise<any[]> {
    const promises = calls.map(call => 
      this.callWorkflow(call.type, call.id, call.data)
        .catch(error => ({ error: error.message, type: call.type, id: call.id }))
    );
    
    return Promise.all(promises);
  }

  /**
   * With retry logic for critical workflows
   */
  async callWorkflowWithRetry(
    workflowType: WorkflowType,
    id: number,
    maxRetries = 3,
    additionalData?: Record<string, any>
  ): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.callWorkflow(workflowType, id, {
          ...additionalData,
          attempt
        });
        
        if (attempt > 1) {
          this.logger.log(`${workflowType} workflow succeeded on attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`${workflowType} workflow attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          this.logger.log(`Retrying ${workflowType} workflow in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${workflowType} workflow failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}

// Usage Examples:

// Replace your current line:
// await this.commonService.checkWorkflowSubscriberWorkflow(subscriber.id, 'update')

// With one of these:
// await this.workflowService.callSubscriberWorkflow(subscriber.id, 'update');

// // Or for other workflows:
// await this.workflowService.callSubscriberInsertWorkflow(subscriber.id);
// await this.workflowService.callSubscriptionWorkflow(subscription.id);
// await this.workflowService.callSubscriptionInsertWorkflow(subscription.id);
// await this.workflowService.callLeadCreationWorkflow(lead.id);

// // For critical workflows with retry:
// await this.workflowService.callWorkflowWithRetry('subscriber_insert', subscriber.id, 3);

// // For multiple workflows at once:
// await this.workflowService.callMultipleWorkflows([
//   { type: 'subscriber_insert', id: subscriber.id },
//   { type: 'lead_creation', id: lead.id }
// ]);

// // Generic call with custom data:
// await this.workflowService.callWorkflow('subscriber', subscriber.id, {
//   action: 'custom_action',
//   metadata: { source: 'api', version: '1.0' }
// });