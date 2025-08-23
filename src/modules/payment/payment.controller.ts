import { Body, Controller, Get, Param, Post, UnauthorizedException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiExcludeEndpoint } from '@nestjs/swagger'

import { CreateTransactionDto, CreateSubscriptionDto, CreatePlanDto, CreateOrderDto, CreatePortfolioOrderDto } from './payment.dto'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { PaymentService } from './payment.service'

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('razorpay/key')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve Razorpay API keys for the logged-in subscriber' })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'API retrieved successfully',
        result: {
          apikey: 'rzp_test_abc123456789',
          secretkey: 'secret_abc123456789',
        },
      },
    },
  })
  async getRazorPayKey(@GetUserId('id') userId: number) {
    if (!userId) {
      throw new UnauthorizedException('Invalid user token')
    }
    return this.paymentService.getRazorPayKey(userId)
  }

  @Get('smallcase/order')
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
    const result = await this.paymentService.getLatestTransactionData()

    return {
      success: true,
      message: 'Latest order retrieved successfully',
      result,
    }
  }

  @Post('smallcase/transaction')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Smallcase transaction (Razorpay)' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createTransaction(@Body() dto: CreateTransactionDto, @GetUserId('id') userId: number) {
    return this.paymentService.createTransaction(dto, userId)
  }

  @Get('smallcase/fetchtoken')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate JWT token',
    description: 'Returns a JWT token for the given authId or a guest token if not provided.',
  })
  @ApiResponse({ status: 200, description: 'Token generated successfully' })
  @ApiResponse({ status: 500, description: 'Failed to generate token' })
  getToken(@GetUserId('id') userId?: number) {
    return this.paymentService.getToken(userId)
  }

  @Post('razorpay/subscription')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Razorpay subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.paymentService.createSubscription(dto)
  }

  @Post('razorpay/plan')
  @Auth()
  @ApiBearerAuth() // @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Create a Razorpay plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.paymentService.createPlan(dto)
  }

  @Post('razorpay/create-order')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Razorpay order' })
  @ApiResponse({
    status: 200,
    description: 'Razorpay order created successfully',
    schema: {
      example: {
        success: true,
        order: {
          id: 'order_Mv88kP9LgEq7zw',
          entity: 'order',
          amount: 1000,
          currency: 'INR',
          receipt: 'receipt_order_162519599',
          status: 'created',
          attempts: 0,
          created_at: 1625195999,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Failed to create Razorpay order' })
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentService.createOrder(dto)
  }

  @Get('order/:orderId')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Fetch Razorpay order by ID' })
  @ApiParam({ name: 'orderId', type: String, example: 'order_Qu90f1VoLVRmYR' })
  @ApiResponse({
    status: 200,
    description: 'Returns order details',
    schema: {
      example: {
        success: true,
        order: {
          id: 'order_Qu90f1VoLVRmYR',
          entity: 'order',
          amount: 50000,
          currency: 'INR',
          status: 'created',
          receipt: 'receipt_123',
          notes: {},
          created_at: 1657896543,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('orderId') orderId: string) {
    return this.paymentService.getOrderById(orderId)
  }

  @Post('payment-success-portfolio')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Handle payment success for portfolio purchase' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or missing token' })
  async paymentSuccessPortfolio(@Body() dto: CreatePortfolioOrderDto, @GetUserId('id') userId: number) {
    return this.paymentService.paymentSuccessPortfolio(dto, userId)
  }
}
