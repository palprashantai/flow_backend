import { BadRequestException, Body, Controller, Get, Param, Post, UnauthorizedException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiExcludeEndpoint, ApiBody } from '@nestjs/swagger'

import { CreateSubscriptionDto, CreatePlanDto, CreateOrderDto, CreatePortfolioOrderDto } from './payment.dto'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { PaymentService } from './payment.service'

@ApiTags('Payment')
@Controller('appApi/payment')
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

  @Post('apply-offer')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Apply an offer to a plan' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['offerCode'],
      properties: {
        offerCode: { type: 'string', example: 'SGIND79' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Offer applied successfully',
  })
  async applyOffer(@GetUserId('id') userId: number, @Body('offerCode') offerCode: string) {
    if (!offerCode) {
      throw new BadRequestException('offerCode are required')
    }
    return this.paymentService.applyOffer(offerCode)
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
