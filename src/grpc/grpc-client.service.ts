// src/grpc/grpc-client.service.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface WorkflowServiceClient {
  checkSubscriberWorkflow(data: { 
    subscriberId: number; 
    eventType: string 
  }): Observable<{ success: boolean; message: string }>;
  
  checkLeadWorkflow(data: { 
    id: number 
  }): Observable<{ success: boolean; message: string }>;
  
  checkOrderWorkflow(data: { 
    id: number; 
    operation: string 
  }): Observable<{ success: boolean; message: string }>;
  
  checkSubscriptionWorkflow(data: { 
    id: number; 
    operation: string 
  }): Observable<{ success: boolean; message: string }>;
}

@Injectable()
export class GrpcClientService implements OnModuleInit {
  private workflowService: WorkflowServiceClient;

  constructor(@Inject('WORKFLOW_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.workflowService = this.client.getService<WorkflowServiceClient>('WorkflowService');
  }

  async checkSubscriberWorkflow(subscriberId: number, eventType: 'insert' | 'update') {
    try {
      return await this.workflowService
        .checkSubscriberWorkflow({ subscriberId, eventType })
        .toPromise();
    } catch (error) {
      console.error('gRPC Client Error in checkSubscriberWorkflow:', error);
      throw error;
    }
  }

  async checkLeadWorkflow(id: number) {
    try {
      return await this.workflowService
        .checkLeadWorkflow({ id })
        .toPromise();
    } catch (error) {
      console.error('gRPC Client Error in checkLeadWorkflow:', error);
      throw error;
    }
  }

  async checkOrderWorkflow(id: number, operation: 'Add' | 'Edit') {
    try {
      return await this.workflowService
        .checkOrderWorkflow({ id, operation })
        .toPromise();
    } catch (error) {
      console.error('gRPC Client Error in checkOrderWorkflow:', error);
      throw error;
    }
  }

  async checkSubscriptionWorkflow(id: number, operation: 'Add' | 'Edit') {
    try {
      return await this.workflowService
        .checkSubscriptionWorkflow({ id, operation })
        .toPromise();
    } catch (error) {
      console.error('gRPC Client Error in checkSubscriptionWorkflow:', error);
      throw error;
    }
  }
}