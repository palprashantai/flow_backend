import { Injectable } from '@nestjs/common';
import { GrpcClientService } from './grpc/grpc-client.service';

@Injectable()
export class AppService {
  constructor(private readonly grpcClientService: GrpcClientService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Call all gRPC workflow methods in one place
   */
  async testAll(params: {
    subscriberId?: number;
    eventType?: 'insert' | 'update';
    id?: number;
    operation?: 'Add' | 'Edit';
  }) {
    const { subscriberId, eventType, id, operation } = params;
    const results: any = {};

    try {
      if (subscriberId && eventType) {
        results.subscriberWorkflow = await this.grpcClientService.checkSubscriberWorkflow(
          subscriberId,
          eventType
        );
      }

      if (id) {
        results.leadWorkflow = await this.grpcClientService.checkLeadWorkflow(id);
        results.orderWorkflow = await this.grpcClientService.checkOrderWorkflow(
          id,
          operation || 'Add'
        );
        results.subscriptionWorkflow = await this.grpcClientService.checkSubscriptionWorkflow(
          id,
          operation || 'Add'
        );
      }

      return results;
    } catch (error) {
      console.error('gRPC testAll Error:', error);
      return { error: error.message || 'Unknown error' };
    }
  }
}
