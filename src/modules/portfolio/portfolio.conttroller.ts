import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { PortfolioService } from './portfolio.service'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/auth/auth.guard'
import { FilterPortfolioDto, GetPortfolioRebalanceDto } from './portfolio.dto'
import { getAvailableDurationsForPortfolio } from './portfolio.reposistory'
import { Response } from 'express'
import * as fs from 'fs'
import { PortfolioDetailReposistory } from './portfolio-detail.reposistory'

@ApiTags('Portfolio')
@Controller('appApi/portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly portfolioDetailReposistory: PortfolioDetailReposistory
  ) {}

  @Get('home')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({
    summary: 'Get home screen data',
    description: 'Returns numbers data, investment insights, market view, indices, FAQs, top gainers/losers, and research summary.',
  })
  @ApiResponse({ status: 200, description: 'Home screen data loaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHomeData(@GetUserId('id') userId: number) {
    return await this.portfolioService.getHomeData(userId)
  }

  @Get('list')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get list of portfolios with filters' })
  @ApiQuery({ name: 'search', required: false })
  async listPortfolios(@Query() filterDto: FilterPortfolioDto, @GetUserId('id') userId?: number) {
    return this.portfolioService.getFilteredPortfolios(filterDto, userId)
  }

  @Get('details')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get service portfolio details by slug' })
  @ApiQuery({ name: 'slug', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Service portfolio details returned successfully' })
  @ApiResponse({ status: 400, description: 'Slug is missing' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getServicePortfolio(@Query('slug') slug: string, @GetUserId('id') userId?: number) {
    if (!slug) {
      throw new BadRequestException('Slug parameter is required')
    }
    return await this.portfolioService.getServicePortfolio(slug, userId)
  }

  @Post('live-performance/:serviceId')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({
    summary: 'Get merged portfolio and asset class history by serviceId (with pagination and asset filtering)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 1000 })
  @ApiQuery({
    name: 'assetId',
    required: false,
    type: Number,
    example: 1,
    description: 'Filter by specific asset ID from tbl_asset_class_history',
  })
  @ApiParam({
    name: 'serviceId',
    required: true,
    type: Number,
    example: 20,
    description: 'Service ID for which history is fetched',
  })
  @ApiQuery({
    name: 'duration',
    required: false,
    type: String,
    enum: ['1M', '3M', '6M', '1Y', '3Y', '5Y'],
    description: 'Filter by duration like 1M 3M 6M 1Y 3Y 5Y from today based on sdate',
  })
  @ApiResponse({
    status: 200,
    description: 'Merged portfolio history returned successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          items: [
            {
              sdate: '2025-08-09',
              portfolio_asset_amount: 2526.35,
              asset_amount: 2526.35,
              asset_id: 2,
            },
          ],
          total: 7,
          page: 1,
          limit: 10,
          totalPages: 1,
          filters: {
            serviceId: 21,
            assetId: 2,
            duration: '1M',
          },
        },
        available: ['1M', '3M', '6M', '1Y'],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 404, description: 'No history found for given serviceId' })
  async getMergedPortfolioHistory(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
    @Query('duration') duration?: string,
    @Query('assetId') assetId?: number
  ) {
    // Validate assetId if provided
    const parsedAssetId = assetId ? Number(assetId) : undefined

    if (assetId !== undefined && (isNaN(parsedAssetId!) || parsedAssetId! <= 0)) {
      throw new BadRequestException('Invalid assetId parameter')
    }

    const available = await getAvailableDurationsForPortfolio(serviceId)

    const result = await this.portfolioService.getPortfolioHistoryMerged(serviceId, {
      page: Number(page),
      limit: Number(limit),
      duration,
      assetId: parsedAssetId,
    })

    return {
      status: 'success',
      data: result,
      available,
    }
  }

  @Get('getPortfolioPlans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Portfolio Plans by Service ID' })
  @ApiQuery({
    name: 'service_id',
    required: true,
    type: Number,
    description: 'Service ID to fetch associated plans',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched plans',
    schema: {
      example: {
        success: true,
        message: 'Plans retrieved successfully',
        result: {
          plans: [
            {
              id: '1',
              planid: 'plan_xyz123',
              title: '3 Months',
              price: '999',
            },
          ],
          dos: ['Seamlessly place orders in 1 click', 'Get regular re-balance updates'],
          donts: ['Easily start SIPs for disciplined investing'],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Service ID is required.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getPlans(@Query('service_id', ParseIntPipe) service_id: number) {
    return this.portfolioService.getPortfolioPlans(service_id)
  }


  
  @Post('rebalance')
  @ApiBearerAuth()
  @Auth()
  @ApiOperation({ summary: 'Get portfolio rebalance instructions' })
  @ApiResponse({ status: 200, description: 'Rebalance instructions fetched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or missing parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPortfolioRebalance(@GetUserId('id') userId: number, @Body() dto: GetPortfolioRebalanceDto) {
    return this.portfolioDetailReposistory.getPortfolioRebalance(userId, dto.serviceid)
  }

  @Post('portfolio/stocks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get portfolio stocks by service ID' })
  @ApiQuery({
    name: 'service_id',
    required: true,
    type: Number,
    description: 'Service ID to fetch associated stocks',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Portfolio retrieved successfully',
        result: {
          portfolio: [
            { name: 'Stock A', weight: 25.5, price: 1500.0, quantity: 10 },
            { name: 'Stock B', weight: 20.0, price: 1200.0, quantity: 5 },
          ],
          dos: ['Seamlessly place orders in 1 click', 'Get regular re-balance updates'],
          donts: ['Easily start SIPs for disciplined investing'],
        },
      },
    },
  })
  async getPortfolioStocks(@Query('service_id', ParseIntPipe) service_id: number) {
    return this.portfolioService.getPortfolioStocks(service_id)
  }

  @Post('export-rebalance-timeline')
  @ApiBearerAuth()
  @ApiQuery({ name: 'serviceId', required: true, type: Number })
  @ApiOperation({ summary: 'Export rebalance timeline entries to Excel by serviceId' })
  async exportRebalanceTimeline(@Query('serviceId') serviceId: number, @Res() res: Response) {
    const filePath = await this.portfolioService.exportRebalanceTimeline(serviceId)

    res.download(filePath, (err) => {
      // After sending the file, delete it from the server
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting exported file:', unlinkErr.message)
      })

      if (err) {
        console.error('Error sending file:', err.message)
        throw new InternalServerErrorException('Error while sending the file')
      }
    })
  }
}
