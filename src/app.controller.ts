import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Single API to test all gRPC workflows
   * Example: 
   * GET /test-workflow?subscriberId=1&eventType=insert&id=10&operation=Add
   */
  @Get('test-workflow')
  async testWorkflow(
    @Query('subscriberId') subscriberId?: string,
    @Query('eventType') eventType?: 'insert' | 'update',
    @Query('id') id?: string,
    @Query('operation') operation?: 'Add' | 'Edit'
  ) {
    return this.appService.testAll({
      subscriberId: subscriberId ? Number(subscriberId) : undefined,
      eventType,
      id: id ? Number(id) : undefined,
      operation,
    });
  }
}
