import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { CreateTransactionDto } from './smallcase.dto'
import { SmallcaseService } from './smallcase.service'

@ApiTags('Smallcase')
@Controller('appApi/smallcase')
export class SmallcaseController {
  constructor(private readonly smallcaseService: SmallcaseService) {}

  @Get('order')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch latest Smallcase transaction data' })
  @ApiResponse({
    status: 200,
    description: 'Returns parsed JSON from latest smallcase webhook',
    schema: {
      example: {
        success: true,
        message: 'Latest order retrieved successfully',
        result: {
          order_id: 'abc123',
          status: 'completed',
          amount: 5000,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No transactions found' })
  @ApiResponse({ status: 500, description: 'Failed to load latest transaction' })
  async getLatestTransaction() {
    const result = await this.smallcaseService.getLatestTransactionData()

    return {
      success: true,
      message: 'Latest order retrieved successfully',
      result,
    }
  }

  @Post('transaction')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Smallcase transaction (Razorpay)' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createTransaction(@Body() dto: CreateTransactionDto, @GetUserId('id') userId: number) {
    return this.smallcaseService.createTransaction(dto, userId)
  }

  @Get('fetchtoken')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate JWT token',
    description: 'Returns a JWT token for the given authId or a guest token if not provided.',
  })
  @ApiResponse({ status: 200, description: 'Token generated successfully' })
  @ApiResponse({ status: 500, description: 'Failed to generate token' })
  getToken(@GetUserId('id') userId?: number) {
    return this.smallcaseService.getToken(userId)
  }
}
