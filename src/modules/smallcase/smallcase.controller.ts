import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import {
  ConnectTransactionDto,
  CreateTransactionDto,
  DeleteAuthResponseDto,
  GetAuthResponseDto,
  MapSmallcaseAuthDto,
  MapSmallcaseAuthResponseDto,
} from './smallcase.dto'
import { SmallcaseService } from './smallcase.service'

@ApiTags('Smallcase')
@Controller('appApi/smallcase')
export class SmallcaseController {
  constructor(private readonly smallcaseService: SmallcaseService) {}

  @Get('auth')
  @Auth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user Auth ID',
    description: 'Retrieves the Smallcase Auth ID for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Auth ID retrieved successfully',
    type: GetAuthResponseDto,
    schema: {
      example: {
        success: true,
        authId: '67b834897b7b6d05ad63f1d',
        message: 'Auth ID retrieved successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found or no Auth ID' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAuthId(@GetUserId('id') userId: number): Promise<GetAuthResponseDto> {
    console.info(`getAuthId called for user: ${userId}`)
    const result = await this.smallcaseService.getUserAuthId(userId)
    return result
  }

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
  @ApiOperation({ summary: 'Create a Smallcase transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createTransaction(@Body() dto: CreateTransactionDto, @GetUserId('id') userId: number) {
    return this.smallcaseService.createTransaction(dto, userId)
  }

  @Post('connect')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Broker' })
  @ApiResponse({ status: 201, description: 'Broker Linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async connect(@Body() dto: ConnectTransactionDto, @GetUserId('id') userId: number) {
    return this.smallcaseService.connect(dto, userId)
  }

  @Post('map-auth')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Map Smallcase Auth Token with User Account',
    description: 'Decodes Smallcase Auth Token to get smallcaseAuthId and maps it with user account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Smallcase account mapped successfully',
    type: MapSmallcaseAuthResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Smallcase account mapped successfully',
        data: {
          smallcaseAuthId: '67b834897b7b6d05ad63f1d',
          transactionId: 'TRX_a2f301e3ab6b4e48a68cc0a52a6abab2',
          broker: 'groww',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid token or transaction data' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async mapSmallcaseAuth(@Body() dto: MapSmallcaseAuthDto, @GetUserId('id') userId: number): Promise<MapSmallcaseAuthResponseDto> {
    console.log(`mapSmallcaseAuth called for user: ${userId}, transaction: ${dto.transactionId}`)
    const result = await this.smallcaseService.mapSmallcaseAuthToken(dto, userId)
    return result
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

  @Delete('auth')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user Auth ID',
    description: 'Removes the Smallcase Auth ID from user account (disconnects Smallcase).',
  })
  @ApiResponse({
    status: 200,
    description: 'Auth ID deleted successfully',
    type: DeleteAuthResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Auth ID deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteAuthId(@GetUserId('id') userId: number): Promise<DeleteAuthResponseDto> {
    console.log(`deleteAuthId called for user: ${userId}`)
    const result = await this.smallcaseService.deleteUserAuthId(userId)
    return result
  }
}
